/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 10 (T08) */
import type { IsoDate } from '../dates';
import type { Money } from './money';

/** Received → Secured → Committed → Pipeline. Only `received` is ever summed into income. */
export type Certainty = 'received' | 'secured' | 'committed' | 'pipeline';

export interface Payment {
  readonly id: string;
  readonly incomeSourceId: string;
  /** The day it landed, or is expected. Conversion uses this date's rate. */
  readonly date: IsoDate;
  readonly amount: Money;
  /** Same currency as `amount`. */
  readonly platformFee: Money;
  /** Same currency as `amount`. Null derives it: amount × taxRateBps ÷ 10,000. */
  readonly taxReserved: Money | null;
  readonly certainty: Certainty;
  /** Retainers, products and subscriptions. */
  readonly isRecurring: boolean;
}

/**
 * amount − platformFee − taxReserved, in the payment's own currency.
 * Throws RangeError when the fee or the recorded tax is in another currency.
 */
export function netIncome(payment: Payment, taxRateBps: number): Money {
  throw new Error('not implemented: netIncome');
}
