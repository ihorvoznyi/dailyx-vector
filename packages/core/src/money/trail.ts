import type { IsoDate } from '../dates';
import type { Result } from '../result';
import { convert, type FxRate, type MissingFxRate } from './fx';
import type { CurrencyCode, Money } from './money';

export interface Trail {
  /**
   * Converts `amount` to `base` at the rate for `on` and returns its minor units. Notes `id` (null
   * for an input that isn't a record, such as the monthly cost) and the rate used.
   */
  add(id: string | null, amount: Money, on: IsoDate): Result<number, MissingFxRate>;
  /** Notes a record that carries no money, such as a time entry. */
  note(id: string): void;
  /** Records in the order met, then each distinct FX rate in first use (ADR 0003). */
  recordIds(): string[];
}

/** Show-the-math bookkeeping shared by the money metrics. */
export function createTrail(base: CurrencyCode, rates: readonly FxRate[]): Trail {
  const records: string[] = [];
  const rateIds: string[] = [];
  return {
    add(id, amount, on) {
      const converted = convert(amount, base, on, rates);
      if (!converted.ok) return converted;
      if (id !== null) records.push(id);
      const rate = converted.data.rate;
      if (rate !== null && !rateIds.includes(rate.id)) rateIds.push(rate.id);
      return { ok: true, data: converted.data.money.amount };
    },
    note(id) {
      records.push(id);
    },
    recordIds() {
      return [...records, ...rateIds];
    },
  };
}
