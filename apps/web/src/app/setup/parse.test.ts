import { describe, expect, it } from 'vitest';

import { parseSetupForm } from './parse';

function validFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base = {
    bets: '{"upwork":8,"email":5}',
    'sentPerWeek.upwork': '15',
    'sentPerWeek.email': '',
    monthlyCost: '3800',
    monthlyCostCurrency: 'USD',
    taxRate: '5',
    withAccounts: '1',
    'account.monobank.balance': '612400',
    'account.ibkr.balance': '26450',
    'account.paypal.balance': '5240',
    'account.payoneer.balance': '1700',
    'account.monobank.liquid': 'on',
    'account.ibkr.liquid': 'on',
    'account.paypal.liquid': 'on',
    'account.payoneer.liquid': 'on',
    uahRate: '41.3',
    ...overrides,
  };
  for (const [key, value] of Object.entries(base)) fd.append(key, value);
  return fd;
}

describe('parseSetupForm', () => {
  it('parses a valid form with accounts into exact minor units', () => {
    const result = parseSetupForm(validFormData());
    expect(result).toEqual({
      ok: true,
      data: {
        bets: [
          { preset: 'upwork', hoursPerWeek: 8, sentPerWeek: 15 },
          { preset: 'email', hoursPerWeek: 5, sentPerWeek: null },
        ],
        settings: { monthlyCost: 380_000, monthlyCostCurrency: 'USD', taxRateBps: 500 },
        accounts: [
          { key: 'monobank', balance: 61_240_000, isLiquid: true },
          { key: 'ibkr', balance: 2_645_000, isLiquid: true },
          { key: 'paypal', balance: 524_000, isLiquid: true },
          { key: 'payoneer', balance: 170_000, isLiquid: true },
        ],
        uahRateE6: 41_300_000,
      },
    });
  });

  it('leaves accounts and the rate null without withAccounts', () => {
    const fd = validFormData({ withAccounts: '', uahRate: '' });
    const result = parseSetupForm(fd);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected success');
    expect(result.data.accounts).toBeNull();
    expect(result.data.uahRateE6).toBeNull();
  });

  it.each([
    ['bets', '{}'],
    ['bets', '{"myspace":3}'],
    ['bets', '{"upwork":0}'],
    ['bets', '{"upwork":41}'],
    ['bets', 'not json'],
    ['taxRate', '100.01'],
  ])('rejects %s = %s', (field, value) => {
    const result = parseSetupForm(validFormData({ [field]: value }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.error.startsWith(field)).toBe(true);
  });

  it('rejects withAccounts=1 with a blank uahRate', () => {
    const result = parseSetupForm(validFormData({ uahRate: '' }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.error.startsWith('uahRate')).toBe(true);
  });
});
