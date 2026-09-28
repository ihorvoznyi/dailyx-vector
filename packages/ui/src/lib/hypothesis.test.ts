import { describe, expect, it } from 'vitest';

import { evidenceWord, signed } from './hypothesis';

describe('evidenceWord', () => {
  it('has no data yet when value is null', () => {
    expect(evidenceWord(null)).toEqual(['No data yet', 'neutral']);
  });

  it('is strong evidence it works at or above the threshold', () => {
    expect(evidenceWord(0.95)).toEqual(['Strong evidence it works', 'up']);
  });

  it('is strong evidence it hurts at or below 1 − threshold', () => {
    // 1 - 0.95 = 0.050000000000000044 in floating point, so 0.05 still qualifies.
    expect(evidenceWord(0.05)).toEqual(['Strong evidence it hurts', 'down']);
  });

  it('leans better from 0.75', () => {
    expect(evidenceWord(0.75)).toEqual(['Leaning better', 'info']);
  });

  it('leans worse at or below 0.25', () => {
    expect(evidenceWord(0.25)).toEqual(['Leaning worse', 'warn']);
  });

  it('has no clear difference in the middle', () => {
    expect(evidenceWord(0.5)).toEqual(['No clear difference yet', 'neutral']);
  });
});

describe('signed', () => {
  it('signs positive and negative values with a true minus', () => {
    expect(signed(12, 'pp')).toBe('+12pp');
    expect(signed(-14, 'pp')).toBe('−14pp');
  });

  it('signs zero with ±', () => {
    expect(signed(0, 'pp')).toBe('±0pp');
  });

  it('renders missing values as an em dash', () => {
    expect(signed(null)).toBe('—');
  });

  it('rounds to the given decimals', () => {
    expect(signed(2.345, '', 1)).toBe('+2.3');
  });
});
