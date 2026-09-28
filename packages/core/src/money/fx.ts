/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 10 (T08) */
import type { IsoDate } from '../dates';
import type { Result } from '../result';
import type { CurrencyCode, Money } from './money';

/** 1 `base` = `rateE6` / 1,000,000 `quote`. 41.3 UAH per USD is base USD, quote UAH, 41_300_000. */
export interface FxRate {
  readonly id: string;
  readonly date: IsoDate;
  readonly base: CurrencyCode;
  readonly quote: CurrencyCode;
  readonly rateE6: number;
}

export interface MissingFxRate {
  readonly kind: 'missing-fx-rate';
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly on: IsoDate;
}

export interface Conversion {
  readonly money: Money;
  /** The rate applied; null when `from` and `to` are the same currency. */
  readonly rate: FxRate | null;
}

/**
 * Converts with the latest rate dated on or before `on`, direct or inverse (ADR 0003).
 * Rounds half away from zero to a minor unit, once.
 */
export function convert(
  amount: Money,
  to: CurrencyCode,
  on: IsoDate,
  rates: readonly FxRate[],
): Result<Conversion, MissingFxRate> {
  throw new Error('not implemented: convert');
}
