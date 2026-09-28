import { describe, expect, it } from 'vitest';

import { createRng } from './rng';

/** Draws `n` values from a fresh generator seeded with `seed`. */
function draw(seed: number, n: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => rng());
}

// Unskipped by T26.
describe.skip('createRng', () => {
  it('produces the pinned mulberry32 sequence for seed 42', () => {
    expect(draw(42, 3)).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099]);
  });

  it('produces the pinned mulberry32 sequence for seed 0', () => {
    expect(draw(0, 3)).toEqual([0.26642920868471265, 0.0003297457005828619, 0.2232720274478197]);
  });

  it('produces the pinned mulberry32 sequence for seed 20260928', () => {
    expect(draw(20260928, 3)).toEqual([
      0.9410575465299189, 0.21826664870604873, 0.6791353551670909,
    ]);
  });

  it('is deterministic: the same seed gives identical 1,000-value sequences', () => {
    expect(draw(42, 1_000)).toEqual(draw(42, 1_000));
  });

  it('differs across seeds within the first 3 values', () => {
    const a = draw(1, 3);
    const b = draw(2, 3);
    expect(a).not.toEqual(b);
  });

  it('stays within [0, 1) over 10,000 draws', () => {
    const values = draw(7, 10_000);
    for (const x of values) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
