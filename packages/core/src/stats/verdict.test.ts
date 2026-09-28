import { describe, expect, it } from 'vitest';

import { experimentVerdict } from './verdict';

// Unskipped by T26.
describe.skip('experimentVerdict', () => {
  it('is supported when the interval clears zero upward (H-03)', () => {
    expect(experimentVerdict([4, 20], 'up')).toBe('supported');
  });

  it('is refuted when the interval clears zero downward for an up direction (H-04)', () => {
    expect(experimentVerdict([-27, -1], 'up')).toBe('refuted');
  });

  it('is inconclusive when the interval straddles zero (H-06)', () => {
    expect(experimentVerdict([-8, 14], 'up')).toBe('inconclusive');
  });

  it('is inconclusive when the interval touches zero at the lower end', () => {
    expect(experimentVerdict([0, 5], 'up')).toBe('inconclusive');
  });

  it('is inconclusive when the interval touches zero at the upper end', () => {
    expect(experimentVerdict([-5, 0], 'up')).toBe('inconclusive');
  });

  it('is supported when the interval clears zero downward for a down direction', () => {
    expect(experimentVerdict([-9, -2], 'down')).toBe('supported');
  });

  it('is refuted when the interval clears zero upward for a down direction', () => {
    expect(experimentVerdict([2, 9], 'down')).toBe('refuted');
  });

  it('is inconclusive when the interval straddles zero for a down direction', () => {
    expect(experimentVerdict([-3, 3], 'down')).toBe('inconclusive');
  });
});
