/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 10 (T08) */
import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import type { CurrencyCode, Money } from './money';
import type { AccountBalance } from './net-worth';

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
  throw new Error('not implemented: runway');
}
