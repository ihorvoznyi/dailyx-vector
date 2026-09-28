import { describe, expect, it } from 'vitest';

import type { FxRate } from './fx';
import { freedomRatio, monthsToFreedom, type RecurringIncomeInput } from './freedom';
import type { Money } from './money';
import type { Payment } from './net-income';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });
const uah = (amount: number): Money => ({ amount, currency: 'UAH' });
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

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

const rec = (id: string, date: string, amount: Money, platformFee = usd(0)): Payment =>
  pay({ id, date, amount, platformFee, isRecurring: true });

const FX_0: FxRate = {
  id: 'fx-0',
  date: '2026-07-01',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_000_000,
};
const FX_1: FxRate = {
  id: 'fx-1',
  date: '2026-09-01',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_300_000,
};
const RATES = [FX_0, FX_1];

// Monthly recurring net: May 228,000 · Jun 253,500 · Jul 269,870 · Aug 263,700.
// Average (Jun–Aug) = round(787,070 ÷ 3 = 262,356.67) = 262,357.
// Growth = round((263,700 − 228,000) ÷ 3) = 11,900. Gap = 380,000 − 262,357 = 117,643.
const P: Payment[] = [
  rec('r-apr-lumen', '2026-04-01', usd(240_000)), // before the 4 growth months
  rec('r-may-lumen', '2026-05-01', usd(240_000)), // 228,000
  rec('r-jun-lumen', '2026-06-01', usd(240_000)), // 228,000
  rec('r-jun-kit', '2026-06-15', usd(30_000), usd(3_000)), // 25,500
  rec('r-jul-lumen', '2026-07-01', usd(240_000)), // 228,000
  rec('r-jul-kit', '2026-07-15', usd(38_000), usd(3_800)), // 32,300
  rec('r-jul-uah', '2026-07-20', uah(413_000)), // ₴392,350 → 9,570 at FX_0 (9,569.51)
  rec('r-aug-lumen', '2026-08-01', usd(240_000)), // 228,000
  rec('r-aug-kit', '2026-08-15', usd(42_000), usd(4_200)), // 35,700
  rec('r-sep-lumen', '2026-09-01', usd(240_000)), // current month: excluded
  pay({ id: 'n-aug-north', date: '2026-08-20', amount: usd(150_000) }), // not recurring
  pay({
    id: 'p-aug-orbit',
    date: '2026-08-25',
    amount: usd(60_000),
    isRecurring: true,
    certainty: 'pipeline',
  }),
  pay({
    id: 's-aug-lumen',
    date: '2026-08-28',
    amount: usd(240_000),
    isRecurring: true,
    certainty: 'secured',
  }),
];

const FULL_RATIO_RECORD_IDS = [
  'r-jun-lumen',
  'r-jun-kit',
  'r-jul-lumen',
  'r-jul-kit',
  'r-jul-uah',
  'r-aug-lumen',
  'r-aug-kit',
  'fx-0',
];
const FULL_MONTHS_RECORD_IDS = [
  'r-may-lumen',
  'r-jun-lumen',
  'r-jun-kit',
  'r-jul-lumen',
  'r-jul-kit',
  'r-jul-uah',
  'r-aug-lumen',
  'r-aug-kit',
  'fx-0',
];

const baseInput: RecurringIncomeInput = {
  payments: P,
  taxRateBps: 500,
  monthlyCost: usd(380_000),
  rates: RATES,
  base: 'USD',
  on: '2026-09-28',
};

// Lumen only: May, Jun, Jul, Aug all flat at usd(240,000) net 228,000, as used in cases 4, 6 and 7.
const R_MAY_LUMEN = rec('r-may-lumen', '2026-05-01', usd(240_000));
const R_JUN_LUMEN = rec('r-jun-lumen', '2026-06-01', usd(240_000));
const R_JUL_LUMEN = rec('r-jul-lumen', '2026-07-01', usd(240_000));
const R_AUG_LUMEN = rec('r-aug-lumen', '2026-08-01', usd(240_000));
const LUMEN_ONLY: Payment[] = [R_MAY_LUMEN, R_JUN_LUMEN, R_JUL_LUMEN, R_AUG_LUMEN];
const FLAT_RATIO_RECORD_IDS = ['r-jun-lumen', 'r-jul-lumen', 'r-aug-lumen'];
const FLAT_MONTHS_RECORD_IDS = ['r-may-lumen', 'r-jun-lumen', 'r-jul-lumen', 'r-aug-lumen'];

// Unskipped by stage 10 (T08).
describe.skip('freedomRatio', () => {
  it('is average recurring net income over the last 3 complete months, over the monthly cost', () => {
    expect(freedomRatio(baseInput)).toEqual({
      ok: true,
      data: {
        value: near(0.6904131578947369),
        numerator: usd(262_357),
        denominator: usd(380_000),
        recordIds: FULL_RATIO_RECORD_IDS,
      },
    });
  });

  it('converts a monthly cost given in another currency', () => {
    expect(freedomRatio({ ...baseInput, monthlyCost: uah(15_694_000) })).toEqual({
      ok: true,
      data: {
        value: near(0.6904131578947369),
        numerator: usd(262_357),
        denominator: usd(380_000),
        recordIds: [...FULL_RATIO_RECORD_IDS, 'fx-1'],
      },
    });
  });

  it('is flat when the last 3 months are identical', () => {
    expect(freedomRatio({ ...baseInput, payments: LUMEN_ONLY })).toEqual({
      ok: true,
      data: {
        value: near(0.6),
        numerator: usd(228_000),
        denominator: usd(380_000),
        recordIds: FLAT_RATIO_RECORD_IDS,
      },
    });
  });

  it('can exceed 1 when recurring income already covers the cost', () => {
    expect(freedomRatio({ ...baseInput, payments: LUMEN_ONLY, monthlyCost: usd(200_000) })).toEqual(
      {
        ok: true,
        data: {
          value: near(1.14),
          numerator: usd(228_000),
          denominator: usd(200_000),
          recordIds: FLAT_RATIO_RECORD_IDS,
        },
      },
    );
  });

  it('is null when the monthly cost is zero', () => {
    expect(freedomRatio({ ...baseInput, payments: LUMEN_ONLY, monthlyCost: usd(0) })).toEqual({
      ok: true,
      data: {
        value: null,
        numerator: usd(228_000),
        denominator: usd(0),
        recordIds: FLAT_RATIO_RECORD_IDS,
      },
    });
  });

  it('uses the 3 complete UTC calendar months before the month containing `on`, across a year boundary', () => {
    const YEAR_BOUNDARY: Payment[] = [
      rec('y-sep', '2025-09-01', usd(240_000)),
      rec('y-oct', '2025-10-01', usd(240_000)),
      rec('y-nov', '2025-11-01', usd(240_000)),
      rec('y-dec', '2025-12-01', usd(240_000)),
      rec('y-jan', '2026-01-02', usd(240_000)),
    ];
    expect(freedomRatio({ ...baseInput, payments: YEAR_BOUNDARY, on: '2026-01-15' })).toEqual({
      ok: true,
      data: {
        value: near(0.6),
        numerator: usd(228_000),
        denominator: usd(380_000),
        recordIds: ['y-oct', 'y-nov', 'y-dec'],
      },
    });
  });

  it('errors when a payment currency has no usable rate on its own date', () => {
    expect(freedomRatio({ ...baseInput, rates: [FX_1] })).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-07-20' },
    });
  });
});

// Unskipped by stage 10 (T08).
describe.skip('monthsToFreedom', () => {
  it('is the gap over the average monthly growth in recurring income', () => {
    expect(monthsToFreedom(baseInput)).toEqual({
      ok: true,
      data: {
        value: near(9.885966386554621),
        numerator: usd(117_643),
        denominator: usd(11_900),
        recordIds: FULL_MONTHS_RECORD_IDS,
      },
    });
  });

  it('is null when growth is flat, not above zero', () => {
    expect(monthsToFreedom({ ...baseInput, payments: LUMEN_ONLY })).toEqual({
      ok: true,
      data: {
        value: null,
        numerator: usd(152_000),
        denominator: usd(0),
        recordIds: FLAT_MONTHS_RECORD_IDS,
      },
    });
  });

  it('is null when growth is negative', () => {
    const SHRINKING: Payment[] = [
      R_MAY_LUMEN,
      R_JUN_LUMEN,
      rec('r-jun-kit', '2026-06-15', usd(30_000), usd(3_000)),
      R_JUL_LUMEN,
    ];
    expect(monthsToFreedom({ ...baseInput, payments: SHRINKING })).toEqual({
      ok: true,
      data: {
        value: null,
        numerator: usd(219_500),
        denominator: usd(-76_000),
        recordIds: ['r-may-lumen', 'r-jun-lumen', 'r-jun-kit', 'r-jul-lumen'],
      },
    });
  });

  it('is zero when recurring already covers the cost', () => {
    expect(
      monthsToFreedom({ ...baseInput, payments: LUMEN_ONLY, monthlyCost: usd(200_000) }),
    ).toEqual({
      ok: true,
      data: {
        value: 0,
        numerator: usd(-28_000),
        denominator: usd(0),
        recordIds: FLAT_MONTHS_RECORD_IDS,
      },
    });
  });

  it('is zero when the monthly cost is zero', () => {
    expect(monthsToFreedom({ ...baseInput, payments: LUMEN_ONLY, monthlyCost: usd(0) })).toEqual({
      ok: true,
      data: {
        value: 0,
        numerator: usd(-228_000),
        denominator: usd(0),
        recordIds: FLAT_MONTHS_RECORD_IDS,
      },
    });
  });

  it('uses the 4 months needed for growth across a year boundary', () => {
    const YEAR_BOUNDARY: Payment[] = [
      rec('y-sep', '2025-09-01', usd(240_000)),
      rec('y-oct', '2025-10-01', usd(240_000)),
      rec('y-nov', '2025-11-01', usd(240_000)),
      rec('y-dec', '2025-12-01', usd(240_000)),
      rec('y-jan', '2026-01-02', usd(240_000)),
    ];
    expect(monthsToFreedom({ ...baseInput, payments: YEAR_BOUNDARY, on: '2026-01-15' })).toEqual({
      ok: true,
      data: {
        value: null,
        numerator: usd(152_000),
        denominator: usd(0),
        recordIds: ['y-sep', 'y-oct', 'y-nov', 'y-dec'],
      },
    });
  });

  it('errors when a payment currency has no usable rate on its own date', () => {
    expect(monthsToFreedom({ ...baseInput, rates: [FX_1] })).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-07-20' },
    });
  });
});
