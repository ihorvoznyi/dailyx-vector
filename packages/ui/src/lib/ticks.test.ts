import { describe, expect, it } from 'vitest';

import { niceTicks } from './ticks';

describe('niceTicks', () => {
  it('picks 1, 2 or 5 × 10^k steps that cover the range', () => {
    expect(niceTicks(0, 10, 4)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(26000, 49000, 4)).toEqual([25000, 30000, 35000, 40000, 45000, 50000]);
  });

  it('widens an empty range and drops float noise', () => {
    expect(niceTicks(5, 5, 4)).toEqual([5, 5.2, 5.4, 5.6, 5.8, 6]);
  });
});
