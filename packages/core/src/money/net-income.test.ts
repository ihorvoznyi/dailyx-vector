import { describe, expect, it } from 'vitest';

import type { Money } from './money';
import { netIncome, type Payment } from './net-income';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });
const uah = (amount: number): Money => ({ amount, currency: 'UAH' });

const pay = (over: Partial<Payment>): Payment => ({
  id: 'p',
  incomeSourceId: 'src',
  date: '2026-09-01',
  amount: usd(0),
  platformFee: usd(0),
  taxReserved: null,
  certainty: 'received',
  isRecurring: false,
  ...over,
});

// Unskipped by stage 10 (T08).
describe('netIncome', () => {
  it('derives the tax reserve from the tax rate when none is recorded', () => {
    expect(netIncome(pay({ amount: usd(240_000) }), 500)).toEqual(usd(228_000));
  });

  it('subtracts both the platform fee and the derived tax', () => {
    expect(netIncome(pay({ amount: usd(150_000), platformFee: usd(15_000) }), 500)).toEqual(
      usd(127_500),
    );
  });

  it('uses the recorded tax reserve instead of deriving one', () => {
    expect(
      netIncome(
        pay({ amount: usd(150_000), platformFee: usd(15_000), taxReserved: usd(9_000) }),
        500,
      ),
    ).toEqual(usd(126_000));
  });

  it('treats an explicit zero tax reserve as recorded, not as "derive"', () => {
    expect(
      netIncome(pay({ amount: usd(150_000), platformFee: usd(15_000), taxReserved: usd(0) }), 500),
    ).toEqual(usd(135_000));
  });

  it('rounds a derived tax half away from zero', () => {
    expect(netIncome(pay({ amount: usd(10_010) }), 500)).toEqual(usd(9_509));
  });

  it('rounds a derived tax on a refund half away from zero', () => {
    expect(netIncome(pay({ amount: usd(-10_010) }), 500)).toEqual(usd(-9_509));
  });

  it('derives a zero tax at a zero tax rate', () => {
    expect(netIncome(pay({ amount: usd(150_000), platformFee: usd(15_000) }), 0)).toEqual(
      usd(135_000),
    );
  });

  it("computes in the payment's own currency", () => {
    expect(netIncome(pay({ amount: uah(4_130_000) }), 500)).toEqual(uah(3_923_500));
  });

  it('ignores certainty; every payment computes the same way', () => {
    expect(netIncome(pay({ amount: usd(240_000), certainty: 'pipeline' }), 500)).toEqual(
      usd(228_000),
    );
  });

  it('throws RangeError when the platform fee currency does not match the amount', () => {
    expect(() => netIncome(pay({ amount: usd(100), platformFee: uah(10) }), 500)).toThrow(
      RangeError,
    );
  });

  it('throws RangeError when the recorded tax currency does not match the amount', () => {
    expect(() => netIncome(pay({ amount: usd(100), taxReserved: uah(5) }), 500)).toThrow(
      RangeError,
    );
  });
});
