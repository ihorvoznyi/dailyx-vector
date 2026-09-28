import { describe, expect, it } from 'vitest';

import { compareBinary } from './beta-binomial';

/** Float matcher usable inside toEqual (the cast keeps no-unsafe-assignment quiet). */
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

// Unskipped by T26.
describe.skip('compareBinary', () => {
  it('estimates the difference of posterior means for 10/40 vs 20/40', () => {
    const r = compareBinary({
      a: { successes: 10, trials: 40 },
      b: { successes: 20, trials: 40 },
      seed: 1,
    });
    expect(r.estimate).toEqual(near(0.23809523809523808));
    expect(Math.abs(r.pBBeatsA - 0.98898)).toBeLessThan(0.015);
    expect(Math.abs(r.interval[0] - 0.0682)).toBeLessThan(0.015);
    expect(Math.abs(r.interval[1] - 0.4023)).toBeLessThan(0.015);
    expect(r.interval[0]).toBeLessThanOrEqual(r.estimate);
    expect(r.estimate).toBeLessThanOrEqual(r.interval[1]);
  });

  it('estimates the difference of posterior means for 12/40 vs 15/40', () => {
    const r = compareBinary({
      a: { successes: 12, trials: 40 },
      b: { successes: 15, trials: 40 },
      seed: 1,
    });
    expect(r.estimate).toEqual(near(0.0714285714285714));
    expect(Math.abs(r.pBBeatsA - 0.75742)).toBeLessThan(0.015);
    expect(Math.abs(r.interval[0] - -0.0977)).toBeLessThan(0.015);
    expect(Math.abs(r.interval[1] - 0.2389)).toBeLessThan(0.015);
    expect(r.interval[0]).toBeLessThanOrEqual(r.estimate);
    expect(r.estimate).toBeLessThanOrEqual(r.interval[1]);
  });

  it('handles both arms with zero trials (flat Beta(1,1) priors)', () => {
    const r = compareBinary({
      a: { successes: 0, trials: 0 },
      b: { successes: 0, trials: 0 },
      seed: 1,
    });
    expect(r.estimate).toEqual(near(0));
    expect(Math.abs(r.pBBeatsA - 0.5)).toBeLessThan(0.015);
    expect(Math.abs(r.interval[0] - -0.683772)).toBeLessThan(0.015);
    expect(Math.abs(r.interval[1] - 0.683772)).toBeLessThan(0.015);
  });

  it('echoes draws (default 20,000) and the seed', () => {
    const r = compareBinary({
      a: { successes: 10, trials: 40 },
      b: { successes: 20, trials: 40 },
      seed: 1,
    });
    expect(r.draws).toBe(20_000);
    expect(r.seed).toBe(1);
  });

  it('echoes a custom draws count', () => {
    const r = compareBinary({
      a: { successes: 10, trials: 40 },
      b: { successes: 20, trials: 40 },
      seed: 1,
      draws: 5_000,
    });
    expect(r.draws).toBe(5_000);
  });

  it('is reproducible for the same input and seed', () => {
    const input = { a: { successes: 10, trials: 40 }, b: { successes: 20, trials: 40 }, seed: 1 };
    expect(compareBinary(input)).toEqual(compareBinary(input));
  });

  it('differs across seeds', () => {
    const a = compareBinary({
      a: { successes: 10, trials: 40 },
      b: { successes: 20, trials: 40 },
      seed: 1,
    });
    const b = compareBinary({
      a: { successes: 10, trials: 40 },
      b: { successes: 20, trials: 40 },
      seed: 2,
    });
    expect(a).not.toEqual(b);
  });

  it('throws RangeError when successes exceed trials', () => {
    expect(() =>
      compareBinary({ a: { successes: 5, trials: 4 }, b: { successes: 1, trials: 4 }, seed: 1 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError on negative successes', () => {
    expect(() =>
      compareBinary({ a: { successes: -1, trials: 4 }, b: { successes: 1, trials: 4 }, seed: 1 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError on negative trials', () => {
    expect(() =>
      compareBinary({ a: { successes: 5, trials: 40 }, b: { successes: 1, trials: -2 }, seed: 1 }),
    ).toThrow(RangeError);
  });
});
