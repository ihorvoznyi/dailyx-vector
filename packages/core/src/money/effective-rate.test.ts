import { describe, expect, it } from 'vitest';

import { effectiveRate, type EffectiveRateInput, type TimeEntry } from './effective-rate';
import type { FxRate } from './fx';
import type { Money } from './money';
import type { Payment } from './net-income';

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

const PAY_1 = pay({ id: 'pay-1', date: '2026-07-15', amount: usd(240_000) }); // net 228,000
const PAY_2 = pay({
  id: 'pay-2',
  date: '2026-08-20',
  amount: usd(150_000),
  platformFee: usd(15_000),
}); // net 127,500
const PAY_3 = pay({ id: 'pay-3', date: '2026-09-10', amount: uah(4_130_000) }); // net ₴3,923,500 → 95,000 at FX_1
const PAY_4 = pay({ id: 'pay-4', date: '2026-06-30', amount: usd(100_000) }); // before the window
const PAY_5 = pay({
  id: 'pay-5',
  date: '2026-09-20',
  amount: usd(600_000),
  certainty: 'pipeline',
}); // never counted
const PAY_6 = pay({
  id: 'pay-6',
  date: '2026-09-21',
  amount: usd(350_000),
  certainty: 'secured',
}); // not received
const PAY_7 = pay({ id: 'pay-7', date: '2026-09-28', amount: usd(10_000) }); // window end, net 9,500
const PAYMENTS: Payment[] = [PAY_1, PAY_2, PAY_3, PAY_4, PAY_5, PAY_6, PAY_7];

const entry = (id: string, date: string, hours: number, client = true): TimeEntry => ({
  id,
  date,
  hours,
  incomeSourceId: client ? 'src-northwind' : null,
  channelId: client ? null : 'upwork',
});
const TE_1 = entry('te-1', '2026-07-01', 20); // window start
const TE_2 = entry('te-2', '2026-08-03', 25.5);
const TE_3 = entry('te-3', '2026-09-07', 18.5);
const TE_4 = entry('te-4', '2026-09-07', 8, false); // acquisition time, not client hours
const TE_5 = entry('te-5', '2026-06-29', 10); // before the window
const ENTRIES = [TE_1, TE_2, TE_3, TE_4, TE_5];

const input: EffectiveRateInput = {
  payments: PAYMENTS,
  timeEntries: ENTRIES,
  taxRateBps: 500,
  rates: RATES,
  base: 'USD',
  on: '2026-09-28',
};

// Unskipped by stage 10 (T08).
describe('effectiveRate', () => {
  it('is net income of received payments over client hours, in the 90-day window', () => {
    expect(effectiveRate(input)).toEqual({
      ok: true,
      data: {
        value: usd(7_188),
        numerator: usd(460_000),
        denominator: 64,
        recordIds: ['pay-1', 'pay-2', 'pay-3', 'pay-7', 'te-1', 'te-2', 'te-3', 'fx-1'],
      },
    });
  });

  it('is null when there are no client hours', () => {
    expect(effectiveRate({ ...input, timeEntries: [TE_4] })).toEqual({
      ok: true,
      data: {
        value: null,
        numerator: usd(460_000),
        denominator: 0,
        recordIds: ['pay-1', 'pay-2', 'pay-3', 'pay-7', 'fx-1'],
      },
    });
  });

  it('counts income at a zero tax rate', () => {
    expect(effectiveRate({ ...input, taxRateBps: 0 })).toEqual({
      ok: true,
      data: {
        value: usd(7_578),
        numerator: usd(485_000),
        denominator: 64,
        recordIds: ['pay-1', 'pay-2', 'pay-3', 'pay-7', 'te-1', 'te-2', 'te-3', 'fx-1'],
      },
    });
  });

  it('is zero income with no payments', () => {
    expect(effectiveRate({ ...input, payments: [], timeEntries: [TE_1] })).toEqual({
      ok: true,
      data: { value: usd(0), numerator: usd(0), denominator: 20, recordIds: ['te-1'] },
    });
  });

  it('errors when a payment currency has no usable rate', () => {
    expect(effectiveRate({ ...input, rates: [] })).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-09-10' },
    });
  });
});
