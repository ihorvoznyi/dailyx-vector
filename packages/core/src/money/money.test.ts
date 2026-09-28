import { describe, expect, it } from 'vitest';

import { money } from './money';

// Unskipped by stage 10 (T08).
describe('money', () => {
  it('builds a Money from a safe integer amount and a currency', () => {
    expect(money(12_345, 'USD')).toEqual({ amount: 12_345, currency: 'USD' });
    expect(money(-250, 'UAH')).toEqual({ amount: -250, currency: 'UAH' });
    expect(money(0, 'EUR')).toEqual({ amount: 0, currency: 'EUR' });
  });

  it('throws RangeError for a non-integer amount', () => {
    expect(() => money(1.5, 'USD')).toThrow(RangeError);
  });

  it('throws RangeError for NaN', () => {
    expect(() => money(Number.NaN, 'USD')).toThrow(RangeError);
  });

  it('throws RangeError for infinity', () => {
    expect(() => money(Number.POSITIVE_INFINITY, 'USD')).toThrow(RangeError);
  });

  it('throws RangeError beyond MAX_SAFE_INTEGER', () => {
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, 'USD')).toThrow(RangeError);
  });
});
