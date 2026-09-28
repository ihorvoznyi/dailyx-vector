---
name: interface-design
description: >
  Design and review user-facing surface — pages, components, layout, type, colour, motion, states.
  Shared principles here; the surface-specific core in `landing.md` (conversion) or `app.md`
  (product UX), read whichever fits. Load BEFORE writing UI for a new surface, reshaping an
  existing one, reviewing one, or adding a frontend dependency. Trigger on: "build the landing
  page", "design this screen", "the dashboard", "make it look better", "this looks generic", "add
  an animation", "the hero", "empty state", "this form", "dark mode", "review this UI",
  "responsive", "why isn't this converting", "which component library".
---

# Interface design

Most generated UI is bad for one reason: the model reaches for a default aesthetic instead of
reading the brief. Everything here is contextual. None of it fires automatically.

**This file is the part that is true of every surface.** The rules that decide a specific surface
live next to it, and they differ enough that applying the wrong set is worse than applying none:

| The surface is | Read | Because its job is |
|---|---|---|
| A landing, marketing, pricing or signup page | **`landing.md`** | One conversion. Everything that isn't that action is a leak |
| Product UI — dashboard, settings, console, admin, any signed-in screen | **`app.md`** | Repeated task completion. The user came to do something and leave |
| Both (a homepage that doubles as an app shell) | Both, landing rules for the marketing surface only | They stop at the auth boundary |

Read one. They contradict each other on purpose — motion, density and layout variation all invert
between them.

## 1. Read the room, then say what you read

Before any code, state one line and proceed:

> Reading this as: **<surface kind>** for **<audience>**, in a **<vibe>** language, leaning toward
> **<system or aesthetic>**.

From: the surface kind · vibe words the user used · references they linked · the audience — *the
audience picks the aesthetic, not your taste* · brand assets that already exist, which on a redesign
are starting material, not optional input · quiet constraints (regulated, public-sector,
trust-first, accessibility-critical) which **override** aesthetic preference.

Ambiguous? Ask exactly **one** question, never a dump — and only when the read genuinely diverges.
Confident from context? Don't ask.

### Refuse the defaults

Purple-to-blue gradients · a centred hero over a dark mesh · three equal feature cards · glass on
everything · Inter + `slate-900` · an eyebrow label above every section · infinite ambient loops ·
emoji as icons. These are what the model produces when it is not reading. Reach past them
deliberately, with a reason you can name.

### Three dials

Set them from the read. The surface file gives the range; this is the scale.

`VARIANCE` 1 symmetric → 10 chaotic · `MOTION` 1 static → 10 cinematic · `DENSITY` 1 airy → 10 packed

| Read | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| minimalist · calm · editorial · Linear-ish | 5–6 | 3–4 | 2–3 |
| premium consumer · brand-led | 7–8 | 5–7 | 3–4 |
| agency · experimental · award-bait | 9–10 | 8–10 | 3–4 |
| product UI · dashboard · tool | 4–5 | 2–4 | 6–8 |
| regulated · public-sector · trust-first | 3–4 | 2–3 | 4–5 |
| redesign, preserve / overhaul | match / +2 | match+1 / +2 | match |

## 2. Priority order

Work 1 → 8. **A violation low in this list outranks a preference high in it.** Never trade contrast
for aesthetics. This order holds on every surface.

| # | Category | Must hold | Never |
|---|---|---|---|
| 1 | Accessibility | 4.5:1 body / 3:1 large, alt text, keyboard reachable, visible focus, semantic elements | Removing focus rings; icon-only buttons with no label |
| 2 | Interaction | ≥44×44px targets, ≥8px apart; pressed, loading and disabled states | Hover-only affordances; 0ms state changes |
| 3 | Performance | Modern image formats, lazy below the fold, reserved space (CLS < 0.1) | Unreserved image slots; layout thrash |
| 4 | Layout | Mobile-first; no horizontal scroll at 320px; explicit `<768px` collapse per section | Fixed px widths; `user-scalable=no`; "Tailwind will handle it" |
| 5 | One style, consistently | One icon set, one shadow language, one radius scale | Mixing idioms at random |
| 6 | Type & colour | 16px base, ~1.5 line-height, 45–75ch measure, semantic tokens | Body under 12px; grey on grey; raw hex in components |
| 7 | Motion | 150–300ms, `transform`/`opacity` only, `prefers-reduced-motion` honoured | Animating `width`/`height`/`top`/`left`; decorative-only motion |
| 8 | States | Loading, empty, error and success exist for every async surface | A spinner as the whole error story |

Fix the **system** before the pixels: spacing scale, type scale, semantic colour tokens, one icon
set. The surface file sets the scale — apps go dense, marketing goes spacious.

## 3. Motion — decide in this order

Most of the time the answer is "it doesn't". This framework is what makes landing and app motion
diverge, from one rule rather than two opinions.

**Should it animate?** — by how often the user sees it:

| Frequency | Decision |
|---|---|
| 100+/day — keyboard shortcuts, command palette, primary nav | Never animate. It reads as lag |
| Tens/day — hover, list navigation, tab switch | Remove, or cut to ~100ms |
| Occasional — modal, drawer, toast | Standard animation |
| Rare — onboarding, success, first run, a marketing scroll reveal | Delight is allowed here |

A landing page is mostly the bottom row; an app is mostly the top two. That is the whole difference.

**What is it for?** One of: spatial consistency (it leaves the way it arrived) · state change ·
feedback that the interface heard the input · explanation. "It looks nice" is not a purpose.

**How:** `ease-out` for anything entering or responding to input — `ease-in` feels sluggish. Exits
are faster than entrances. Nothing appears from nothing: `scale(0.95)` + `opacity`, never
`scale(0)`. Popovers scale from their trigger (`transform-origin`), modals from centre. Buttons
respond to press.

**Banned:** scroll handlers that write state on every frame · `requestAnimationFrame` loops
touching state · `transition: all` · animating layout properties. Use scroll-driven CSS,
`IntersectionObserver`, or the animation library's own motion values.

**Reduced motion is not optional** above `MOTION 3`. Parallax, infinite loops, scroll-hijack and
physics collapse to static.

## 4. Dependencies

Check what is installed before reaching for a library, and prefer the platform: `<dialog>`,
`<details>`, `<input type="date">`, CSS anchor positioning, container queries, scroll-driven
animations. When a dependency is genuinely needed — toasts, charts, virtualization, drag and drop —
name the pick and the reason in the plan so it is not re-decided during implementation.

## 5. Pre-flight — every surface, before claiming it is done

The surface file adds its own. These are not negotiable on either.

- [ ] Contrast verified in **both** themes, including disabled and placeholder text
- [ ] Keyboard: every interactive element reachable, focus visible, order sensible, focus trapped in
      modals and returned on close
- [ ] No horizontal scroll at 320px; every multi-column section has a declared mobile collapse
- [ ] Loading, empty and error states exist for every async surface
- [ ] No layout shift on image or font load; safe areas respected
- [ ] `prefers-reduced-motion` honoured; no animation on high-frequency actions
- [ ] Console clean, no failed resource loads

Source: synthesized from `design-taste-frontend`, `ui-ux-pro-max`, `landing-page-audit`, and Emil
Kowalski's design engineering material.
