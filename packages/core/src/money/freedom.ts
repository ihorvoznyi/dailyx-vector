import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import { money, type CurrencyCode, type Money } from './money';
import { netIncome, type Payment } from './net-income';
import { divRound } from './round';
import { createTrail } from './trail';

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
  const months = recurringByMonth(input, 3);
  if (!months.ok) return months;
  const { monthly, cost, recordIds } = months.data;
  const recurring = averageOf(monthly);
  return {
    ok: true,
    data: {
      value: cost === 0 ? null : recurring / cost,
      numerator: money(recurring, input.base),
      denominator: money(cost, input.base),
      recordIds,
    },
  };
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
  const months = recurringByMonth(input, 4);
  if (!months.ok) return months;
  const { monthly, cost, recordIds } = months.data;
  const [first = 0, , , last = 0] = monthly;
  const recurring = averageOf(monthly.slice(1));
  const growth = Number(divRound(BigInt(last - first), 3n));
  const gap = cost - recurring;
  return {
    ok: true,
    data: {
      value: gap <= 0 ? 0 : growth <= 0 ? null : gap / growth,
      numerator: money(gap, input.base),
      denominator: money(growth, input.base),
      recordIds,
    },
  };
}

interface RecurringByMonth {
  /** Net recurring income per month in minor units of `base`, oldest month first. */
  readonly monthly: readonly number[];
  /** The monthly cost in minor units of `base`. */
  readonly cost: number;
  readonly recordIds: string[];
}

/** Received recurring payments over the `count` complete months before the month of `on`. */
function recurringByMonth(
  input: RecurringIncomeInput,
  count: number,
): Result<RecurringByMonth, MissingFxRate> {
  const year = Number(input.on.slice(0, 4));
  const month = Number(input.on.slice(5, 7));
  const months = Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(year, month - 1 - count + i, 1)).toISOString().slice(0, 7),
  );

  const trail = createTrail(input.base, input.rates);
  const totals = new Map<string, number>();
  for (const p of input.payments) {
    const key = p.date.slice(0, 7);
    if (p.certainty !== 'received' || !p.isRecurring || !months.includes(key)) continue;
    const converted = trail.add(p.id, netIncome(p, input.taxRateBps), p.date);
    if (!converted.ok) return converted;
    totals.set(key, (totals.get(key) ?? 0) + converted.data);
  }
  const cost = trail.add(null, input.monthlyCost, input.on);
  if (!cost.ok) return cost;

  return {
    ok: true,
    data: {
      monthly: months.map((key) => totals.get(key) ?? 0),
      cost: cost.data,
      recordIds: trail.recordIds(),
    },
  };
}

/** The mean of monthly amounts, rounded once to a minor unit. */
function averageOf(monthly: readonly number[]): number {
  const total = monthly.reduce((sum, amount) => sum + amount, 0);
  return Number(divRound(BigInt(total), BigInt(monthly.length)));
}
