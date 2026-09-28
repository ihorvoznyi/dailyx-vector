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
