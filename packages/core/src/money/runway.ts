import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import { money, type CurrencyCode, type Money } from './money';
import type { AccountBalance } from './net-worth';
import { createTrail } from './trail';

export interface RunwayInput {
  readonly balances: readonly AccountBalance[];
  readonly monthlyCost: Money;
  readonly rates: readonly FxRate[];
  readonly base: CurrencyCode;
  /** Today. Balances and the monthly cost convert at the rate for this date. */
  readonly on: IsoDate;
}

/** Months. numerator: liquid balances in `base`; denominator: monthly cost in `base`. */
export type Runway = Metric<number | null, Money, Money>;

/** Liquid balances ÷ monthly cost. The value is null when the monthly cost is zero. */
export function runway(input: RunwayInput): Result<Runway, MissingFxRate> {
  const trail = createTrail(input.base, input.rates);
  let liquid = 0;
  for (const b of input.balances) {
    if (!b.isLiquid) continue;
    const converted = trail.add(b.id, b.balance, input.on);
    if (!converted.ok) return converted;
    liquid += converted.data;
  }
  const cost = trail.add(null, input.monthlyCost, input.on);
  if (!cost.ok) return cost;
  return {
    ok: true,
    data: {
      value: cost.data === 0 ? null : liquid / cost.data,
      numerator: money(liquid, input.base),
      denominator: money(cost.data, input.base),
      recordIds: trail.recordIds(),
    },
  };
}
