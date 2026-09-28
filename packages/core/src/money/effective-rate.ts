/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 10 (T08) */
import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import type { CurrencyCode, Money } from './money';
import type { Payment } from './net-income';

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
  throw new Error('not implemented: effectiveRate');
}
