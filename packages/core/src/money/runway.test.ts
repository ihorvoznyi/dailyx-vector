import { describe, expect, it } from 'vitest';

import type { FxRate } from './fx';
import type { Money } from './money';
import type { AccountBalance } from './net-worth';
import { runway } from './runway';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });
const uah = (amount: number): Money => ({ amount, currency: 'UAH' });
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

const FX_1: FxRate = {
  id: 'fx-1',
  date: '2026-09-01',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_300_000,
};
const FX_2: FxRate = {
  id: 'fx-2',
  date: '2026-09-25',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_500_000,
};
const FX_3: FxRate = {
  id: 'fx-3',
  date: '2026-10-05',
  base: 'USD',
  quote: 'UAH',
  rateE6: 42_000_000,
};
const RATES = [FX_1, FX_2, FX_3];

const MONO: AccountBalance = {
  id: 'bal-mono',
  accountId: 'acc-mono',
  isLiquid: true,
  balance: uah(61_240_000),
};
const PAYPAL: AccountBalance = {
  id: 'bal-paypal',
  accountId: 'acc-paypal',
  isLiquid: true,
  balance: usd(524_000),
};
const CASH: AccountBalance = {
  id: 'bal-cash',
  accountId: 'acc-cash',
  isLiquid: true,
  balance: usd(170_000),
};
const DEPOSIT: AccountBalance = {
  id: 'bal-deposit',
  accountId: 'acc-deposit',
  isLiquid: false,
  balance: usd(1_000_000),
};
const BALANCES = [MONO, PAYPAL, CASH, DEPOSIT];

// Unskipped by stage 10 (T08).
describe.skip('runway', () => {
  it('is liquid balances divided by the monthly cost', () => {
    expect(
      runway({
        balances: BALANCES,
        monthlyCost: usd(380_000),
        rates: RATES,
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: {
        value: near(5.70963947368421),
        numerator: usd(2_169_663),
        denominator: usd(380_000),
        recordIds: ['bal-mono', 'bal-paypal', 'bal-cash', 'fx-2'],
      },
    });
  });

  it('converts a monthly cost given in another currency', () => {
    expect(
      runway({
        balances: BALANCES,
        monthlyCost: uah(15_770_000),
        rates: RATES,
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: {
        value: near(5.70963947368421),
        numerator: usd(2_169_663),
        denominator: usd(380_000),
        recordIds: ['bal-mono', 'bal-paypal', 'bal-cash', 'fx-2'],
      },
    });
  });

  it('is null when the monthly cost is zero', () => {
    expect(
      runway({
        balances: BALANCES,
        monthlyCost: usd(0),
        rates: RATES,
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: {
        value: null,
        numerator: usd(2_169_663),
        denominator: usd(0),
        recordIds: ['bal-mono', 'bal-paypal', 'bal-cash', 'fx-2'],
      },
    });
  });

  it('is zero with no liquid balance', () => {
    expect(
      runway({
        balances: [DEPOSIT],
        monthlyCost: usd(380_000),
        rates: RATES,
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: { value: 0, numerator: usd(0), denominator: usd(380_000), recordIds: [] },
    });
  });

  it('errors when no rate converts the monthly cost', () => {
    expect(
      runway({
        balances: [PAYPAL],
        monthlyCost: uah(15_770_000),
        rates: [],
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-09-28' },
    });
  });
});
