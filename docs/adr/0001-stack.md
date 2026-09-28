# ADR 0001 — Stack

- **Status:** Accepted, Sep 28, 2026
- **Deciders:** Ihor
- **Spec:** `docs/SPEC.md` → Architecture and stack; decisions D1 and D8

## Context

Vector is a personal tool for one user (D1). Through M1, every input is manual: quick-log, balances,
payments. The first sync job arrives in M2 (Upwork); rate-limited money connectors arrive in M3.
Monobank allows 1 statement call per 60 s, so backfilling a year takes about 36 minutes. IBKR Flex
generates a report that then has to be polled. The owner already has GitHub, Vercel (business),
Neon and Cloudflare accounts.

## Decision

A pnpm-workspace TypeScript monorepo with **one deployable through M1**: Next.js on Vercel, backed by
Neon Postgres through Drizzle. Background jobs arrive with M2/M3. From M3 they run on Cloudflare
Workers (Cron Triggers + Queues), not a long-lived Node worker.

### Pinned versions

These are the latest stable versions on npm as of Sep 28, 2026. T01 installs these exact versions.
If a set fails to resolve together, T01 changes it here and says why.

| Package | Version | Note |
| --- | --- | --- |
| Node.js | 24 LTS | `engines` and `.nvmrc`; local is 24.16.0 |
| pnpm | 12.6.0 | `packageManager` field |
| typescript | **6.0.3** | 7.0.2 is `latest`, but typescript-eslint 8.70.1 supports `>=4.8.4 <6.1.0`. Move to 7.x when typescript-eslint supports it. |
| next | 16.3.6 | App Router |
| react / react-dom | 19.3.0 | |
| drizzle-orm | 0.45.3 | |
| drizzle-kit | 0.31.11 | SQL migrations committed |
| @neondatabase/serverless | 1.1.0 | Driver choice (HTTP vs WebSocket for transactions) is made in T05 |
| better-auth | 1.7.6 | Google provider; sign-in restricted to one email |
| zod | 4.6.5 | Every boundary |
| vitest | 5.0.2 | Unit and fixture tests |
| @playwright/test | 1.63.0 | e2e and visual tests |
| eslint | 10.11.0 | Flat config in `packages/config` |
| typescript-eslint | 8.70.1 | |
| prettier | 3.9.9 | |
| knip | 6.38.0 | Dead-code gate |
| wrangler | 4.142.0 | Not installed until M3 |

### Environments

| | dev | preview | production |
|---|---|---|---|
| Web | `pnpm dev` | Vercel preview per PR | Vercel production |
| Database | Neon `dev` branch | Neon branch per preview, via the Vercel integration, seeded | Neon `main` |
| Auth | Google OAuth client with a localhost redirect | See the preview risk below | Google OAuth client with the production redirect |

## Consequences

- One deploy, one set of secrets, and one place to look through M1.
- Without RLS (D1), user isolation depends on one data-access helper in `packages/db`. Any query
  that bypasses it is a review blocker.
- Better Auth owns the `user`, `session`, `account` and `verification` tables. The domain Account
  table is `money_accounts`.
- **Preview sign-in:** Google needs exact redirect URIs, and Vercel preview URLs change on every
  deploy. T06 uses Better Auth's OAuth proxy plugin (verify it exists in 1.7.x) or a stable preview
  alias.
- Cloudflare Workers can't run pg-boss, so M3 jobs use Queues and Cron Triggers. A job has to work
  in chunks: the Monobank backfill runs one call per message, with a 60 s delay between messages.
- Encryption keys for source tokens live in the job runtime's secret store (from M2), never in the
  database.

## Rejected

- **Supabase (DB + Auth + RLS)** — the owner chose Neon; with one user, RLS guards nothing.
- **Worker on Fly with pg-boss from P0** — no job exists until M2. It would add a second deploy and
  secret store for nothing.
- **Magic-link or passkey auth** — needs an email provider or more setup. Google OAuth with one
  allowed email is enough for one user.
- **TypeScript 7** — typescript-eslint doesn't support it yet.
