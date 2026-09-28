import { describe, expect, it } from 'vitest';

import { deltasPp } from './delta';

/** Float matcher usable inside toEqual (the cast keeps no-unsafe-assignment quiet). */
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

// Unskipped by stage 11 (T22a).
describe('deltasPp', () => {
  it('computes percentage-point deltas for the Upwork reference funnel', () => {
    expect(deltasPp([112 / 180, 41 / 112, 19 / 41, 6 / 19], [0.55, 0.33, 0.5, 0.28])).toEqual([
      near(7.222222222222219, 6),
      near(3.607142857142853, 6),
      near(-3.6585365853658516, 6),
      near(3.578947368421048, 6),
    ]);
  });

  it('is null where either side is null', () => {
    expect(deltasPp([0.5, null, 0.2], [null, 0.3, 0.2])).toEqual([null, null, 0]);
  });

  it('returns an empty array for empty input', () => {
    expect(deltasPp([], [])).toEqual([]);
  });

  it('throws RangeError when the arrays differ in length', () => {
    expect(() => deltasPp([0.1], [])).toThrow(RangeError);
  });
});
