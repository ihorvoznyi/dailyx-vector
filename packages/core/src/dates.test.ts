import { describe, expect, it } from 'vitest';

import { addDays, daysBetween } from './dates';

describe('addDays', () => {
  it('moves back 89 days to the start of a 90-day window', () => {
    expect(addDays('2026-09-28', -89)).toBe('2026-07-01');
  });

  it('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is unaffected by daylight-saving changes', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });

  it('throws RangeError on a malformed or impossible date', () => {
    expect(() => addDays('2026-9-1', 0)).toThrow(RangeError);
    expect(() => addDays('2026-02-30', 0)).toThrow(RangeError);
  });

  it('throws RangeError on a fractional day count', () => {
    expect(() => addDays('2026-09-28', 0.5)).toThrow(RangeError);
  });
});

describe('daysBetween', () => {
  it('counts whole days, negative when the second date is earlier', () => {
    expect(daysBetween('2026-08-14', '2026-09-28')).toBe(45);
    expect(daysBetween('2026-09-28', '2026-09-28')).toBe(0);
    expect(daysBetween('2026-09-28', '2026-07-01')).toBe(-89);
  });

  it('counts a leap day', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('throws RangeError on a malformed date', () => {
    expect(() => daysBetween('2026-09-28', '28.09.2026')).toThrow(RangeError);
  });
});
