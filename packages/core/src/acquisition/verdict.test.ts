import { describe, expect, it } from 'vitest';

import type { Money } from '../money/money';
import { channelVerdict } from './verdict';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });
const BASELINE = usd(6_500);

// Unskipped by T22b.
describe.skip('channelVerdict', () => {
  it('recommends add-hours for the Upwork reference return', () => {
    expect(
      channelVerdict({ returnPerHour: usd(13_356), baselineRate: BASELINE, ageDays: 90 }),
    ).toBe('add-hours');
  });

  it('recommends add-hours for the Cold email reference return', () => {
    expect(
      channelVerdict({ returnPerHour: usd(11_092), baselineRate: BASELINE, ageDays: 90 }),
    ).toBe('add-hours');
  });

  it('recommends trim for the LinkedIn reference return', () => {
    expect(channelVerdict({ returnPerHour: usd(2_692), baselineRate: BASELINE, ageDays: 90 })).toBe(
      'trim',
    );
  });

  it('recommends add-hours for the Referrals reference return', () => {
    expect(
      channelVerdict({ returnPerHour: usd(36_923), baselineRate: BASELINE, ageDays: 90 }),
    ).toBe('add-hours');
  });

  it('is add-hours at exactly 1.5x the baseline', () => {
    expect(channelVerdict({ returnPerHour: usd(9_750), baselineRate: BASELINE, ageDays: 90 })).toBe(
      'add-hours',
    );
  });

  it('is hold just below 1.5x the baseline', () => {
    expect(channelVerdict({ returnPerHour: usd(9_749), baselineRate: BASELINE, ageDays: 90 })).toBe(
      'hold',
    );
  });

  it('is hold at exactly 0.8x the baseline', () => {
    expect(channelVerdict({ returnPerHour: usd(5_200), baselineRate: BASELINE, ageDays: 90 })).toBe(
      'hold',
    );
  });

  it('is trim just below 0.8x the baseline', () => {
    expect(channelVerdict({ returnPerHour: usd(5_199), baselineRate: BASELINE, ageDays: 90 })).toBe(
      'trim',
    );
  });

  it('is trim at zero return', () => {
    expect(channelVerdict({ returnPerHour: usd(0), baselineRate: BASELINE, ageDays: 90 })).toBe(
      'trim',
    );
  });

  it('is trim at a negative return', () => {
    expect(
      channelVerdict({ returnPerHour: usd(-3_100), baselineRate: BASELINE, ageDays: 90 }),
    ).toBe('trim');
  });

  it('is too-early under 45 days regardless of return', () => {
    expect(
      channelVerdict({ returnPerHour: usd(13_356), baselineRate: BASELINE, ageDays: 44 }),
    ).toBe('too-early');
  });

  it('judges 45 days old', () => {
    expect(
      channelVerdict({ returnPerHour: usd(13_356), baselineRate: BASELINE, ageDays: 45 }),
    ).toBe('add-hours');
  });

  it('is no-data without a return', () => {
    expect(channelVerdict({ returnPerHour: null, baselineRate: BASELINE, ageDays: 90 })).toBe(
      'no-data',
    );
  });

  it('checks age before checking for data', () => {
    expect(channelVerdict({ returnPerHour: null, baselineRate: BASELINE, ageDays: 10 })).toBe(
      'too-early',
    );
  });

  it('throws RangeError on a currency mismatch', () => {
    expect(() =>
      channelVerdict({
        returnPerHour: { amount: 13_356, currency: 'UAH' },
        baselineRate: BASELINE,
        ageDays: 90,
      }),
    ).toThrow(RangeError);
  });
});
