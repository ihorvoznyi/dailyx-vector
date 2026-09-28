---
name: agent-harness-runtime
description: >
  Measured failure modes of Claude Code subagents and how to write around them. Load BEFORE
  writing a subagent definition, dispatching subagents, or designing a multi-agent workflow — and
  whenever a subagent returns "Done." or one sentence instead of the report it was asked for, a
  long agent report arrives truncated or empty, a Bash call is killed after several minutes, or a
  review/verification pass produces nothing. Trigger on: "write a subagent", "create an agent",
  "the agent returned nothing", "agent output was lost", "agent timed out", "600 seconds",
  "report came back empty", "multi-agent workflow", "parallel agents", "agent output contract".
---

# Agent harness runtime

Three failure modes, measured over long harness sessions on real work. They are properties of the
runtime, not of any project, and they are expensive to rediscover. Every agent definition should be
shaped by them.

## 1. Stall — long single generations die

A read-only agent that accumulates a large context and then attempts one enormous generation loses
the whole thing. The message dies mid-stream and nothing is returned.

| Agent shape | Failures |
|---|---|
| Coverage verifier, one row per requirement, up to 36 rows | **2 of 2** |
| Architecture reviewer, unbounded finding list | **1 of 3** |
| Domain gate, fixed twelve-row contract | **0 of 2** |
| Write agents, hundreds of small messages | 1 of 9 |

Transcript size is not the cause — a 2.6 MB session succeeded, a 1.0 MB session failed. What
differs is *shape*. **Bounded output survives; unbounded output dies.**

## 2. Clobber — finished agents are re-invoked and overwrite themselves

A finished agent is re-invoked **eight** more times with no instruction. Whatever it says last
becomes its return value. Measured across five agents of different types and sizes: always exactly
eight.

- A 45,076-character plan spec came back as `I've completed the planning work.`
- A 9,578-character gate table came back as `Done.`

This is not the model losing the content. The content was generated; the return slot was overwritten.

## 3. Watchdog — a silent Bash call is killed at 600 s

One Bash invocation that runs for minutes with no output is killed after **600 seconds without
progress**, whatever the agent was doing.

An implementer died on:

```bash
npm run typecheck && npm run lint && npm test && npm run dead-code && npm run build
```

Work complete, tests written, killed on the final chained verification, leaving output nobody could
read.

---

## The rules that follow

### Reports go to a file, never to the final message

Hand every read-only agent a `REPORT` (or `SPEC`) path **outside the repository** in its task
prompt. The agent writes there. Its returned message is two lines: the path and a verdict.

```bash
cat > "$REPORT" <<'EOF'
## Review — <scope>
**Verdict:** PASS | FAIL
EOF
```

Quote the heredoc delimiter (`<<'EOF'`) so backticks, `$` and quotes stay literal. Reports are full
of both.

This survives the stall (only the tail is lost) and the clobber (the file is not the return value).

### Append as each item is settled — never buffer

Write each finding, each table row, each spec section the moment it is settled. Do not accumulate
and flush at the end; that reintroduces exactly the single large generation that dies.

```bash
printf '| 1 | catalog snapshot | DONE | `src/orders/repo.ts:88` | ran `pnpm test -- snapshot` |\n' >> "$REPORT"
```

### Bound the output contract

The only agent that never failed had a fixed twelve-row contract. Give agents a ceiling: cap the
finding count, keep table cells to a `file:line` and a command, put reasoning in a separate section
and only for items that failed.

### Run gate commands as separate calls

Never chain verification with `&&`. Each command returns fast and each return counts as progress.

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Same for `build` and dead-code passes.

### Recovery when a report is lost anyway

```
~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl
```

holds every message the agent produced. The real report is the text block at index **`len − 9`**,
not the last one — the last nine are the clobbering re-invocations.

---

## Two more things that are not failure modes but govern agent design

### An interview cannot be delegated

An interview works in rounds: ask the whole frontier of currently-answerable questions, wait,
recompute the frontier from what came back. A subagent has no channel to the user and returns
exactly once, so an "interviewer" subagent invents the answers — the precise failure the interview
exists to prevent. Hold interviews in the main session; give subagents the question *format* for the
single round they get.

### Review is execution, not judgement

Reading a diff, running the code and citing lines is execution work. Run it on the cheaper model.
Reserve the expensive model for decisions that compound — planning, schema, protocol contracts,
state machines. Escalate mid-task only when an agent loops on the same error more than three times,
or when a bug is architectural rather than local.
