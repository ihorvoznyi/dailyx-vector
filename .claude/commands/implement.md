---
description: Run a PLAN.md stage end to end — plan, build, verify coverage, review.
argument-hint: <stage number> [--multi]
---

Run stage $1 of `PLAN.md`.

## Sequence

0. **grill** — before dispatching anything, run a `grilling` session on stage $1 yourself, in this
   session. A subagent returns once and cannot hold rounds with me; this is the only place the
   interview can actually happen. Read the stage, `AGENTS.md` and the relevant ADRs first so you're
   asking about decisions, not facts. Skip only if the stage is unambiguous and I say so.

1. **planner** — read `PLAN.md` stage $1, `AGENTS.md`, relevant ADRs, and `INSIGHTS.md` for the
   modules this stage touches. Pass it the resolved decisions from step 0, and a `SPEC` path
   outside the repository. Append the returned spec to `PLAN.md`. Stop for my approval.

2. **implementer** — propose a sprint contract. On approval, build. Self-check is the `## Gates`
   commands from `AGENTS.md`, run separately, and nothing more.
   With `--multi`: launch one implementer per file-disjoint track the planner identified. Never
   split a critical path across implementers.

3. **plan-verifier** — coverage only. Give it a `REPORT` path outside the repository. FAIL sends
   findings back to step 2 and the cycle repeats. Do not proceed on PARTIAL.

4. **architecture-reviewer** and the project's **domain gate** in parallel, each with its own
   `REPORT` path. Skip the domain gate only if the diff touches no file in its scope.

5. **Fix loop** — BLOCKING findings go back to `implementer`. Re-run only the reviewer that failed,
   against only the fixes. Expect two rounds; three means the stage was under-planned and the
   planner should be re-run.

6. **dead-code check** — run the dead-code gate. Then summarise: what shipped, what's stubbed,
   what's deferred.

## Rules

- Stop at every gate. Do not run the next agent on a FAIL.
- Every read-only agent gets a `REPORT`/`SPEC` path outside the repo and returns a path + verdict,
  never the report itself. Long returned messages stall and are lost, and a finished agent gets
  re-invoked eight more times with its last reply overwriting the real one.
- Work on the current branch.
- Do not write tests beyond those the planner named as load-bearing.
- If a `Done when:` in the stage cannot be verified by running something, say so before building,
  not after.
