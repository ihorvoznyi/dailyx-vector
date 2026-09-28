import { describe, expect, it } from 'vitest';

import type { FxRate, MissingFxRate } from '../money/fx';
import type { Money } from '../money/money';
import type { Payment } from '../money/net-income';
import type { Result } from '../result';
import { wonByChannel, type IncomeSourceRef } from './attribution';

/** Asserts an ok Result and returns its data. */
function unwrap<T>(r: Result<T, MissingFxRate>): T {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.error)}`);
  return r.data;
}

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

const FX_1: FxRate = {
  id: 'fx-1',
  date: '2026-09-01',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_300_000,
};

const SOURCES: IncomeSourceRef[] = [
  { id: 'src-northwind', channelId: 'upwork' },
  { id: 'src-kite', channelId: 'email' },
  { id: 'src-lumen', channelId: 'referrals' },
  { id: 'src-kit', channelId: null },
];

const PAYMENTS: Payment[] = [
  pay({
    id: 'w1',
    incomeSourceId: 'src-northwind',
    date: '2026-08-20',
    amount: usd(150_000),
    platformFee: usd(15_000),
  }),
  pay({
    id: 'w2',
    incomeSourceId: 'src-northwind',
    date: '2026-09-15',
    amount: usd(350_000),
    platformFee: usd(35_000),
  }),
  pay({ id: 'w3', incomeSourceId: 'src-kite', date: '2026-09-10', amount: uah(4_130_000) }),
  pay({ id: 'w4', incomeSourceId: 'src-lumen', date: '2026-07-01', amount: usd(240_000) }),
  pay({ id: 'w5', incomeSourceId: 'src-lumen', date: '2026-06-30', amount: usd(240_000) }),
  pay({ id: 'w6', incomeSourceId: 'src-kit', date: '2026-09-15', amount: usd(42_000) }),
  pay({
    id: 'w7',
    incomeSourceId: 'src-northwind',
    date: '2026-09-20',
    amount: usd(600_000),
    certainty: 'pipeline',
  }),
];

const input = {
  payments: PAYMENTS,
  incomeSources: SOURCES,
  taxRateBps: 500,
  rates: [FX_1],
  base: 'USD',
  on: '2026-09-28',
} as const;

// Unskipped by T22b.
describe.skip('wonByChannel', () => {
  it('attributes net received income by payment → income source → channel', () => {
    expect(unwrap(wonByChannel(input))).toEqual({
      upwork: {
        value: usd(425_000),
        numerator: usd(425_000),
        denominator: null,
        recordIds: ['w1', 'w2'],
      },
      email: {
        value: usd(95_000),
        numerator: usd(95_000),
        denominator: null,
        recordIds: ['w3', 'fx-1'],
      },
      referrals: {
        value: usd(228_000),
        numerator: usd(228_000),
        denominator: null,
        recordIds: ['w4'],
      },
    });
  });

  it('is empty with no payments', () => {
    expect(unwrap(wonByChannel({ ...input, payments: [] }))).toEqual({});
  });

  it('errors on a missing FX rate', () => {
    expect(wonByChannel({ ...input, rates: [] })).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-09-10' },
    });
  });

  it('throws RangeError for an unknown income source', () => {
    const payments = [
      ...PAYMENTS,
      pay({ id: 'w8', incomeSourceId: 'src-unknown', date: '2026-09-01', amount: usd(10_000) }),
    ];
    expect(() => wonByChannel({ ...input, payments })).toThrow(RangeError);
  });
});
