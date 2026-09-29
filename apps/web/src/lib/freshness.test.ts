import { describe, expect, it } from 'vitest';

import { ageDays, isStale, sourceLine, STALE_AFTER_DAYS, updatedAgo } from './freshness';

const TODAY = '2026-09-29';

describe('STALE_AFTER_DAYS', () => {
  it('is 7', () => {
    expect(STALE_AFTER_DAYS).toBe(7);
  });
});

describe('ageDays', () => {
  it('is never negative', () => {
    expect(ageDays('2026-09-29', TODAY)).toBe(0);
    expect(ageDays('2026-09-26', TODAY)).toBe(3);
  });
});

describe('updatedAgo', () => {
  it.each([
    ['2026-09-29', 'today'],
    ['2026-09-28', 'yesterday'],
    ['2026-09-26', '3 days ago'],
  ])('%s -> %s', (asOf, expected) => {
    expect(updatedAgo(asOf, TODAY)).toBe(expected);
  });
});

describe('sourceLine', () => {
  it.each([
    ['2026-09-29', 'Manual · updated today'],
    ['2026-09-28', 'Manual · updated yesterday'],
    ['2026-09-26', 'Manual · updated 3 days ago'],
  ])('%s -> %s', (asOf, expected) => {
    expect(sourceLine(asOf, TODAY)).toBe(expected);
  });

  it('renders no-balance-yet for null', () => {
    expect(sourceLine(null, TODAY)).toBe('Manual · no balance yet');
  });
});

describe('isStale', () => {
  it('is not stale at exactly 7 days', () => {
    expect(isStale('2026-09-22', TODAY)).toBe(false);
  });

  it('is stale at 8 days', () => {
    expect(isStale('2026-09-21', TODAY)).toBe(true);
  });

  it('is stale with no snapshot', () => {
    expect(isStale(null, TODAY)).toBe(true);
  });
});
