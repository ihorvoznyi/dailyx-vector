# ADR 0002 — Styling: Tailwind everywhere, atomic components

- **Status:** Accepted, Sep 28, 2026
- **Deciders:** Ihor
- **Spec:** `docs/SPEC.md` → Design system; decision D18

## Context

The Vector design system ships `tokens.json`, a 44 KB `bundle.css` with `vx-` classes, and 33
components written as plain `React.createElement` code. The original plan ported `bundle.css`
as-is and rewrote the components mechanically. The owner wants Tailwind for all styling, and wants
small atomic components that combine into bigger ones, with reuse and modularity as the goal.

## Decision

- **Tailwind CSS v4 everywhere.** No `vx-` stylesheet ships. `bundle.css` becomes a reference for
  measurements and states only.
- **Only Vector tokens exist as utilities.** The T02 pipeline generates a Tailwind `@theme` from
  `tokens.json`, plus `tokens.ts` for typed names. It resets Tailwind's default colour, spacing,
  radius, font, shadow and easing scales. A class that isn't a token doesn't compile to anything,
  so "no new values" is enforced by the build, not by review.
- **No arbitrary values** such as `bg-[#123456]` or `p-[13px]`. If a value is missing, it's missing
  from `tokens.json`, and it's added there.
- **Atoms first.** Small single-purpose components are composed into the 33 public components. The
  public components keep the **names and props from `index.d.ts`**, so the Vector READMEs stay
  valid. How the atoms are organised into folders is decided at stage 3.
- **Variants through `cva` + `cn`** (`clsx` + `tailwind-merge`), typed with `VariantProps`, per the
  `frontend-engineering` skill.
- **Parity is proven by the visual tests.** Each public component renders its preview's sample props
  and is compared with a screenshot of the Vector preview.

### Versions

These are the latest stable versions on npm as of Sep 28, 2026.

| Package | Version |
| --- | --- |
| tailwindcss | 4.3.3 |
| @tailwindcss/postcss | 4.3.3 |
| class-variance-authority | 0.7.1 |
| clsx | 2.1.1 |
| tailwind-merge | 3.7.0 |
| @fontsource/geist | 5.3.0 |
| @fontsource/geist-mono | 5.3.0 |

## Consequences

- The UI port is a rebuild, not a transcription: every component is re-expressed in utilities. P0's
  UI stages take longer than the ~Oct 9 target assumed.
- Tailwind must scan `packages/ui` sources from the web app, through an `@source` directive.
- Motion tokens (`dur-*`, `ease-*`) become theme variables, and `motion-reduce:` variants honour
  `prefers-reduced-motion`.
- `tailwind-merge` must know the custom theme names, or it may drop classes it doesn't recognise
  when merging. Configure it once, in `cn`.
- The theme has one key that isn't a token, spacing 0 (--spacing-0: 0px). With the scale reset and
  no --spacing base, p-0, inset-0 and min-w-0 would otherwise compile to nothing. The reset also
  covers the inset-, drop- and text-shadow scales.
- Some utilities can't be reset and still compile: statics such as p-px, rounded-full,
  rounded-none, leading-none and ease-linear; bare durations such as duration-150; and Tailwind's
  leading-* and tracking-* scales. Review catches them.
- Geist and Geist Mono are self-hosted through Fontsource (the weights the Vector bundle loads),
  so the tokens.json stacks resolve by name with no third-party request. Durations are
  --transition-duration-* theme variables, which is the namespace Tailwind's duration-* utility
  reads.

## Rejected

- **Ship `bundle.css` as-is and use Tailwind only for layout.** Faster, but it leaves two styling
  systems, and the atoms couldn't share styling primitives.
- **CSS modules over tokens.** No utility vocabulary, so atoms would reinvent spacing and colour
  rules per file.

## Amendment — Sep 28, 2026 (stages 3–6, the UI batch)

Parity with the Vector previews needs values that `bundle.css` and `bundle.js` use but
`tokens.json` doesn't define: a 36px Button, a 156 × 112 hex tile, 13px labels, a 7px thumb
radius. Rounding them to the nearest token breaks the parity tests, and arbitrary values break
this ADR. So:

- **`packages/ui/tokens/extend.json` lists them.** Every value is copied from `bundle.css` or
  `bundle.js`; nothing is invented. The generator merges it after `tokens.json` into the same
  theme and `tokens.ts`, and throws if a name would redefine a token. `tokens.json` stays the
  vendored artifact file.
- **Naming:** dimensions are named by their pixel value (`h-36px`, `px-14px`, `rounded-8px`,
  `text-13px`, `leading-15px`), so a class reads as what it draws and only listed values compile.
  Where a token covers the value, the token is used (`p-4`, never `p-16px`, which doesn't exist).
  Everything else has a semantic name: colours (`up-hover`, `on-warn`), shadows, drop shadows,
  durations (`tip`, `glide`, `meter`, `flow`, `ping`), letter-spacings, breakpoints (`max-960:`)
  and grid templates (`grid-cols-funnel`).
- **CSS Tailwind can't express** lives in two hand-written files beside the theme:
  `styles/motion.css` (keyframes and the `animate-*` theme) and `styles/utilities.css`
  (`clip-hex`, `bg-dot-grid`, `bg-hatch`, `select-chevron`, `no-scrollbar`, `vertical-rl`).
- **Inline `style` is for values computed at runtime** from props, data or state: percentage
  widths, positions, animation delays, per-item colours, canvas transforms. Preview modules
  (`*.preview.tsx`) may copy the Vector preview's own inline styles verbatim.
- **SVG geometry and paint are SVG attributes**, as in `bundle.js`. Colours in them are
  `var(--color-<token>)` or `fill-*`/`stroke-*` utilities.
- **Parity is measured** by Playwright against goldens rendered from the original bundle
  (`pnpm --filter @dailyx/web refs`), at 1024px wide and the preview card's height, with
  reduced motion. The threshold is `maxDiffPixelRatio: 0.001` at the default per-pixel
  `threshold: 0.2`. On Sep 28 the nine base components rendered with zero differing pixels at a
  per-pixel threshold of 0, so the allowance covers only anti-aliasing noise in complex charts.
