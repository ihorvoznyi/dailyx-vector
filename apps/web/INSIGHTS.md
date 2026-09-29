- Turbopack (Next 16.3.6) production build: a client component importing `@dailyx/db` with
  `import { type X } from '@dailyx/db'` (inline `type` modifier on a named import) fails the build
  with `TurbopackInternalError: the chunking context (unknown) does not support external modules
  (request: node:fs)` — it pulls the whole package (including `db.ts`'s `node:fs` import) into the
  client bundle. `import type { X } from '@dailyx/db'` (whole-declaration type-only import) is
  elided correctly. Same risk for any module a client component imports that itself does inline
  `type` imports from `@dailyx/db` (e.g. `server/channels.ts`'s `import { type channelBets, type
  ChannelPresetId } from '@dailyx/db'`) — don't import that module from a client component; inline
  the lookup against `@dailyx/ui`'s `channels` instead.
- `e2e/app/shell.spec.ts`'s "the nav is keyboard-reachable from the top of the page" test fails in
  isolation (`git stash` everything else, run just that spec) on this checkout: after Tab from the
  "Vector" link, the "Overview" link isn't focused. Pre-existing, not caused by quick-log/outreach
  work — flagged for whoever owns `nav-links.tsx`/`layout.tsx` (T3).
- `outreachItems.list()` has no `ORDER BY`; sort ties (e.g. several items with the same `sentOn`
  from one paste) need a final deterministic tiebreaker (`id`), not just `sentOn`/`createdAt` — an
  `UPDATE` (a stage tap) can change a row's physical scan position in Postgres/PGlite, which
  otherwise reorders "ties" between page loads and confused e2e tests asserting on "the first row".
