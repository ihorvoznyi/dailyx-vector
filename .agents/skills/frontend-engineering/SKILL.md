---
name: frontend-engineering
description: >
  Structure client-side code — layering and the import graph, where state lives, server state vs
  client state, the server/client boundary, components and variants, forms, effects, styling,
  typed env, and migration discipline. Load BEFORE writing a component, a hook, a page, a store or
  a data fetch, and before reviewing one. `interface-design` decides what the surface should be;
  this decides how the code producing it is shaped. Trigger on: "build this component", "where
  should this state live", "server or client component", "fetch the data", "add a store", "this
  re-renders", "useEffect", "the form", "prop drilling", "how should I structure this feature",
  "this file is too big", "FSD", "public API".
---

# Frontend engineering

`.claude/ENGINEERING.md` § Architecture and § Code style are binding. `interface-design` decides what
the surface should look like and do. This is the decision procedure for the code underneath it.

Drawn from three shipped repos — `web-constructor` (Vite + React Admin, FSD, React Compiler),
`web-funnel` (Next Pages Router, FSD mid-migration, TanStack Query) and `rwi-creative` (Next App
Router, 61 components, no state library at all). Where they agree, it is stated as a rule. Where
they diverge, the divergence *is* the rule — it tracks project size, and the table at the end says
which is which.

## 1. Layering is a size decision, and it needs a gate

Two shapes are in production here. Pick by size, then enforce it mechanically:

| Shape | Use when | Enforced by |
|---|---|---|
| **FSD** — `app → pages → widgets → features → entities → shared` | Dozens of routes, several domains, more than one contributor | `steiger` + `@feature-sliced/steiger-plugin`, run as `fsd:check` in the gates |
| **Route groups + private folders** — `app/(marketing)/_sections/`, `_cart/`, `_lib/`, with `lib/<domain>/` | One product surface, tens of components | The framework's own conventions; nothing extra |

`rwi-creative` ships a complete commerce flow in 61 components with no layer system and is right to.
`web-constructor` has ten resources and would be unreadable without one. **A layering rule with no
linter behind it is a comment.** Both FSD repos gate it; that is why theirs held.

Layer rules, when FSD is on:

- Import only from layers strictly **below** yours. Never sibling, never higher.
- **Entities never import entities directly** — cross-import through the `@x/` segment.
- Slice segments: `ui/ api/ model/ lib/ config/`, plus a required `index.ts`.
- `shared/` may depend on nothing above it. It is the one layer where the public-API rule is
  commonly relaxed (`web-constructor` disables `fsd/public-api` for `shared/**` only).

## 2. Public API, and the import graph

- **Every slice or feature folder exports through `index.ts`.** Nothing outside reaches past it.
  A deep import is the review finding, not a style note.
- A feature folder should be deletable in one command. If deleting it breaks four unrelated
  screens, the boundary is wrong.
- **kebab-case for every file and directory; PascalCase for exported components.** `user-profile.tsx`
  exporting `UserProfile`. Stated identically in both 6037 repos and in the charter.
- Named exports; `import-x/no-default-export` is an error outside framework-required files.
- Import order is sorted by a rule (`simple-import-sort`), not by hand. Unused imports fail the
  build (`unused-imports/no-unused-imports`), and `knip` catches what lint can't see.

## 3. Where state lives — take the first rung that holds

Most frontend complexity is state kept in the wrong place. Work down; stop at the first that works.

| Rung | Use for | Cost of skipping past it |
|---|---|---|
| **The URL** | Filters, tab, page, sort, selected id, open panel | Back button breaks, links aren't shareable, reload loses the view. The most-missed rung by far |
| **Server cache** | Anything that came from an API (§ 4) | A second copy that goes stale silently |
| **Component local** | Input values, open/closed, hover | — |
| **Lifted to nearest parent** | Two siblings need it | — |
| **Context** | Genuinely tree-wide, rarely changing: theme, session, locale | Every consumer re-renders on every change |
| **A store** | Cross-tree, survives navigation, outlives the component that set it | A second source of truth you now own |

`rwi-creative` ships a cart, a multi-step brief and a checkout with **no client state library at
all** — the rungs above covered it. Reach the last rung deliberately and say why in the plan.

When a store is warranted: small `zustand` slices, one concern each, created with `create<T>()`.
Persisting? Write through a typed storage service, not `localStorage` inline. Redux is legacy in the
one repo that still has it — no new slices there.

If state can be **derived** during render, it is not state. `const total = items.reduce(...)` — not
a `useState` plus an effect that updates it. Derived-state-in-an-effect is the most common frontend
defect and always renders one frame stale.

## 4. Server state is not client state

**Do not write new imperative `useEffect` + `useState` + `try/catch` fetch hooks.** This is a hard
rule in `web-funnel`, and it is the single highest-value one here — those hooks each reinvent
loading flags, error handling, caching and cancellation, and each gets one of them wrong.

All new fetching goes through the query layer, with:

- **A query-key factory per resource**, exported and typed — not a key literal written at each call
  site. `export const fooQueryKey = (id: string) => ['foo', id] as const;`
- **The hook lives in the slice's `api/` segment** and returns what the UI needs, not the raw client
  object.
- `enabled` for dependent queries, so a request never fires with an undefined id.
- **Invalidate on mutation**, by key. Never hand-patch the local copy and hope the server agrees.
  From outside React, import the shared `queryClient` and invalidate the same key factory.
- One shared `QueryClient`, configured once. `web-funnel`'s defaults are `refetchOnWindowFocus:
  false`, `retry: false`, with `staleTime`/`gcTime` raised per query that deserves it.
- Loading and error come from the query, never from booleans maintained alongside it.

Independent requests start together — a waterfall is the default performance bug. Never render
unescaped remote HTML; sanitize, and treat every response as untrusted input (charter).

## 5. The server/client boundary

Applies wherever server components exist.

- **Server by default.** The client directive is for event handlers, effects, browser APIs,
  animation and local state — nothing else.
- **Push the boundary to the leaves.** In `rwi-creative`, 24 of 61 components are client components
  and they are leaves: a tilt card, a nav menu, an anchor link, an add-to-order button. The pages
  above them stay on the server.
- One interactive control does not make the page a client component. Marking a layout `'use client'`
  to reach one hook ships that whole subtree to the browser.
- Providers are client components — wrap them in one thin client file and keep the tree above it on
  the server.
- **Secrets stay server-side.** A public-prefixed env var is a published string, whatever it holds.

## 6. Components

- **Variants through a variant function + class merger** (`cva` + `cn`), typed with
  `VariantProps`. Not a pile of booleans: `variant="destructive"`, never `isRedBorder`. More than
  ~5 boolean props means it is several components.
- **With React Compiler on, do not hand-memoise.** No `memo()`, no manual `useMemo`/`useCallback`,
  no `displayName`. Plain function components. Adding them back fights the compiler and hides the
  structural problem.
- **Split on responsibility or reuse, never on line count.** A 200-line component doing one thing is
  fine. An inline sub-component past one-liner gets extracted to its own file; three 40-line
  components that exist only because a file felt long are worse than the file.
- **Extract a hook when logic is reused or worth testing without a DOM** — not to shorten a
  component. `rwi-creative` has exactly one shared hook (`use-scroll-lock`) in the whole product.
- One component per file. Utils and helpers carry JSDoc describing intent, params and non-obvious
  returns. **No prose comments** — never narrate what the code does; short comments only at
  non-obvious places, and they explain *why*.

## 7. Forms

- `react-hook-form` + `zodResolver`, one Zod schema per entity, shared between create and edit
  (`id` optional) so the two modes cannot drift apart.
- The same schema validates on the server where the stack allows it. Two hand-written validators
  for one payload will disagree within a month.
- Labels visible, validate on blur, error beside the field, input preserved on failure
  (`interface-design/app.md` § 4).
- Multi-step flows keep step state out of components: a wizard owns progression, guards wrap the
  routes that need them, and back never loses entered data.

## 8. Effects, and how to avoid them

An effect synchronises with something **outside** the framework: a subscription, a timer, a browser
API, an imperative SDK. That is the whole legitimate list.

Not effects: deriving a value (do it in render) · turning props into state · resetting state when a
prop changes (use a `key`) · fetching (§ 4) · sequencing one state update after another.

Every effect's cleanup is written in the same edit — unsubscribe, clear, abort. An effect that
starts something and never stops it is a leak that only shows under real navigation.

**Never drive continuous values through component state.** Pointer position, scroll progress and
drag offsets re-render the tree every frame and collapse on mobile — use the animation library's
motion values or CSS (`interface-design` § 3).

`react-hooks/rules-of-hooks` is an error and `exhaustive-deps` a warning, in both repos that lint
React. Silencing the dep array is a decision that needs a comment saying why.

## 9. Failure

- **An error boundary per meaningful region**, not one at the root — a failed widget leaves the rest
  usable. This is `interface-design/app.md`'s "partial" state, implemented.
- Boundaries catch render errors only; handlers and async code handle their own.
- The fallback says what failed and offers a retry. A blank card is not an error state.
- Never swallow: log with context or rethrow (charter).

## 10. Styling

- **Utilities only.** No new plain-CSS stylesheets, no CSS Modules. Global CSS is limited to what
  utilities cannot express: the theme token block, keyframes, and third-party overrides.
- Touching a file that still carries legacy CSS? Migrate that file's styles rather than extending
  them. This is how the legacy set actually shrinks.
- Tokens, not raw values, in components. Spacing and type come from the scale
  (`interface-design` § 2).

## 11. Types and environment

- **Env vars are typed in one declaration file** (`environment.d.ts` in all three repos) and read
  through it — never `process.env.SOMETHING` spelled out at a call site, never a hardcoded secret.
- An env var the app cannot run without is validated **at startup**, not at first use in production.
- **Parse at the network boundary; don't cast.** A cast asserts a shape, a parse verifies it. The
  200 response whose payload quietly changed is the outage casting hides.
- Generated or shared API types — never the same shape hand-maintained on both sides.

## 12. Migrations are named, listed, and gated

Every one of these repos is mid-migration, and the discipline that keeps that from rotting is the
same in each: **name the old pattern, name the new one, forbid new code in the old, and give the
command that checks.**

> **State:** Redux → Zustand. 3 slices remain: quiz, funnels, pages. No new Redux.
> **Validation:** Yup → Zod v4. No new Yup.
> **Legacy directories — do NOT add new code:** `src/components/` `src/redux/` `src/types/`
> `src/constants/` `src/utils/`. Distribute to layers.

Put that list in the project's `AGENTS.md` and keep it current. A migration with no list is a
migration nobody finishes.

## 13. Before saying it works

Run the `## Gates` from `AGENTS.md` as separate calls — typecheck, lint, test, dead code, plus the
layer check where there is one. Then:

- [ ] Opened the real screen in a browser — not inferred from a passing type check
- [ ] Loading, empty and error paths triggered deliberately, not just the happy one
- [ ] Console clean; no failed requests; no key or hydration warnings
- [ ] Keyboard path walked once (`interface-design` § 5)
- [ ] Realistic volume and content length, not three seed rows

Tests sit beside the component they cover (`footer.tsx` / `footer.test.tsx`) and assert through the
accessible tree — role, label, visible text. A test asserting on internal state passes while the
feature is broken.

---

## Where these came from

| Practice | Source | Why it generalizes |
|---|---|---|
| FSD with a linter gate; `@x/` for cross-entity imports | `web-constructor`, `web-funnel` | Both enforce it in CI. The one thing that stops layer rules decaying into comments |
| Layering chosen by size, not by default | all three | 61 components need route groups; ten admin resources need layers. Applying either everywhere is wrong |
| `index.ts` public API, no deep imports | all three | The only boundary that survives refactoring |
| kebab-case files / PascalCase exports; JSDoc on utils, no prose comments | `web-constructor`, `web-funnel`, verbatim in both | Two independent rule sets converged on identical wording |
| No new `useEffect`+`useState`+`try/catch` fetch hooks | `web-funnel` | Each one re-implements caching, cancellation and error handling, and gets one wrong |
| Query-key factories + invalidate-by-key | `web-funnel` | Key literals at call sites is how invalidation silently misses |
| Client boundary at the leaves | `rwi-creative`, 24 of 61 components measured | The pages stay on the server and the bundle stays small |
| No client state library until the rungs run out | `rwi-creative` ships cart + checkout + brief with none | The strongest available evidence that the ladder is real |
| `cva` + `cn` variants; no manual memo under React Compiler | `web-funnel` / `web-constructor` | Boolean-prop components and hand-memoisation are the two most common self-inflicted rewrites |
| Utilities-only styling, migrate legacy CSS on touch | `rwi-creative` | The only rule that makes a legacy stylesheet set actually shrink |
| Typed `environment.d.ts` | all three | Converged independently |
| Named, listed, gated migrations | all three, mid-migration | A migration with no list is a migration nobody finishes |
