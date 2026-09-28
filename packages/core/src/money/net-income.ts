import type { IsoDate } from '../dates';
import { money, type Money } from './money';
import { divRound } from './round';

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
 * A zero fee or recorded tax matches any currency. Throws RangeError when a non-zero fee or
 * recorded tax is in another currency.
 */
export function netIncome(payment: Payment, taxRateBps: number): Money {
  const { amount, platformFee, taxReserved } = payment;
  for (const [label, part] of [
    ['platform fee', platformFee],
    ['tax reserve', taxReserved],
  ] as const) {
    if (part !== null && part.amount !== 0 && part.currency !== amount.currency) {
      throw new RangeError(
        `Payment ${payment.id}: ${label} is in ${part.currency}, amount is in ${amount.currency}`,
      );
    }
  }
  const tax =
    taxReserved?.amount ?? Number(divRound(BigInt(amount.amount) * BigInt(taxRateBps), 10_000n));
  return money(amount.amount - platformFee.amount - tax, amount.currency);
}
