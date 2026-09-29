import { describe, expect, it } from 'vitest';

import { todayIn, weekStartIn } from './dates';

describe('todayIn', () => {
  it('resolves the calendar date in the given timezone', () => {
    const now = new Date('2026-09-28T22:30:00Z');
    expect(todayIn('Europe/Kyiv', now)).toBe('2026-09-29');
    expect(todayIn('UTC', now)).toBe('2026-09-28');
  });

  it('handles a timezone behind UTC', () => {
    expect(todayIn('America/Los_Angeles', new Date('2026-09-29T05:00:00Z'))).toBe('2026-09-28');
  });
});

describe('weekStartIn', () => {
  it('gives the Monday of the current week in the given timezone', () => {
    const now = new Date('2026-10-04T21:30:00Z');
    expect(weekStartIn('Europe/Kyiv', now)).toBe('2026-10-05');
    expect(weekStartIn('UTC', now)).toBe('2026-09-28');
  });
});
