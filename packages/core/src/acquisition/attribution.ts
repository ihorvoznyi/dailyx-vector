/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T22b */
import type { IsoDate } from '../dates';
import type { FxRate, MissingFxRate } from '../money/fx';
import type { CurrencyCode, Money } from '../money/money';
import type { Payment } from '../money/net-income';
import type { Metric, Result } from '../result';

export interface IncomeSourceRef {
  readonly id: string;
  /** The channel of the outreach item that produced this income source. */
  readonly channelId: string | null;
}

export interface WonByChannelInput {
  readonly payments: readonly Payment[];
  readonly incomeSources: readonly IncomeSourceRef[];
  readonly taxRateBps: number;
  readonly rates: readonly FxRate[];
  readonly base: CurrencyCode;
  /** The window is the 90 days ending on this date, inclusive. */
  readonly on: IsoDate;
}

/** A sum per channel: `numerator` equals `value`, and there is no denominator. */
export type WonByChannel = Readonly<Record<string, Metric<Money, Money, null>>>;

/**
 * Net income of received payments in the window, by payment → income source → channel.
 * Channels with no such payment are absent; payments whose source has no channel are skipped.
 */
export function wonByChannel(input: WonByChannelInput): Result<WonByChannel, MissingFxRate> {
  throw new Error('not implemented: wonByChannel');
}
