import { addDays, type IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import { money, type CurrencyCode, type Money } from './money';
import { netIncome, type Payment } from './net-income';
import { roundHalfAway } from './round';
import { createTrail } from './trail';

export interface TimeEntry {
  readonly id: string;
  /** For weekly channel entries, the week start (D4). */
  readonly date: IsoDate;
  readonly hours: number;
  /** Set for client work. */
  readonly incomeSourceId: string | null;
  /** Set for acquisition time on a channel. */
  readonly channelId: string | null;
}

export interface EffectiveRateInput {
  readonly payments: readonly Payment[];
  readonly timeEntries: readonly TimeEntry[];
  readonly taxRateBps: number;
  readonly rates: readonly FxRate[];
  readonly base: CurrencyCode;
  /** The window is the 90 days ending on this date, inclusive. */
  readonly on: IsoDate;
}

/**
 * value: net income per client hour, rounded to a minor unit; null when client hours are zero.
 * numerator: net income in `base`; denominator: client hours.
 */
export type EffectiveRate = Metric<Money | null, Money, number>;

/** Net income of received payments over 90 days ÷ client hours over 90 days. */
export function effectiveRate(input: EffectiveRateInput): Result<EffectiveRate, MissingFxRate> {
  const { on, base, taxRateBps } = input;
  const start = addDays(on, -89);
  const inWindow = (date: IsoDate) => start <= date && date <= on;
  const trail = createTrail(base, input.rates);

  let income = 0;
  for (const p of input.payments) {
    if (p.certainty !== 'received' || !inWindow(p.date)) continue;
    const converted = trail.add(p.id, netIncome(p, taxRateBps), p.date);
    if (!converted.ok) return converted;
    income += converted.data;
  }
  let hours = 0;
  for (const t of input.timeEntries) {
    if (t.incomeSourceId === null || !inWindow(t.date)) continue;
    trail.note(t.id);
    hours += t.hours;
  }

  return {
    ok: true,
    data: {
      value: hours === 0 ? null : money(roundHalfAway(income / hours), base),
      numerator: money(income, base),
      denominator: hours,
      recordIds: trail.recordIds(),
    },
  };
}
