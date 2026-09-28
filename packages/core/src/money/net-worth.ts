/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 10 (T08) */
import type { IsoDate } from '../dates';
import type { Metric, Result } from '../result';
import type { FxRate, MissingFxRate } from './fx';
import type { CurrencyCode, Money } from './money';

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
  throw new Error('not implemented: netWorth');
}
