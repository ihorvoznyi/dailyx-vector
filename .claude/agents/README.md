# Subagents

Six agents. Each has one job, the narrowest tool set that job needs, and the cheapest model that does it well.

| Agent | Model | Tools | Job |
|---|---|---|---|
| `researcher` | Sonnet | read-only + web | Finds things, in the repo or online. Says so when it doesn't. |
| `planner` | **Opus** | read-only | Turns a stage into a numbered spec with runnable exit criteria. |
| `implementer` | Sonnet | read/write | Builds the plan. Self-check is the gate commands, nothing more. |
| `plan-verifier` | Sonnet | read-only | Is every requirement done? Coverage only. Runs first of the reviewers. |
| `architecture-reviewer` | Sonnet | read-only | Design, boundaries, error handling, observability, dead code. |
| `dead-code-analyzer` | Sonnet | read-only | Unused-export report, attributed to the current diff. |

Plus a **domain gate** you write per project — see `templates/domain-gate.agent.md`. That is the
one agent that cannot be generic: it encodes the invariants that make *this* system correct.

## Order

```
planner → implementer → plan-verifier → architecture-reviewer ┐
                             ↑                                 ├→ fix loop → dead-code
                             └──────── FAIL ────  <domain gate> ┘
```

`plan-verifier` runs **before** the design reviewers. Reviewing the architecture of work that is
missing three requirements wastes the review. Coverage is cheap and it gates the expensive passes.

## Model policy

Opus for decisions that compound — planning, schema, protocol contracts, state machines, anything
where being wrong is discovered three stages later. Sonnet for everything else, **including all
review**. Review is execution: read the diff, run the code, cite lines.

Escalate to Opus when an agent loops on the same error more than three times, or when a bug feels
architectural rather than local.

## Gates

Agents do not hardcode `npm run typecheck`. Every project's `AGENTS.md` carries a `## Gates`
section — an ordered list of shell commands — and agents run those. `install.sh` writes a starter
one from the detected package manager.

```md
## Gates

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm knip`
```

**Run each as a separate Bash call. Never chain them with `&&`.** See "Runtime facts" below.

## Runtime facts — measured, not theorised

Three failure modes were measured over one long harness session. Every agent file in this kit is
shaped by them, and the `agent-harness-runtime` skill carries the detail.

| | What happens | Evidence |
|---|---|---|
| **Stall** | A long report emitted as one message dies mid-stream and is lost entirely | `plan-verifier` 2 failures of 2 runs · `architecture-reviewer` 1 of 3 · a bounded twelve-row gate contract **0 of 2** · write agents, which emit hundreds of small messages, 1 of 9 |
| **Clobber** | A finished agent is re-invoked **eight** more times with no instruction; the last no-op reply replaces the report as its return value | Exactly eight, across five agents of different types and sizes. A 45,076-char spec came back as one sentence; a 9,578-char gate table came back as `Done.` |
| **Watchdog** | One Bash call that runs for minutes with no output is killed at **600 s without progress**, whatever the agent was doing | An implementer died on `typecheck && lint && test && dead-code && build` as a single chained call — work complete, tests written, killed on the final verification |

Transcript size is not the cause — 2.6 MB succeeded, 1.0 MB failed. What differs is *shape*: write
agents generate constantly; read-only agents accumulate a large context and then attempt one
enormous generation. **Bounded output survives; unbounded output dies.**

The three rules that follow:

1. **Reports go to a file, never to the final message.** Every read-only agent is handed a
   `REPORT` / `SPEC` path outside the repository and appends to it incrementally. Its returned
   message is two lines: the path and a verdict.
2. **Append as each item is settled**, never buffer the whole table. A stall then costs one row.
3. **Run gate commands separately.** Each returns fast and each counts as progress.

Recovery, if a report is lost anyway:
`~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl` holds every message. The real
report is the text block at index `len − 9`, not the last one.

## Skills

Agents reference skills **by name**; skill bodies are never copied into an agent prompt. The kit
ships the skills it routes to — an agent must never name one that only exists on the author's
machine, or the harness silently degrades on every other machine.

| Area | Skill |
|---|---|
| All code | `karpathy-guidelines` |
| Server, data, integrations, jobs | `backend-engineering` |
| Client code — components, state, data fetching, the file tree | `frontend-engineering` |
| Structure, schema, boundaries, an expensive-to-reverse choice | `system-architecture` |
| User-facing surface, layout, motion, states | `interface-design` — then its `landing.md` (conversion) or `app.md` (product UX) |
| Writing or dispatching a subagent | `agent-harness-runtime` |

All six are copied into the project by the kit and committed with it, so they resolve on every
clone, in CI, and on a machine that has never seen the kit. A project's
`AGENTS.md` may add rows for skills installed on that machine — anything it names must actually be
installed there, or the row is a dead reference.

`planner` carries the implementer's full skill set, because it plans work that will be judged
against it.

Skills that do **not** belong in an agent's automatic set: whole-codebase audits (they are not
per-diff), and anything marked `disable-model-invocation: true` (user-invoked only, run from the
main session).

## Insights

`INSIGHTS.md` lives beside the code it describes — `src/orders/INSIGHTS.md`, never a central file.
A repo-wide insights document gets read in full by every agent and stops being affordable within a
month.

| Agent | Reads |
|---|---|
| `planner` | insights for the modules the stage touches |
| `implementer` | insights only in folders it is editing |
| `architecture-reviewer` | insights in folders the diff touches |
| `/retro` | writes new ones |

Nobody reads the whole repository's insights. That is what keeps this cheap as the repo grows.

## Interviewing is the main session's job, never a subagent's

An interview works in rounds: ask the whole frontier of currently-answerable questions, numbered,
each with a recommended answer; wait; recompute the frontier from what came back.

A subagent cannot do this. It has no channel to the user and returns exactly once, so an
"interviewer" agent would invent the answers — the precise failure the interview exists to prevent.
Hence the split: `/implement` step 0 holds the rounds in the main session, and `planner` inherits
only the question *format* for the single round it gets.

## Deliberately not built

- **test-writer** — a dedicated agent costs more than it returns at small-to-mid size. The
  `planner` names the handful of load-bearing tests per stage; the `implementer` writes them inline.
- **spec-writer** — if a specification already exists in `docs/`, there is nothing to generate.
- **doc-writer** — revisit only when documentation starts lagging the code.
- **worktree isolation by default** — a solo developer merging two agent-authored branches pays more
  than parallelism returns. Everything runs on the current branch; opt in per stage when the planner
  identifies a genuinely file-disjoint track. Never parallelise the money path.

## Sources

- Anthropic, *Claude Code subagents* — one job per agent, least-privilege tools, separate context
  windows: https://docs.claude.com/en/docs/claude-code/sub-agents
- Anthropic, *Writing effective tools for agents* — narrow tool grants and explicit output contracts
- Andrej Karpathy on LLM coding pitfalls — encoded in the `karpathy-guidelines` skill:
  https://x.com/karpathy/status/2015883857489522876
- Architecture Decision Records (Michael Nygard) — the format reviewers cite against
