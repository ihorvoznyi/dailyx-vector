import { describe, expect, it } from 'vitest';

import type { Money } from '../money/money';
import { rebalance, type RebalanceChannel } from './rebalance';

const usd = (amount: number): Money => ({ amount, currency: 'USD' });
const BASELINE = usd(6_500);

const ch = (
  id: string,
  hoursPerWeek: number,
  maxHours: number | null,
  rph: number | null,
  ageDays = 90,
): RebalanceChannel => ({
  id,
  hoursPerWeek,
  maxHours,
  returnPerHour: rph === null ? null : usd(rph),
  ageDays,
});

const REF = [
  ch('upwork', 8, 15, 13_356),
  ch('email', 5, null, 11_092),
  ch('linkedin', 6, null, 2_692),
  ch('referrals', 1, 2, 36_923),
];

// Unskipped by T22b.
describe.skip('rebalance', () => {
  it('moves hours from the weakest channel to the strongest with room, for the reference set', () => {
    expect(rebalance({ channels: REF, baselineRate: BASELINE })).toEqual({
      donor: 'linkedin',
      moves: [
        { to: 'referrals', hours: 1 },
        { to: 'upwork', hours: 2 },
      ],
      hoursMoved: 3,
      expectedMonthlyGain: usd(240_570),
    });
  });

  it('caps the donor at 4 hours', () => {
    const channels = [
      ch('upwork', 8, 15, 13_356),
      ch('email', 5, null, 11_092),
      ch('linkedin', 10, null, 2_692),
      ch('referrals', 1, 2, 36_923),
    ];
    expect(rebalance({ channels, baselineRate: BASELINE })).toEqual({
      donor: 'linkedin',
      moves: [
        { to: 'referrals', hours: 1 },
        { to: 'upwork', hours: 3 },
      ],
      hoursMoved: 4,
      expectedMonthlyGain: usd(286_746),
    });
  });

  it('gives up to half, rounded down, not bundle.js rounding', () => {
    const channels = [
      ch('upwork', 8, 15, 13_356),
      ch('email', 5, null, 11_092),
      ch('linkedin', 5, null, 2_692),
      ch('referrals', 1, 2, 36_923),
    ];
    expect(rebalance({ channels, baselineRate: BASELINE })).toEqual({
      donor: 'linkedin',
      moves: [
        { to: 'referrals', hours: 1 },
        { to: 'upwork', hours: 1 },
      ],
      hoursMoved: 2,
      expectedMonthlyGain: usd(194_395),
    });
  });

  it('does not let a donor at the baseline give', () => {
    const channels = [
      ch('upwork', 8, 15, 13_356),
      ch('email', 5, null, 11_092),
      ch('linkedin', 6, null, 6_500),
      ch('referrals', 1, 2, 36_923),
    ];
    expect(rebalance({ channels, baselineRate: BASELINE })).toBeNull();
  });

  it('excludes too-early channels as donor or recipient', () => {
    const channels = [...REF, ch('content', 4, null, 100, 30), ch('newbie', 2, null, 50_000, 10)];
    expect(rebalance({ channels, baselineRate: BASELINE })).toEqual({
      donor: 'linkedin',
      moves: [
        { to: 'referrals', hours: 1 },
        { to: 'upwork', hours: 2 },
      ],
      hoursMoved: 3,
      expectedMonthlyGain: usd(240_570),
    });
  });

  it('excludes zero-hour and null-return channels as immature', () => {
    const channels = [...REF, ch('paused', 0, null, 500), ch('unknown', 3, null, null)];
    expect(rebalance({ channels, baselineRate: BASELINE })).toEqual({
      donor: 'linkedin',
      moves: [
        { to: 'referrals', hours: 1 },
        { to: 'upwork', hours: 2 },
      ],
      hoursMoved: 3,
      expectedMonthlyGain: usd(240_570),
    });
  });

  it('is null with no room anywhere', () => {
    const channels = [
      ch('upwork', 8, 8, 13_356),
      ch('email', 5, 5, 11_092),
      ch('linkedin', 6, null, 2_692),
      ch('referrals', 1, 1, 36_923),
    ];
    expect(rebalance({ channels, baselineRate: BASELINE })).toBeNull();
  });

  it('is null when a 1-hour donor would give floor(0.5) = 0', () => {
    const channels = [ch('a', 1, null, 1_000), ch('b', 5, null, 20_000)];
    expect(rebalance({ channels, baselineRate: BASELINE })).toBeNull();
  });

  it('breaks a donor tie in favour of the first, and excludes an equal return as recipient', () => {
    const channels = [ch('x', 4, null, 1_000), ch('y', 4, null, 1_000), ch('z', 2, null, 10_000)];
    expect(rebalance({ channels, baselineRate: BASELINE })).toEqual({
      donor: 'x',
      moves: [{ to: 'z', hours: 2 }],
      hoursMoved: 2,
      expectedMonthlyGain: usd(77_940),
    });
  });
});
