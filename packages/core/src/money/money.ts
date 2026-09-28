/** ISO 4217 codes Vector handles. All three have two minor-unit digits. */
export type CurrencyCode = 'USD' | 'UAH' | 'EUR';

/** Integer minor units (cents, kopiykas) plus a currency. Never a float. */
export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

/** Builds a Money. Throws RangeError unless `amount` is a safe integer. */
export function money(amount: number, currency: CurrencyCode): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Money amount must be a safe integer, got ${amount} ${currency}`);
  }
  return { amount, currency };
}
