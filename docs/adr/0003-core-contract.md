# ADR 0003 — `packages/core` contract: money, rounding, FX and metric results

- **Status:** Accepted, Sep 28, 2026
- **Deciders:** Ihor (delegated to the stage-1b orchestrator)
- **Spec:** `docs/SPEC.md` → Metrics engine, Domain model, Code conventions; decisions D5, D6, D7

## Context

Every formula in SPEC → Metrics engine lives in `packages/core` as a pure function with fixture
tests, and every number opens a "show the math" drawer. Stage 1b writes the tests before the code:
typed stubs and `describe.skip` suites that stage 10 (T08), stage 11 (T22a), T22b, T24 and T26
unskip and make green. The tests only hold if the rules below are fixed first.

## Decision

### Layout

`src/result.ts` (`Result`, `Metric`), `src/dates.ts` (`IsoDate`, `DateWindow`), then one concern per
kebab-case file under `src/money/`, `src/acquisition/`, `src/actions/` and `src/stats/`. Tests are
colocated as `*.test.ts`. Everything public is re-exported from `src/index.ts`. `core` has no I/O.

### Money

- `Money = { amount, currency }`: `amount` is an integer in minor units, never a float. `money()`
  throws `RangeError` unless the amount is a safe integer.
- `CurrencyCode` is `'USD' | 'UAH' | 'EUR'`, all with two minor digits. A new currency with a
  different exponent needs this ADR amended first.
- Arithmetic across currencies is a programmer error and throws `RangeError`. Conversion is
  explicit.

### Rounding

- Round **half away from zero** to a whole minor unit (0.5 → 1, −0.5 → −1, 124.5 → 125).
- Round **once per derived amount**: each conversion, each derived tax reserve, each division that
  yields Money (effective rate, returns per hour, averages, growth) and the rebalance gain. Sum
  integers after rounding; never sum unrounded fractions.
- Ratios that aren't money (runway months, freedom ratio, stage rates, deltas in pp, months to
  freedom, scores, Brier) are unrounded `number`s. The UI formats them.

### FX

- `FxRate.rateE6` is an integer: 1 `base` = `rateE6` / 1,000,000 `quote` (41.3 UAH per USD →
  base USD, quote UAH, `41_300_000`).
- To convert on a date, take the latest rate dated **on or before** that date whose pair is
  `from → to` (direct) or `to → from` (inverse). A later-dated rate is never used. On a date tie,
  direct beats inverse; on a further tie, the later array element wins.
- Direct: `round(amount × rateE6 / 1e6)`. Inverse: `round(amount × 1e6 / rateE6)`. Use integer
  (BigInt) arithmetic.
- No triangulation through a third currency.
- With no usable rate the result is `{ ok: false, error: { kind: 'missing-fx-rate', from, to, on } }`.
- Balances, positions and the monthly cost convert at `on` (today). A payment converts at its own
  `date`. Net income is computed in the payment's currency first, then converted.

### Results

- `Result<T, E>` is `{ ok: true, data } | { ok: false, error }`, and is used only for expected
  data gaps (a missing FX rate). Programmer errors throw `RangeError`.
- `Metric<V, N, D>` is `{ value, numerator, denominator, recordIds }`. `value` is `null` when the
  denominator is zero or the metric is undefined. A sum has `numerator = value` and a `null`
  denominator. `recordIds` lists source records in the order the function met them:
  payments/balances, then time entries/positions, then the distinct FX rates used, in first use.

### Windows and months

- "90 days ending on `on`" is `[on − 89, on]` inclusive.
- Freedom months are complete UTC calendar months before the month of `on`. The ratio averages the
  last 3 (rounded Money). Growth is `(last − 3 months earlier) ÷ 3` over the last 4 (rounded
  Money).
- Only `received` payments count as income anywhere in `core`. Pipeline never does.

### Acquisition

- Universal stages: reach, attention, conversation, meeting, win. Reaching a later stage implies
  every earlier one.
- An item counts toward the step into stage S when its age `asOf − sentOn` in days is **at least**
  `maturityDays[S]`. The defaults are 7 / 7 / 21 / 45, editable per channel.
- The baseline is the same computation over the equal-length window that ends the day before.
- The leak is the lowest `rate ÷ baseline` strictly below 0.97. Steps touching a flagged stage, or
  with a missing or zero baseline, are never the leak.
- Verdicts: under 45 days → too early; then add hours at ≥ 1.5× baseline, hold at ≥ 0.8×, trim
  below, compared in integer minor units.
- Rebalance: the donor gives `min(floor(hours / 2), 4)`, so "up to half", never more. The Vector
  preview's `Math.round` would give 3 of 5. Gain = `round(Σ hours × (r − d) × 433 / 100)`.

### Stats

- PRNG: mulberry32, exactly as below. Every Monte Carlo and bootstrap run takes a `seed`, and the
  same seed and inputs give bit-identical output.

  ```ts
  export function createRng(seed: number): () => number {
    let a = seed | 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  ```

- Binary: Beta(1, 1) priors, 20,000 draws by default. Continuous: bootstrap, 5,000 resamples by
  default. The 90% interval is `sorted[floor(0.05(n−1))]` to `sorted[ceil(0.95(n−1))]`.
  `pBBeatsA` counts B − A strictly above 0.
- Verdict: the interval must strictly clear 0; touching 0 is inconclusive.
- Brier: raw confidence, inconclusive excluded. Calibration bins are 10 points wide from 50 to 100;
  confidence below 0.5 counts as 0.5.

### Pending tests

Each suite is `describe.skip` with a comment naming the stage that unskips it: money → stage 10
(T08); stage rates, baseline, delta and leak → stage 11 (T22a); attribution, return per hour,
verdicts and rebalance → T22b; actions → T24; stats → T26. Stub files carry a file-level
`eslint-disable @typescript-eslint/no-unused-vars`. Once implemented, ESLint reports the directive
as unused and lint fails until it's deleted.

## Consequences

- Show-the-math reads `numerator`, `denominator` and `recordIds` straight from the result, with no
  second query.
- A test failing after its stage unskips it is either an implementation bug or a transcription
  error. The rules here decide which; they don't get bent to fit the code.
- Sums rounded per item can differ by a cent from rounding the total. That's accepted and
  consistent.

## Rejected

- Float FX rates: inexact, and rounding at .5 boundaries becomes platform-dependent.
- Banker's rounding: harder to hand-check, with no volume that would show the bias.
- Pinning the Beta sampler: tests check analytic values within tolerance, and only the PRNG is
  pinned.
- Net worth including illiquid accounts: SPEC says liquid balances. Change SPEC first if that's
  wrong.
