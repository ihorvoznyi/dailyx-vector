# SaaS product UI — task completion

Read `SKILL.md` first; this is the surface-specific half.

A product screen has one job: **let someone finish a task and get on with their day.** They did not
come to be impressed, and they will see this screen a thousand times. Every decision is judged on
time-to-completion and error recovery, not on first impression — the thing that delights on visit
one is the thing that grates on visit two hundred.

Dials: `VARIANCE 4–5` · `MOTION 2–4` · `DENSITY 6–8`. Spacing scale 8–32px, not the 24–96px of a
marketing page. Visual variety is a cost here, not a virtue: a settings page where every section
looks different is a settings page nobody can scan.

## 1. Tasks before navigation

Name the jobs the user comes to do, in their words, ordered by frequency. *Then* design the
navigation to match. Navigation that mirrors the org chart, the database schema, or the order the
features were built is the most common structural defect in product UI.

- The most frequent task is reachable in one click from anywhere.
- A rare but critical task (cancel, export, transfer ownership) may be buried, but must be findable
  by search and must never be *hidden* — hiding it produces support tickets, not retention.
- If a task needs more than three screens, it is a wizard: show progress, allow back without data
  loss, and save partial state.

## 2. The five states — every surface, every time

Most product UI bugs that reach users are a missing state, not a wrong pixel. Design all five
before building any.

| State | What it must do |
|---|---|
| **Loading** | A skeleton in the shape of the final layout, so nothing jumps when data lands. A centred spinner for a known layout is a missed opportunity and causes shift |
| **Empty** | Not one state — three. See below |
| **Partial** | Some data, some failed. Show what loaded and say what didn't. Never fail the whole screen over one widget |
| **Error** | What happened, in the user's terms · what to do next · how to retry without losing input. An error code alone is a dead end |
| **Success** | Confirm the change, and make the result visible. A toast that vanishes is not a record |

**Empty is three different states**, and using one message for all three is the giveaway of a screen
designed only with seed data:

- **First run** — nothing exists yet. This is onboarding: say what this screen is for and give the
  one action that creates the first item.
- **Filtered to zero** — data exists, the filter excludes it. Say so, and offer to clear the filter.
  Never show the first-run copy here; it reads as data loss.
- **Failed to load** — offer a retry, not an invitation to create.

## 3. Tables and lists

Where most product time is spent, and where density earns its keep.

- **Scannable first.** The columns someone actually scans go left; the ones they only read after
  clicking go into the detail view, not the row.
- Sticky header on scroll. Right-align numbers and align their decimals. Keep dates in one format.
- **Sort and filter state survives** navigation and reload. Re-applying filters after every visit is
  the tax users complain about last and hate most.
- Row actions: the common one visible, the rest in a menu. Never a row of six icon buttons.
- **Bulk selection needs a count and an undo**, not a confirm dialog per item.
- Pagination for data people navigate deliberately; virtualized infinite scroll for feeds. Infinite
  scroll over a table with a footer is a trap.
- Long cell content truncates with the full value available on hover and to a screen reader.

## 4. Forms

- **Labels above fields, always visible.** A placeholder is not a label — it disappears exactly when
  the user needs it, and it fails contrast more often than not.
- **Validate on blur, not on keystroke.** Telling someone their email is invalid while they type the
  third character is hostile. Errors clear as soon as they are fixed.
- **The error sits next to the field**, names the problem, and says what valid looks like. A summary
  at the top only, with no per-field marker, forces a hunt.
- **Never clear a form on failure.** Preserve every input, including the one that failed.
- Group related fields; let optional fields be optional and mark them. Ask only for what is used.
- Destructive submit buttons are never the default focus target.

## 5. Destructive and irreversible actions

Mirrors the charter, § Money and other irreversible state.

- **Prefer undo over confirm.** A 5–10s undo on a toast beats a dialog for anything recoverable —
  it is faster for the 99% who meant it and safer for the 1% who didn't.
- Where undo is impossible, confirm with **the name of the object** in the dialog, and put the
  consequence in the button: "Delete 4 invoices", not "OK". Type-to-confirm only for the genuinely
  unrecoverable.
- Never place a destructive action adjacent to a routine one, and never as the primary in a row a
  user tabs through quickly.

## 6. Keyboard and focus

An app is used by people who will learn it. Reward that.

- Logical tab order; visible focus everywhere; focus trapped in a modal and **returned to the
  trigger** on close. `Escape` closes.
- Shortcuts for the actions done tens of times a day, discoverable in a `?` overlay or beside the
  menu item — not only in documentation.
- A command palette is worth it once there are more destinations than fit in the nav.
- **Never animate a keyboard-initiated action** (`SKILL.md` § 3). Raycast has no open animation, and
  that is the correct design for something opened two hundred times a day.

## 7. Permissions, roles and tenancy

- Design the **least-privileged view first.** A screen built for admins and then disabled for
  everyone else is a screen of grey buttons and confusion.
- Hide what a role cannot do; disable only when the user could plausibly gain the ability and needs
  to know it exists — then say how.
- When an account can hold several workspaces, the current one is visible at all times. Acting on
  the wrong tenant is the most expensive confusion in multi-tenant software.

## 8. Settings, notifications, onboarding

- **Group settings by what the user is trying to change**, not by which service owns the value.
  Search over settings once there is more than one screenful. Apply immediately with a saved
  indicator, or use an explicit save — never a mix of both on one page.
- **Toasts confirm; they do not inform.** Anything requiring action must persist somewhere.
  A toast for an error the user must fix is a lost error.
- **Onboarding is progressive, not a tour.** Teach at the moment of first use, in the place it is
  used. A five-step overlay tour on first login is skipped and then requested as a feature.

## 9. Pre-flight — in addition to `SKILL.md` § 5

- [ ] Every async surface has loading, empty, partial, error and success — empty in all three kinds
- [ ] Table sort/filter state survives reload; long content truncates accessibly
- [ ] Every form: label visible, blur validation, error beside the field, input preserved on failure
- [ ] Destructive actions have undo, or name the object and the consequence
- [ ] Focus returns to the trigger after every modal and drawer closes
- [ ] The screen was opened as the least-privileged role that can reach it
- [ ] No animation on anything reached by keyboard or used more than a few times a day
- [ ] Tested with realistic volume — 500 rows, a 60-character name, an empty account
