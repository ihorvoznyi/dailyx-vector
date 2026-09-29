# ADR 0004 — Data layer: PGlite/Neon, user-scoped access, audit, Better Auth

- **Status:** Accepted, Sep 29, 2026
- **Deciders:** Ihor (delegated to the stage 7+8+9 orchestrator)
- **Spec:** `docs/SPEC.md` → Domain model, Decisions, Security

## Context

Through M1 every input is manual (ADR 0001, D1: one user, no RLS). `packages/db` becomes the only
data layer, so it needs one schema for Better Auth's four tables plus the ten M1 domain tables, a
committed migration path, a driver that works the same in dev/tests and in production, and one
access layer that both isolates users and records every write.

## Decision

### Driver

One `createDb(env)` returns:

- **PGlite 0.5.8** (`@electric-sql/pglite`) when `DATABASE_URL` is unset — dev
  (`<repo root>/.data/pglite`, found by walking up from `process.cwd()` to the nearest
  `pnpm-workspace.yaml`; overridable with `PGLITE_DIR`, and `PGLITE_DIR=memory://` for an
  in-memory instance) and tests (always in-memory via `createTestDb()` in `src/testing.ts`).
- **Neon** via `drizzle-orm/neon-serverless` + `Pool` from `@neondatabase/serverless` (WebSocket)
  when `DATABASE_URL` is set — production. Node 24 has a global `WebSocket`, so no `ws` package and
  no `neonConfig` tweak.

Both assign to `Db = PgDatabase<PgQueryResultHKT, Schema>`, so one access layer, typed on that,
runs on both drivers unmodified.

### Migrations

`drizzle-kit generate` writes committed SQL under `packages/db/migrations/`; nothing is hand-edited.
`pnpm db:migrate` (`packages/db/src/scripts/migrate.ts`) applies them to whichever driver
`createDb()` picks, and logs one line —
`{ event: 'db.migrate', target, durationMs, status: 'ok' | 'error', error? }` — never the connection
string.

### Isolation and audit

Every parent table carries `UNIQUE (id, user_id)`; every child foreign key is composite
`(parent_id, user_id) → parent(id, user_id)`. A user cannot attach a row to another user's parent
even if the access layer had a bug — the database rejects it. `forUser(db, userId)` (T2) is the
only query path into user data (a review blocker otherwise, per ADR 0001); every read is filtered
by `userId`, and every write (`create`, `createMany`, `update`, `settings.update`) inserts an
`audit_events` row in the same transaction. No delete exists this batch: no stage 7–9 consumer
needs it.

### Settings

Settings live on the `user` row (SPEC → Domain model), exposed to Better Auth as
`additionalFields` with `input: false` so clients can't set them at sign-up. They're read and
written only through `forUser(db, id).settings`.

### Mapping

Row → `@dailyx/core` conversion lives in one file, `packages/db/src/map.ts` (T2). `Money` values are
built with core's `money(amount, currency)`, which throws on a non-safe-integer amount.

### Logging

No second structured-log wrapper is invented for this batch. The only external calls this batch
authors are `db:migrate` and `db:seed`, which log
`{ event, durationMs, status, error? }` directly via `console.log(JSON.stringify(...))`. Per-query
DB logging and Better Auth's internal Google calls are out of scope; `withExternalCall` in
`apps/web/src/lib/observability.ts` wraps auth and server-action external calls when those land.

### Dev loop

```
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

PGlite is single-process: stop `pnpm dev` before running `db:migrate` or `db:seed`.

### Pinned versions

| Package | Version |
| --- | --- |
| `@electric-sql/pglite` | 0.5.8 |
| `tsx` | 4.23.15 |

`pnpm install` failed with `ERR_PNPM_IGNORED_BUILDS` on `esbuild` (a transitive dependency of
`drizzle-kit`/`tsx`) — added `esbuild: true` under `allowBuilds` in `pnpm-workspace.yaml`.

### Verified by trial (scratch copy, not the repo)

- drizzle-orm 0.45.3 + PGlite 0.5.8: `migrate()` from `drizzle-orm/pglite/migrator` applies the
  generated SQL in under a second; `bigint(mode: 'number')` round-trips
  9,007,199,254,740,991 as a `number`; `date(mode: 'string')` round-trips `'2026-09-01'`;
  `numeric(6, 2, mode: 'number')` round-trips as a `number`; `timestamptz` returns `Date`;
  transactions roll back.
- `drizzle(neon-serverless)`, `drizzle(neon-http)` and `drizzle(pglite)` all assign to
  `PgDatabase<PgQueryResultHKT, typeof schema>`.
- The generic `scoped(table)` access layer type-checks under the repo's strict tsconfig; `.values()`
  and `.set()` need an `as never` cast inside the generic (Drizzle's mapped insert types don't
  resolve on a union type parameter). Public signatures stay fully typed.
- Composite FK: user B inserting a `balance_snapshots` row pointing at user A's account throws;
  `time_entries` with neither target throws (CHECK).
- `drizzle-kit generate` 0.31.11 loads `src/schema/index.ts`, including a value import from
  `@dailyx/core` (`DEFAULT_MATURITY_DAYS`), and emits one `0000_init.sql` with 14 tables.
- better-auth 1.7.6 works with `drizzleAdapter(db, { provider: 'pg', schema })` on PGlite (T3).

## Consequences

- The `as never` casts inside the generic access layer (`packages/db/src/access.ts`) are confined
  there; public call sites stay fully typed.
- No per-query logging exists; only the scripts log `{ event, durationMs, status }`.
- Applying migrations to Neon, and the Neon restore window, are owner checks — not automated here.
- Losing the PGlite dev directory (`.data/pglite`, gitignored) loses local history; through M1
  there is no other source to re-sync from.

## Rejected

- **`neon-http` driver**: type-checks against `PgDatabase` but throws on `db.transaction()` at run
  time, and audit-in-the-same-transaction needs transactions.
- **Postgres RLS**: D1, single user; `forUser` is the isolation boundary.
- **Testcontainers / a real Postgres for tests**: needs Docker; PGlite runs migrations and
  transactions in-process, verified at under a second for one test.
- **A separate `user_settings` table**: SPEC puts Settings on the user row; Better Auth
  `additionalFields` exposes them on `session.user` for free.
- **`dotenv`**: Node 24's `--env-file-if-exists` covers the scripts; Next loads `.env*` itself.
- **`@better-auth/cli generate` for the auth schema**: an extra dev dependency; the four tables are
  hand-written from Better Auth 1.7.6's documented core schema and proven by the auth test on
  PGlite (T3).
