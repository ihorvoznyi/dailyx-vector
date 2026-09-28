import { describe, expect, it } from 'vitest';

import type { FxRate } from './fx';
import type { Money } from './money';
import { netWorth, type AccountBalance, type PositionValue } from './net-worth';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });
const uah = (amount: number): Money => ({ amount, currency: 'UAH' });

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
const POSITIONS: PositionValue[] = [
  { id: 'pos-voo', marketValue: usd(1_315_488) }, // 24 × $548.12
  { id: 'pos-nvda', marketValue: usd(529_200) }, // 30 × $176.40
  { id: 'pos-msft', marketValue: usd(410_320) }, // 8 × $512.90
  { id: 'pos-bnd', marketValue: usd(294_400) }, // 40 × $73.60
];

// Unskipped by stage 10 (T08).
describe('netWorth', () => {
  it('sums liquid balances and position market values, excluding illiquid accounts', () => {
    expect(
      netWorth({
        balances: BALANCES,
        positions: POSITIONS,
        rates: RATES,
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: {
        value: usd(4_719_071),
        numerator: usd(4_719_071),
        denominator: null,
        recordIds: [
          'bal-mono',
          'bal-paypal',
          'bal-cash',
          'pos-voo',
          'pos-nvda',
          'pos-msft',
          'pos-bnd',
          'fx-2',
        ],
      },
    });
  });

  it('lists a reused FX rate id once', () => {
    const MONO2: AccountBalance = {
      id: 'bal-mono2',
      accountId: 'acc-mono2',
      isLiquid: true,
      balance: uah(4_150_000),
    };
    expect(
      netWorth({
        balances: [MONO, MONO2],
        positions: [],
        rates: RATES,
        base: 'USD',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: {
        value: usd(1_575_663),
        numerator: usd(1_575_663),
        denominator: null,
        recordIds: ['bal-mono', 'bal-mono2', 'fx-2'],
      },
    });
  });

  it('converts to a base currency other than USD', () => {
    expect(
      netWorth({
        balances: [MONO, PAYPAL],
        positions: [],
        rates: RATES,
        base: 'UAH',
        on: '2026-09-28',
      }),
    ).toEqual({
      ok: true,
      data: {
        value: uah(82_986_000),
        numerator: uah(82_986_000),
        denominator: null,
        recordIds: ['bal-mono', 'bal-paypal', 'fx-2'],
      },
    });
  });

  it('is zero with no balances or positions', () => {
    expect(
      netWorth({ balances: [], positions: [], rates: RATES, base: 'USD', on: '2026-09-28' }),
    ).toEqual({
      ok: true,
      data: { value: usd(0), numerator: usd(0), denominator: null, recordIds: [] },
    });
  });

  it('errors when no rate is usable for the conversion date', () => {
    expect(
      netWorth({
        balances: BALANCES,
        positions: POSITIONS,
        rates: RATES,
        base: 'USD',
        on: '2026-08-31',
      }),
    ).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-08-31' },
    });
  });
});
