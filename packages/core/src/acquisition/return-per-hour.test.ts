import { describe, expect, it } from 'vitest';

import type { Money } from '../money/money';
import { channelReturnPerHour } from './return-per-hour';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });

// Unskipped by T22b.
describe.skip('channelReturnPerHour', () => {
  it('computes the Upwork reference return per hour', () => {
    expect(
      channelReturnPerHour({
        won: usd(1_420_000),
        cashCost: usd(31_000),
        hours: 104,
        recordIds: ['r1'],
      }),
    ).toEqual({
      value: usd(13_356),
      numerator: usd(1_389_000),
      denominator: 104,
      recordIds: ['r1'],
    });
  });

  it('computes the Cold email reference return per hour', () => {
    expect(
      channelReturnPerHour({
        won: usd(750_000),
        cashCost: usd(29_000),
        hours: 65,
        recordIds: ['r1'],
      }),
    ).toEqual({ value: usd(11_092), numerator: usd(721_000), denominator: 65, recordIds: ['r1'] });
  });

  it('computes the LinkedIn reference return per hour', () => {
    expect(
      channelReturnPerHour({
        won: usd(240_000),
        cashCost: usd(30_000),
        hours: 78,
        recordIds: ['r1'],
      }),
    ).toEqual({ value: usd(2_692), numerator: usd(210_000), denominator: 78, recordIds: ['r1'] });
  });

  it('computes the Referrals reference return per hour with zero cost', () => {
    expect(
      channelReturnPerHour({ won: usd(480_000), cashCost: usd(0), hours: 13, recordIds: ['r1'] }),
    ).toEqual({ value: usd(36_923), numerator: usd(480_000), denominator: 13, recordIds: ['r1'] });
  });

  it('is null when hours are zero', () => {
    expect(
      channelReturnPerHour({
        won: usd(1_420_000),
        cashCost: usd(31_000),
        hours: 0,
        recordIds: ['r1'],
      }),
    ).toEqual({ value: null, numerator: usd(1_389_000), denominator: 0, recordIds: ['r1'] });
  });

  it('handles a loss', () => {
    expect(
      channelReturnPerHour({ won: usd(0), cashCost: usd(31_000), hours: 10, recordIds: ['r1'] }),
    ).toEqual({ value: usd(-3_100), numerator: usd(-31_000), denominator: 10, recordIds: ['r1'] });
  });

  it('rounds half away from zero', () => {
    expect(
      channelReturnPerHour({ won: usd(1_000), cashCost: usd(0), hours: 16, recordIds: ['r1'] }),
    ).toEqual({ value: usd(63), numerator: usd(1_000), denominator: 16, recordIds: ['r1'] });
  });

  it('rounds a negative half away from zero', () => {
    expect(
      channelReturnPerHour({ won: usd(-1_000), cashCost: usd(0), hours: 16, recordIds: ['r1'] }),
    ).toEqual({ value: usd(-63), numerator: usd(-1_000), denominator: 16, recordIds: ['r1'] });
  });

  it('accepts fractional hours', () => {
    expect(
      channelReturnPerHour({ won: usd(100_000), cashCost: usd(0), hours: 12.5, recordIds: ['r1'] }),
    ).toEqual({ value: usd(8_000), numerator: usd(100_000), denominator: 12.5, recordIds: ['r1'] });
  });

  it('throws RangeError on a currency mismatch', () => {
    expect(() =>
      channelReturnPerHour({
        won: usd(100),
        cashCost: { amount: 10, currency: 'UAH' },
        hours: 1,
        recordIds: [],
      }),
    ).toThrow(RangeError);
  });
});
