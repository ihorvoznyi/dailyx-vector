/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 10 (T08) */
import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import type { CurrencyCode, Money } from './money';
import type { Payment } from './net-income';

export interface RecurringIncomeInput {
  readonly payments: readonly Payment[];
  readonly taxRateBps: number;
  readonly monthlyCost: Money;
  readonly rates: readonly FxRate[];
  readonly base: CurrencyCode;
  /** Months are the complete UTC calendar months before the month of this date. */
  readonly on: IsoDate;
}

/**
 * value: recurring ÷ monthly cost; null when the monthly cost is zero.
 * numerator: average recurring net income over the last 3 complete months, in `base`.
 * denominator: monthly cost in `base`.
 */
export type FreedomRatio = Metric<number | null, Money, Money>;

export function freedomRatio(input: RecurringIncomeInput): Result<FreedomRatio, MissingFxRate> {
  throw new Error('not implemented: freedomRatio');
}

/**
 * value: months; 0 when recurring already covers the cost; null when growth is not above zero.
 * numerator: the gap, monthly cost − recurring (as in `freedomRatio`), in `base`.
 * denominator: average monthly growth in recurring income over the last 3 months, in `base`.
 */
export type MonthsToFreedom = Metric<number | null, Money, Money>;

export function monthsToFreedom(
  input: RecurringIncomeInput,
): Result<MonthsToFreedom, MissingFxRate> {
  throw new Error('not implemented: monthsToFreedom');
}
