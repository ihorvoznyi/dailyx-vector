import { describe, expect, it } from 'vitest';

import { convert, type FxRate } from './fx';
import type { Money } from './money';

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

const FX_A: FxRate = {
  id: 'fx-a',
  date: '2026-09-10',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_000_000,
};
const FX_B: FxRate = {
  id: 'fx-b',
  date: '2026-09-10',
  base: 'UAH',
  quote: 'USD',
  rateE6: 24_000,
};
const FX_C: FxRate = {
  id: 'fx-c',
  date: '2026-09-12',
  base: 'USD',
  quote: 'UAH',
  rateE6: 40_000_000,
};
const FX_D: FxRate = {
  id: 'fx-d',
  date: '2026-09-10',
  base: 'USD',
  quote: 'UAH',
  rateE6: 40_000_000,
};
const FX_E: FxRate = { ...FX_D, id: 'fx-e', rateE6: 50_000_000 };

// Unskipped by stage 10 (T08).
describe.skip('convert', () => {
  it('needs no rate when converting to the same currency', () => {
    expect(convert(usd(12_345), 'USD', '2026-09-28', [])).toEqual({
      ok: true,
      data: { money: usd(12_345), rate: null },
    });
  });

  it('inverts the rate when converting from the quote currency to the base currency', () => {
    expect(convert(uah(61_240_000), 'USD', '2026-09-10', RATES)).toEqual({
      ok: true,
      data: { money: usd(1_482_809), rate: FX_1 },
    });
  });

  it('uses the latest rate on or before the date, never a later one', () => {
    expect(convert(uah(61_240_000), 'USD', '2026-09-28', RATES)).toEqual({
      ok: true,
      data: { money: usd(1_475_663), rate: FX_2 },
    });
  });

  it('counts a rate dated on the conversion day itself', () => {
    expect(convert(uah(61_240_000), 'USD', '2026-09-25', RATES)).toEqual({
      ok: true,
      data: { money: usd(1_475_663), rate: FX_2 },
    });
  });

  it('converts directly from the base currency to the quote currency', () => {
    expect(convert(usd(10_000), 'UAH', '2026-09-28', RATES)).toEqual({
      ok: true,
      data: { money: uah(415_000), rate: FX_2 },
    });
  });

  it('rounds half away from zero, not half to even', () => {
    expect(convert(usd(3), 'UAH', '2026-09-28', RATES)).toEqual({
      ok: true,
      data: { money: uah(125), rate: FX_2 },
    });
    expect(convert(usd(-3), 'UAH', '2026-09-28', RATES)).toEqual({
      ok: true,
      data: { money: uah(-125), rate: FX_2 },
    });
  });

  it('errors when no rate is dated on or before the conversion date', () => {
    expect(convert(uah(100), 'USD', '2026-08-31', RATES)).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'UAH', to: 'USD', on: '2026-08-31' },
    });
  });

  it('never triangulates through a third currency', () => {
    expect(convert({ amount: 100, currency: 'EUR' }, 'UAH', '2026-09-28', RATES)).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'EUR', to: 'UAH', on: '2026-09-28' },
    });
  });

  it('errors when there are no rates at all', () => {
    expect(convert(usd(1), 'UAH', '2026-09-28', [])).toEqual({
      ok: false,
      error: { kind: 'missing-fx-rate', from: 'USD', to: 'UAH', on: '2026-09-28' },
    });
  });

  it('prefers the direct pair over the inverse pair on the same date, in either array order', () => {
    expect(convert(uah(1_000_000), 'USD', '2026-09-10', [FX_A, FX_B])).toEqual({
      ok: true,
      data: { money: usd(24_000), rate: FX_B },
    });
    expect(convert(uah(1_000_000), 'USD', '2026-09-10', [FX_B, FX_A])).toEqual({
      ok: true,
      data: { money: usd(24_000), rate: FX_B },
    });
  });

  it('prefers a later date over an earlier direct pair', () => {
    expect(convert(uah(1_000_000), 'USD', '2026-09-15', [FX_A, FX_B, FX_C])).toEqual({
      ok: true,
      data: { money: usd(25_000), rate: FX_C },
    });
  });

  it('breaks a same-date, same-pair tie in favour of the later array element', () => {
    expect(convert(usd(100), 'UAH', '2026-09-10', [FX_D, FX_E])).toEqual({
      ok: true,
      data: { money: uah(5_000), rate: FX_E },
    });
  });
});
