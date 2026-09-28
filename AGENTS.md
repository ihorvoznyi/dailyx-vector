# AGENTS.md — dailyx-vector

Vector is Ihor's personal operating dashboard: it replaces guessing with numbers, with the freedom
ratio (recurring net income ÷ monthly cost) as the north star. What ships next is **P0 → M1**, the
acquisition MVP: quick-log for outreach, a funnel per channel, the weekly review, and money entered
by hand.

**If this breaks**: wrong numbers become wrong decisions. An overstated runway or freedom ratio,
pipeline counted as income, or a stale balance behind a verdict sends Ihor's hours and money the
wrong way. Nothing downstream catches it, because he is the only user and he trusts the screen.
Through M1 the outreach log and the balances exist **only in this database**, with no source to
re-sync from, so losing data means losing history. From M2 the app holds read tokens to Upwork, and
later to a bank, a broker and payment accounts. A leak exposes his finances and his clients.

**Stack:** TypeScript 6 (strict) · pnpm workspaces (`@dailyx/*`) · Next.js 16 App Router on
Vercel · Tailwind CSS v4 (token-only theme) · Neon Postgres + Drizzle · Better Auth (Google, one
allowed email) · Zod · Vitest · Playwright · Cloudflare Workers from M3 · **Charter:**
[`ENGINEERING.md`](.claude/ENGINEERING.md)
**Branching:** commit straight to `master`; no CI for now. The gates run locally and in the
pre-commit hook, and every push deploys to Vercel (D19)
**Design docs:** [`docs/SPEC.md`](docs/SPEC.md) (product, domain, metrics; decisions D1–D19) ·
[`docs/adr/`](docs/adr/) · design system: [Vector](https://claude.ai/code/artifact/7ba22b06-4d50-4fb2-9ab2-f1f1ca8f3a7e)
**Working plan:** `PLAN.md` — read it at the start of every session

---

## Layout

```
apps/web/             Next.js routes from SPEC → Screens
apps/worker/          queue jobs (arrives M2/M3; do not create earlier)
packages/core/        pure domain logic: money, metrics, stats, roi, rebalance. No I/O
packages/db/          Drizzle schema, migrations, seed, user-scoped data access   ← approval required
packages/connectors/  one folder per provider (arrives M2)
packages/ui/          Vector tokens (generated) + components as TSX
packages/config/      tsconfig, eslint, prettier presets
docs/                 SPEC.md, adr/, runbooks
```

---

## Gates

Agents run these literally, **as separate calls, never chained with `&&`**. A single chained call
that runs for minutes with no output is killed at 600 s.

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm knip`
5. `pnpm test:e2e` — only for stages that touch `packages/ui` or `apps/web`

---

## Hard rules

### Money and numbers

- **YOU MUST** store money as integer minor units plus an ISO 4217 currency, using the one `Money`
  type in `packages/core`. **NEVER** use floats for money. Rounding drift in a finance view is
  invisible until a total is wrong.
- **YOU MUST** put every formula in `packages/core` as a pure function that returns its value
  **plus its inputs**, with a fixture test. Show-the-math reads those inputs; a number without them
  can't be traced (Principle 1).
- **NEVER** sum Pipeline amounts into income or totals. Certainty is the product (Principle 2).
- **YOU MUST** emit an AuditEvent for every write that changes a number the user sees, manual
  entries included. Through M1, manual entries are the only source of truth.
- **NEVER** let a stale source drive a verdict or a total without the amber state (Principle 6).

### Data

- **YOU MUST** give every table `user_id`, and **YOU MUST** run every query through the user-scoped
  helper in `packages/db`. There is no RLS (D1), so that helper is the only isolation.
- **YOU MUST NOT** create tables for a later milestone. `docs/SPEC.md` → Domain model says when each
  table arrives.
- Store dates as UTC ISO strings. The user's timezone applies only in the UI and in scheduling.
- Validate every boundary with Zod: server-action input, env, and connector payloads.

### Sources

- Connectors are read-only and tested against recorded fixtures. **NEVER** use real credentials,
  and **NEVER** scrape a platform against its terms.
- **NEVER** log tokens, full account numbers or raw payloads. Redact at the logger.

### UI

- UI comes from `packages/ui`. **YOU MUST NOT** invent components, colours or spacing. Match the
  Vector preview; its README and preview are the acceptance reference.
- Style with Tailwind **token utilities only**. **NEVER** use arbitrary values (`bg-[#123456]`,
  `p-[13px]`) or inline style values. A missing value belongs in `tokens.json` (ADR 0002).
- **YOU MUST** build small atoms and compose them into the public components. Public components keep
  the names and props from Vector's `index.d.ts`. Variants go through `cva` + `cn`, never piles of
  booleans.
- Up and down always carry ▲ ▼ and a sign. Channels use two-letter monograms, never platform logos.
  Motion uses the `dur-*`/`ease-*` tokens and stops under `prefers-reduced-motion`.
- **NEVER** hand-edit the generated theme or `tokens.ts`. Change `tokens.json` and regenerate.

### General

- **ALWAYS** read `PLAN.md` before writing code, and work only the current stage. Read the
  `docs/SPEC.md` sections the stage names.
- **YOU MUST NOT** modify `packages/db/` (schema, migrations), the auth config (the one-email
  allowlist is the only access control), `.github/workflows/`, `.githooks/` or `.claude/` without
  stating the change and getting approval first.
- **YOU MUST NOT** swallow errors. Every catch either logs with full context or rethrows. Errors are
  typed results at boundaries; never throw across a connector boundary.
- **YOU MUST** emit a structured log on every external call:
  `{ event, durationMs, status: 'ok'|'error', error? }`. One wrapper does this for all of them —
  `withExternalCall`, in `apps/web/src/lib/observability.ts`. It's created with the first external
  call and moves to a shared package when the worker arrives. Do not write a second.
- **YOU MUST NOT** add a package without checking `package.json` and `docs/adr/0001-stack.md`
  first, or write a utility without grepping `packages/` for it.
- **YOU MUST NOT** write code the current plan step doesn't require. No speculative abstractions,
  no configurability nobody asked for.
- If behaviour differs from `docs/SPEC.md`, update the spec in the same change and say why.
- If a simpler approach exists, say so before implementing the complex one.
- Match existing style. Do not reformat files you did not author.

---

## Skills — area routing

These six are copied into `.claude/skills/` by the harness kit and committed with the repo, so
they resolve on every clone. Agents reference skills by name; bodies are never inlined.

| Area | Skill |
|---|---|
| All code | `karpathy-guidelines` |
| Server, data, integrations, jobs | `backend-engineering` |
| Client code — components, state, data fetching, the file tree | `frontend-engineering` |
| Structure, schema, boundaries, an expensive-to-reverse choice | `system-architecture` |
| User-facing surface, layout, motion, states | `interface-design` — then its `app.md` (product UX) |
| Writing or dispatching a subagent | `agent-harness-runtime` |

---

## Agent delegation

- Run a stage with `/implement [stage]`. It runs the `implement-stage` workflow:
  - `orchestrator` (Opus) plans the stage and splits it into file-disjoint tasks;
  - `implementer` workers (Sonnet), one per task, each build in a dedicated git worktree;
  - `orchestrator` squash-merges them into `master`;
  - `plan-verifier` and `architecture-reviewer` (Sonnet) review;
  - `orchestrator` delivers and pushes.
- `researcher` is Opus.
- The owner runs the loop without confirmations. Record every decision taken on the owner's behalf
  in `PLAN.md`.
- No domain gate exists yet. Write a money-reviewer (`.claude/agents/money-reviewer.md`) before M3.
- A money-path critical chain stays with one worker.

Project skills are in `.claude/skills/` and `.agents/skills/`. Reference them by name; never inline
a skill body.

---

## Environments

Deployed builds run with `NODE_ENV=production`, so `APP_ENV` is what tells environments apart.
Seeding is allowed only when `APP_ENV` is unset. Preview deploys aren't used while commits go
straight to `master` (D19).

| | dev | production |
|---|---|---|
| `APP_ENV` | unset | `production` |
| Database | Neon `dev` branch | Neon `main` |

---

## Commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm knip
pnpm format
pnpm build
```
