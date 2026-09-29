import { money } from '@dailyx/core';
import { describe, expect, it } from 'vitest';

import {
  CURRENCY_SYMBOL,
  formatDate,
  formatHours,
  formatMoney,
  formatMonths,
  formatPct,
  formatShortDate,
  formatTimestamp,
  formatWait,
  formatWindow,
  toMajor,
} from './format';

describe('formatMoney', () => {
  it('formats USD and UAH with two decimals by default', () => {
    expect(formatMoney(money(4_821_809, 'USD'))).toBe('$48,218.09');
    expect(formatMoney(money(61_240_000, 'UAH'))).toBe('₴612,400.00');
  });

  it('uses a true minus for negative amounts', () => {
    expect(formatMoney(money(-500, 'USD'))).toBe('−$5.00');
  });

  it('supports zero decimals', () => {
    expect(formatMoney(money(380_000, 'USD'), 0)).toBe('$3,800');
  });
});

describe('formatPct', () => {
  it('formats a ratio as a percentage', () => {
    expect(formatPct(0.6)).toBe('60%');
  });

  it('renders null as an em dash', () => {
    expect(formatPct(null)).toBe('—');
  });
});

describe('formatMonths', () => {
  it('formats to one decimal', () => {
    expect(formatMonths(12.689)).toBe('12.7 mo');
  });
});

describe('formatHours', () => {
  it.each([
    [8, '8h'],
    [2.5, '2.5h'],
    [9.25, '9.25h'],
  ])('%s -> %s', (hours, expected) => {
    expect(formatHours(hours)).toBe(expected);
  });
});

describe('formatDate', () => {
  it('formats an ISO date in UTC', () => {
    expect(formatDate('2026-09-29')).toBe('Sep 29, 2026');
  });
});

describe('formatShortDate', () => {
  it('formats without a year', () => {
    expect(formatShortDate('2026-09-14')).toBe('Sep 14');
  });
});

describe('formatWait', () => {
  it.each([
    [0.5, '<1h'],
    [47.9, '47h'],
    [72, '3d'],
  ])('%s -> %s', (hours, expected) => {
    expect(formatWait(hours)).toBe(expected);
  });
});

describe('CURRENCY_SYMBOL', () => {
  it('maps every currency to its symbol', () => {
    expect(CURRENCY_SYMBOL).toEqual({ USD: '$', UAH: '₴', EUR: '€' });
  });
});

describe('toMajor', () => {
  it('converts minor units to major units', () => {
    expect(toMajor(380000)).toBe(3800);
  });
});

describe('formatWindow', () => {
  it('formats a date window as a range', () => {
    expect(formatWindow({ start: '2026-09-01', end: '2026-09-30' })).toBe(
      'Sep 1, 2026 – Sep 30, 2026',
    );
  });
});

describe('formatTimestamp', () => {
  it('formats an ISO timestamp in the given timezone', () => {
    const result = formatTimestamp('2026-09-29T11:05:00.000Z', 'Europe/Kyiv');
    expect(result).toBe('Sep 29, 2026, 14:05');
  });
});
