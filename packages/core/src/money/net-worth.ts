import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import { money, type CurrencyCode, type Money } from './money';
import { createTrail } from './trail';

/** The latest BalanceSnapshot of one account. The caller picks the latest; core does not. */
export interface AccountBalance {
  /** BalanceSnapshot id. */
  readonly id: string;
  readonly accountId: string;
  readonly isLiquid: boolean;
  readonly balance: Money;
}

export interface PositionValue {
  /** Position id. */
  readonly id: string;
  readonly marketValue: Money;
}

export interface NetWorthInput {
  readonly balances: readonly AccountBalance[];
  readonly positions: readonly PositionValue[];
  readonly rates: readonly FxRate[];
  readonly base: CurrencyCode;
  /** Today. Every amount converts at the rate for this date. */
  readonly on: IsoDate;
}

/** A sum: `numerator` equals `value`, and there is no denominator. */
export type NetWorth = Metric<Money, Money, null>;

/** Liquid balances + position market values, in `base`. */
export function netWorth(input: NetWorthInput): Result<NetWorth, MissingFxRate> {
  const trail = createTrail(input.base, input.rates);
  let total = 0;
  for (const b of input.balances) {
    if (!b.isLiquid) continue;
    const converted = trail.add(b.id, b.balance, input.on);
    if (!converted.ok) return converted;
    total += converted.data;
  }
  for (const p of input.positions) {
    const converted = trail.add(p.id, p.marketValue, input.on);
    if (!converted.ok) return converted;
    total += converted.data;
  }
  const value = money(total, input.base);
  return {
    ok: true,
    data: { value, numerator: value, denominator: null, recordIds: trail.recordIds() },
  };
}
