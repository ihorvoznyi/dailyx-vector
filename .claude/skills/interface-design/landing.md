# Landing pages — conversion

Read `SKILL.md` first; this is the surface-specific half.

A landing page has **one job**: get one specific action taken. Every element either moves a visitor
toward that action or leaks attention away from it. That is the ranking function for every decision
below — not beauty, not completeness, not how much there is to say about the product.

Dials: `VARIANCE 7–9` · `MOTION 6–8` · `DENSITY 3–5`. Agency and award-bait work goes higher on
variance and motion; regulated and trust-first work goes to `3–4 / 2–3 / 4–5` and the rules below
still hold.

## 1. Context first — three questions, maximum

The same page is excellent or terrible depending on what it is for. Ask only what changes the
verdict, and only if it is not already obvious:

1. **What is the conversion goal?** Purchase · booking · demo request · email capture · free trial.
   This alone reverses half of everything else. A page collecting an email asks for one field; a
   page taking a £750 deposit asks for *more* fields, not fewer — friction that qualifies is not
   friction to remove.
2. **Where is the traffic from?** Cold ads · warm list · organic search · referral. Determines how
   much the page must explain from scratch.
3. **Is there an ad or campaign it pairs with?** If yes, get the copy — message-match cannot be
   assessed without it. Without it, say so rather than guessing.

Unanswered: infer the goal, state the assumption at the top, and proceed. Don't stall.

## 2. Message hierarchy

- **Headline states a specific value proposition**, ideally under ~10 words, and matches the ad or
  the search intent that brought them. Not a slogan, not a category name.
- **Subheadline adds the concrete benefit or the mechanism** — not the headline restated in longer
  words. Max 20 words.
- **Five-second test:** what is being sold, to whom, and what happens next. If a stranger can't
  answer all three from the first viewport, nothing further on the page matters.
- **Address the top 2–3 objections** a skeptical buyer has. A page that only asserts benefits and
  never handles doubt converts worse than one that names the objection and answers it.
- Benefit-led before feature-led. Adjectives are not benefits.

## 3. Above the fold — hard rules

Failing one of these is shipping broken work.

- **The hero fits the first viewport.** Headline ≤2 lines, subtext ≤20 words, CTA visible without
  scrolling, on desktop *and* at 390px. A 4-line hero headline is a font-size error, not a
  copy-length error.
- **Hero top padding caps at ~6rem** on desktop. More and the content floats mid-viewport and reads
  as a layout bug, not as space. Need breathing room? Increase font or asset scale instead.
- **Max 4 text elements in the hero**: one optional eyebrow *or* brand strip (not both), headline,
  subtext, CTAs (1 primary + at most 1 secondary). Trust micro-strips, pricing teasers, feature
  bullets and avatar rows move to their own section below.
- **The logo wall lives under the hero, never inside it.**
- **Hero visual shows the product or the outcome.** Decorative stock imagery is a wasted slot.
- Some social proof visible before the first scroll, if it can be specific.

## 4. Layout variation

An eight-section page that uses two layouts reads as generated, whatever the craft in each section.

- **A layout family appears once per page.** Eight sections need at least four different families.
- **Max two consecutive image+text splits.** The third is a fail — break it with a full-width
  section, a vertical stack, a grid, or a marquee.
- **Eyebrows: at most one per three sections** — the most violated rule in practice, and mechanically
  checkable. The usual right answer is to drop it; the headline alone is enough, and the section's
  position on the page already categorises it.
- **A grid has exactly as many cells as you have content for.** An empty tile means the grid was
  planned wrong. Re-shape it; never paste a blank.
- **Multi-cell grids need real visual variation** in 2–3 cells — an image, a pattern, a tinted
  surface. Six white cards with text inside is the default look.
- **Banned as a default:** the split header (big headline left, small explainer paragraph right).
  Stack them, max 65ch. Use the split only when the right column carries something real.
- **Nav is one line on desktop**, ≤80px tall. Doesn't fit at 1024px? Condense labels or collapse to
  a menu. A two-line desktop nav is broken.

## 5. The conversion path

- **One primary action, repeated.** Three different asks is a leak. A secondary CTA is allowed once,
  and it must be genuinely secondary.
- **CTA copy names the outcome** — "Get my quote", "Start the trial" — not the mechanic: "Submit",
  "Click here", "Learn more".
- **Nav is an exit.** On a paid-ad landing page, strip it. On a homepage that doubles as one, keep
  it. Say which situation the page is in before applying the rule — best practices are priors, not
  laws.
- **Every form field is justified.** For each one, know what it costs in completion rate and what it
  buys. Cut the rest. Correct input types on mobile, no zoom-on-focus, no tiny selects.
- **No surprise at the end.** An unexpected account requirement, a field that appears after submit,
  or an unclear next step undoes the whole page.

## 6. Trust

- Specific and attributed beats generic and anonymous, by a wide margin. A named testimonial with a
  photo and a concrete result converts; an unnamed five-star quote is decoration.
- Put trust signals **at the point of commitment**, not only in the footer: guarantee, refund
  policy, privacy link, real company details.
- **Urgency only when it is honest.** Real deadlines, genuine capacity and true lead times are fair.
  Fake countdown timers and invented "3 spots left" badges damage trust — recommend against them,
  and never invent one.
- Never invent a metric, customer, logo, testimonial or certification. Charter, § Hard rules.

## 7. Auditing an existing page

Look at the page before saying anything about it — fetch it, and screenshot at ~1440px and ~390px
if browser tools are available. Above-the-fold claims and tap targets cannot be judged from HTML.
Mark inferred findings `[inferred]` and unmeasurable ones `[not verified]`. **Never report a finding
as observed when it was inferred.**

Score out of 100 by judgment, anchored: **85+** converts well, gains need testing · **70–84** solid,
a few clear leaks · **50–69** the offer lands but the page fights the visitor · **30–49** structural
problems · **<30** rebuild rather than patch. Say in one line what pinned it. A generous score costs
the user money.

Report: top issues ranked by **conversion impact, not checklist order** — five is a ceiling, not a
quota; quote the actual copy, never describe it abstractly. Then quick wins with the replacement
copy written out, not "improve the CTA". Then A/B tests ordered by impact ÷ effort — and when
traffic is a few hundred visits a month, say to just make the change, because the test will never
reach significance.

Sometimes the fix is deletion. Don't recommend adding sections to a page that is already too long.

## 8. Pre-flight — in addition to `SKILL.md` § 5

- [ ] Five-second test passes: what, for whom, what next
- [ ] CTA visible without scrolling at 390px and at 1440px
- [ ] One primary action; competing CTAs counted and justified
- [ ] Headline matches the ad or search intent it pairs with
- [ ] Eyebrow count ≤ ceil(sections / 3); no layout family twice; ≤2 consecutive splits
- [ ] Every form field justified, correct mobile input types
- [ ] Every claim, number and testimonial is real and attributable
