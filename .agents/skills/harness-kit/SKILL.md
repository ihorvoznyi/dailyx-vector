---
name: harness-kit
description: >
  Install and maintain the personal agentic-engineering harness (subagents, slash commands,
  AGENTS.md, gates, hooks) in a repository, from the versioned kit at
  ~/workspace/harness-kit. Use when setting up Claude Code or Codex in a new or existing project,
  when asked to "set up the harness", "install my agents", "wire up the hooks", "add AGENTS.md",
  "bootstrap this repo for agents", or when an existing project's harness needs updating to match
  the kit. Prefer this over writing a harness from scratch — the kit already encodes measured
  runtime behaviour and this engineer's conventions.
---

# Harness kit

The kit lives at `~/workspace/harness-kit` and is a git repo. Installing **copies** it into the
target repo, where it is committed with the code — the harness has to work on a teammate's clone
and in CI, not only on the machine that has the kit.

```
harness-kit/
  agents/        6 subagents + README (roster, order, model policy, runtime facts)
  commands/      /implement /retro /grill /wait-what
  skills/        agent-harness-runtime · karpathy-guidelines · grilling · harness-kit
                 backend-engineering · frontend-engineering · system-architecture
                 interface-design/  SKILL.md (shared) · landing.md · app.md
  rules/         ENGINEERING.md — the stack-agnostic charter
  templates/     AGENTS.md · INSIGHTS.md · domain-gate.agent.md
                 settings.local.json · githooks/pre-commit
  codex/         reviewer.toml · ui-qa.toml
  install.sh
```

## Installing into a repo

```bash
~/workspace/harness-kit/install.sh            # current directory
~/workspace/harness-kit/install.sh --dry-run  # show what it would do
~/workspace/harness-kit/install.sh /path/to/repo
```

It is idempotent. It copies agents, commands, skills and the charter (to `.claude/ENGINEERING.md`),
copies templates only when absent, and wires `core.hooksPath` to `.githooks`.

Re-running refreshes kit-owned files, **except any the project has edited** — those are kept and
reported as `keep (edited here)`. The difference is tracked by hash in
`.claude/.harness-kit-manifest`, which is committed with the rest. Commit `.claude/`, `.agents/`
and `.githooks/`: that is the point of the install.

## After installing — the part that cannot be automated

`install.sh` leaves `AGENTS.md` as a template with `TODO` markers. Fill them, in this order:

1. **Purpose and blast radius.** One line on what the project is, then `**If this breaks**: <what
   actually goes wrong>`. Every agent reads this first and it is what makes them cautious in the
   right places.
2. **`## Gates`** — the ordered shell commands that constitute "verified". Agents run these
   literally, as separate calls. Get them right or every self-check is wrong.
3. **Approval-required paths.** The files no agent may touch without stating the change first.
   Name them explicitly; "be careful around billing" is not enforceable.
4. **Hard rules** — the invariants that are true of *this* system and nowhere else. Each one should
   carry its reason. A rule without a reason gets argued with; a rule with one gets followed.
5. **A domain gate**, if the project has a path where being wrong costs money, data or trust. Copy
   `templates/domain-gate.agent.md` to `.claude/agents/<name>-reviewer.md` and fill in the
   invariant table. This is the one agent that cannot be generic.

## Conventions the kit assumes

- **One canonical rules file.** `AGENTS.md` — read by both Claude Code and Codex, no `CLAUDE.md`,
  no symlink, no index file. Never maintain two copies of the same rules — one repo here already
  carries a 167-line duplicate and they will drift.
- **The kit ships every skill it routes to.** An agent or template that names a skill living only
  in someone's `~/.claude/skills` produces a harness that degrades silently on every other machine.
  Add a row to a project's routing table only for a skill installed everywhere that repo runs.
- **`INSIGHTS.md` beside the code**, never a central file. A repo-wide insights document gets read
  in full by every agent and stops being affordable within a month.
- **`PLAN.md`, `HANDOFF.md`, `CLAUDE.local.md` are gitignored.** The install adds them.
- **Context reset, not `/compact`**, on long sessions. The implementer writes `HANDOFF.md`; the next
  session opens with *"Read PLAN.md and HANDOFF.md before doing anything."*
- **Everything runs on the current branch.** Worktrees are opt-in, per stage, only for genuinely
  file-disjoint tracks.

## Updating the kit

When a retro produces a lesson that is about the *runtime* rather than one project — a new stall
shape, a tool that behaved unexpectedly, an output contract that held — it belongs in
`skills/agent-harness-runtime/SKILL.md` here, not in the project's `INSIGHTS.md`. Commit it and
every project gets it on the next session.
