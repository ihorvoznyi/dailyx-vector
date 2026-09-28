---
description: Retrospective on a completed workflow run — token cost, agent sequence, insights. Manual only.
argument-hint: [--deep]
---

Analyse the workflow run in this session. **Never run automatically.**

Default source is this conversation's context. `--deep` additionally reads `PLAN.md`, `HANDOFF.md`,
the git log for the stage, and the modules' `INSIGHTS.md`.

## Report — to chat

```
## Run
Stage · agents launched, in order · wall-clock

## Token cost
| Agent | Model | Approx tokens | Share |
Largest consumer, and whether that was justified by what it produced.

## Friction
What each agent struggled with. What was easy. Where a gate caught something real —
and where a gate cost tokens and found nothing.

## Duplicated work
Information re-derived by more than one agent. Files read repeatedly. Context that
should have been in AGENTS.md, PLAN.md or an INSIGHTS.md instead of being rediscovered.

## Missed
What every agent walked past that later turned out to matter.

## Recommendations
Concrete and applicable next stage: a rule to add to AGENTS.md, a model to downgrade,
a gate to drop, a check to move earlier, an insight to write down.
```

## Then write

- Module-specific lessons → `INSIGHTS.md` in that module's folder. One line each, concrete, no
  theory. This is what `planner` and `implementer` read next time.
- Run summary → append to `docs/retro/ledger.md` with the date, stage, agent sequence and token
  total, so cost per stage is comparable over time. **This ledger is the only way to see whether the
  harness is getting cheaper or more expensive.**
- Anything that was a property of the *runtime* rather than this project — a new stall, a new
  watchdog kill, a tool that behaved unexpectedly — goes to the `agent-harness-runtime` skill in the
  harness kit, not to this repo.

## Rules

- Be specific. "The implementer used a lot of tokens" is worthless; "the implementer re-read the
  schema four times because the plan didn't quote it" is actionable.
- Name gates that earned nothing. A harness only stays cheap if checks that never fire get removed.
- Propose, don't apply. Recommendations go to me for approval.
