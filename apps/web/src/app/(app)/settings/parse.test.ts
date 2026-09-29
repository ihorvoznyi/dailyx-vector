import { describe, expect, it } from 'vitest';

import { isTimeZone, parseSettingsForm } from './parse';

function validFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base = {
    baseCurrency: 'USD',
    monthlyCost: '3800',
    monthlyCostCurrency: 'UAH',
    taxRate: '5',
    baselineRate: '65',
    targetHours: '40',
    horizonMonths: '12',
    timezone: 'Europe/Kyiv',
    ...overrides,
  };
  for (const [key, value] of Object.entries(base)) fd.append(key, value);
  return fd;
}

describe('isTimeZone', () => {
  it('accepts a known IANA zone and rejects an unknown one', () => {
    expect(isTimeZone('Europe/Kyiv')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
  });
});

describe('parseSettingsForm', () => {
  it('parses a valid form into exact minor units and bps', () => {
    const result = parseSettingsForm(validFormData());
    expect(result).toEqual({
      ok: true,
      data: {
        baseCurrency: 'USD',
        monthlyCost: 380000,
        monthlyCostCurrency: 'UAH',
        taxRateBps: 500,
        baselineRate: 6500,
        targetHours: 40,
        horizonMonths: 12,
        timezone: 'Europe/Kyiv',
      },
    });
  });

  it('accepts UTC as a timezone', () => {
    const result = parseSettingsForm(validFormData({ timezone: 'UTC' }));
    expect(result.ok).toBe(true);
  });

  it.each([
    ['monthlyCost', '12.345'],
    ['monthlyCost', '-5'],
    ['monthlyCost', ''],
    ['taxRate', '100.01'],
    ['baseCurrency', 'GBP'],
    ['horizonMonths', '0'],
    ['targetHours', '7.5'],
    ['timezone', 'Mars/Olympus'],
  ])('rejects %s = %s', (field, value) => {
    const result = parseSettingsForm(validFormData({ [field]: value }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.error.startsWith(field)).toBe(true);
  });
});
