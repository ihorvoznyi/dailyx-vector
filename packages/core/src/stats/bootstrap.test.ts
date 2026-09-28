import { describe, expect, it } from 'vitest';

import { compareContinuous } from './bootstrap';

// Unskipped by T26.
describe.skip('compareContinuous', () => {
  it('is exact for constant arms', () => {
    const r = compareContinuous({ a: [1, 1, 1], b: [3, 3, 3], seed: 1 });
    expect(r).toEqual({
      estimate: 2,
      pBBeatsA: 1,
      interval: [2, 2],
      draws: 5_000,
      seed: 1,
    });
  });

  it('is exact for identical arms', () => {
    const r = compareContinuous({ a: [5, 5], b: [5, 5], seed: 1 });
    expect(r).toEqual({
      estimate: 0,
      pBBeatsA: 0,
      interval: [0, 0],
      draws: 5_000,
      seed: 1,
    });
  });

  it('gives an exact estimate and pBBeatsA for separated arms', () => {
    const r = compareContinuous({
      a: [100, 120, 90, 110, 130],
      b: [150, 160, 140, 170, 155],
      seed: 3,
    });
    expect(r.estimate).toBe(45);
    expect(r.pBBeatsA).toBe(1);
    expect(r.interval[0]).toBeGreaterThanOrEqual(10);
    expect(r.interval[0]).toBeLessThanOrEqual(45);
    expect(r.interval[1]).toBeGreaterThanOrEqual(45);
    expect(r.interval[1]).toBeLessThanOrEqual(80);
    expect(r.draws).toBe(5_000);
    expect(r.seed).toBe(3);
  });

  it('echoes a custom resamples count as draws', () => {
    const r = compareContinuous({ a: [1, 1, 1], b: [3, 3, 3], seed: 1, resamples: 200 });
    expect(r.draws).toBe(200);
  });

  it('is reproducible for the same seed', () => {
    const input = { a: [100, 120, 90, 110, 130], b: [150, 160, 140, 170, 155], seed: 3 };
    expect(compareContinuous(input)).toEqual(compareContinuous(input));
  });

  it('differs across seeds on non-integer arms', () => {
    const a = compareContinuous({
      a: [1.1, 2.3, 3.7, 4.2, 5.9, 6.4, 7.8],
      b: [2.05, 3.33, 4.71, 5.29, 6.94, 7.13, 8.66],
      seed: 1,
    });
    const b = compareContinuous({
      a: [1.1, 2.3, 3.7, 4.2, 5.9, 6.4, 7.8],
      b: [2.05, 3.33, 4.71, 5.29, 6.94, 7.13, 8.66],
      seed: 2,
    });
    expect(a).not.toEqual(b);
  });

  it('throws RangeError when arm a is empty', () => {
    expect(() => compareContinuous({ a: [], b: [1, 2, 3], seed: 1 })).toThrow(RangeError);
  });

  it('throws RangeError when arm b is empty', () => {
    expect(() => compareContinuous({ a: [1, 2, 3], b: [], seed: 1 })).toThrow(RangeError);
  });
});
