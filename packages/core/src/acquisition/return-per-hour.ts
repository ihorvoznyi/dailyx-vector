/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T22b */
import type { Money } from '../money/money';
import type { Metric } from '../result';

export interface ChannelReturnInput {
  /** Net won over the 90-day window. */
  readonly won: Money;
  /** Cash cost over the same window, same currency as `won`. */
  readonly cashCost: Money;
  /** Hours spent on the channel over the same window. */
  readonly hours: number;
  /** Passed through to the result. */
  readonly recordIds: readonly string[];
}

/**
 * value: (won − cash cost) ÷ hours, rounded to a minor unit; null when hours are zero.
 * numerator: won − cash cost; denominator: hours.
 */
export type ChannelReturn = Metric<Money | null, Money, number>;

/** Throws RangeError when `won` and `cashCost` differ in currency. */
export function channelReturnPerHour(input: ChannelReturnInput): ChannelReturn {
  throw new Error('not implemented: channelReturnPerHour');
}
