---
description: Run a PLAN.md stage end to end. An Opus orchestrator plans it, Sonnet workers build in parallel git worktrees, the orchestrator integrates, reviewers verify, then it's delivered to master.
argument-hint: [stage] — defaults to the current stage in PLAN.md
---

Run stage $1 of `PLAN.md`. With no argument, run the stage marked `**Current stage**`.

The owner runs this loop **without confirmations**. Don't stop to ask. Decide the open questions
yourself with the recommended defaults and record them under the stage's "Resolved" block in
`PLAN.md`. Stop only for owner-only inputs: credentials, accounts, destructive actions.

## Sequence

1. **Resolve.** Read the stage, `AGENTS.md` and the relevant ADRs. Settle open decisions and write
   them into `PLAN.md`. Commit anything workers need to read, because worktrees branch from `HEAD`.
2. **Run the `implement-stage` workflow** (`.claude/workflows/implement-stage.js`) with
   `args: { stage, title, scratch }`, where `scratch` is the session scratchpad directory. It:
   - **Plan:** `orchestrator` (Opus) writes the spec and returns waves of file-disjoint tasks.
   - **Build:** one `implementer` (Sonnet) per task, each in its own git worktree, in parallel
     within a wave.
   - **Integrate:** `orchestrator` squash-merges each wave into `master` and runs the gates.
   - **Review:** `plan-verifier` and `architecture-reviewer` run in parallel, each writing to a
     report file.
   - **Fix:** blocking findings go back to a worker. At most 2 rounds; a third means the stage was
     under-planned.
   - **Deliver:** `orchestrator` runs the dead-code gate, advances `**Current stage**`, and pushes.
3. **Summarise** in a few lines: what shipped, what's stubbed, what's deferred. Then start the next
   stage, unless it's blocked on the owner.

## Rules

- Models: orchestrator and researchers are Opus; workers and reviewers are Sonnet.
- Every read-only agent writes its report to a file and returns only a path and a verdict.
- Gates run as separate commands, never chained.
- A money-path critical chain stays in one task.
