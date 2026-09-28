import type { IsoDate } from '../dates';
import type { Result } from '../result';
import { money, type CurrencyCode, type Money } from './money';
import { divRound } from './round';

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
  if (amount.currency === to) return { ok: true, data: { money: amount, rate: null } };

  let best: FxRate | null = null;
  let bestIsDirect = false;
  for (const rate of rates) {
    if (rate.date > on) continue;
    const isDirect = rate.base === amount.currency && rate.quote === to;
    const isInverse = rate.base === to && rate.quote === amount.currency;
    if (!isDirect && !isInverse) continue;
    // Later date wins; on a date tie direct beats inverse; on a further tie the later element wins.
    if (
      best === null ||
      rate.date > best.date ||
      (rate.date === best.date && (isDirect || !bestIsDirect))
    ) {
      best = rate;
      bestIsDirect = isDirect;
    }
  }
  if (best === null) {
    return { ok: false, error: { kind: 'missing-fx-rate', from: amount.currency, to, on } };
  }

  const minor = BigInt(amount.amount);
  const rateE6 = BigInt(best.rateE6);
  const converted = bestIsDirect
    ? divRound(minor * rateE6, 1_000_000n)
    : divRound(minor * 1_000_000n, rateE6);
  return { ok: true, data: { money: money(Number(converted), to), rate: best } };
}
