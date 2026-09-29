import { describe, expect, it } from 'vitest';

import {
  parseAccountForm,
  parseBalanceForm,
  parseIncomeSourceForm,
  parsePaymentForm,
} from './parse';

const TODAY = '2026-09-28';
const ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';
const INCOME_SOURCE_ID = '22222222-2222-4222-8222-222222222222';

function fdOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return fd;
}

describe('parseBalanceForm', () => {
  it('parses a USD balance with a null rate', () => {
    const result = parseBalanceForm(fdOf({ accountId: ACCOUNT_ID, amount: '1700' }), 'USD', TODAY);
    expect(result).toEqual({
      ok: true,
      data: {
        accountId: ACCOUNT_ID,
        amount: 170_000,
        asOf: TODAY,
        rateE6: null,
        returnTo: '/money',
      },
    });
  });

  it('rejects a UAH balance with a blank rate', () => {
    const result = parseBalanceForm(
      fdOf({ accountId: ACCOUNT_ID, amount: '612400', rate: '' }),
      'UAH',
      TODAY,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.error.startsWith('rate')).toBe(true);
  });

  it('parses a UAH balance rate into rateE6', () => {
    const result = parseBalanceForm(
      fdOf({ accountId: ACCOUNT_ID, amount: '612400', rate: '41.3' }),
      'UAH',
      TODAY,
    );
    expect(result).toEqual({
      ok: true,
      data: {
        accountId: ACCOUNT_ID,
        amount: 61_240_000,
        asOf: TODAY,
        rateE6: 41_300_000,
        returnTo: '/money',
      },
    });
  });

  it('rejects an asOf date in the future', () => {
    const result = parseBalanceForm(
      fdOf({ accountId: ACCOUNT_ID, amount: '1700', asOf: '2026-09-29' }),
      'USD',
      TODAY,
    );
    expect(result.ok).toBe(false);
  });

  it('defaults returnTo to /money', () => {
    const result = parseBalanceForm(fdOf({ accountId: ACCOUNT_ID, amount: '1700' }), 'USD', TODAY);
    if (!result.ok) throw new Error('expected success');
    expect(result.data.returnTo).toBe('/money');
  });

  it('accepts /review as returnTo', () => {
    const result = parseBalanceForm(
      fdOf({ accountId: ACCOUNT_ID, amount: '1700', returnTo: '/review' }),
      'USD',
      TODAY,
    );
    if (!result.ok) throw new Error('expected success');
    expect(result.data.returnTo).toBe('/review');
  });
});

describe('parsePaymentForm', () => {
  it('defaults a blank platform fee and tax reserve', () => {
    const result = parsePaymentForm(
      fdOf({
        incomeSourceId: INCOME_SOURCE_ID,
        date: '2026-09-01',
        amount: '2400',
        currency: 'USD',
        platformFee: '',
        taxReserved: '',
      }),
      TODAY,
    );
    expect(result).toEqual({
      ok: true,
      data: {
        incomeSourceId: INCOME_SOURCE_ID,
        date: '2026-09-01',
        amount: 240_000,
        currency: 'USD',
        platformFee: 0,
        taxReserved: null,
        isRecurring: false,
      },
    });
  });

  it('parses an explicit platform fee and tax reserve', () => {
    const result = parsePaymentForm(
      fdOf({
        incomeSourceId: INCOME_SOURCE_ID,
        date: '2026-09-01',
        amount: '2400',
        currency: 'USD',
        platformFee: '12.5',
        taxReserved: '120',
      }),
      TODAY,
    );
    if (!result.ok) throw new Error('expected success');
    expect(result.data.platformFee).toBe(1_250);
    expect(result.data.taxReserved).toBe(12_000);
  });

  it('marks recurring when the checkbox is on', () => {
    const result = parsePaymentForm(
      fdOf({
        incomeSourceId: INCOME_SOURCE_ID,
        date: '2026-09-01',
        amount: '2400',
        currency: 'USD',
        recurring: 'on',
      }),
      TODAY,
    );
    if (!result.ok) throw new Error('expected success');
    expect(result.data.isRecurring).toBe(true);
  });

  it('defaults the date to today when blank', () => {
    const result = parsePaymentForm(
      fdOf({ incomeSourceId: INCOME_SOURCE_ID, amount: '2400', currency: 'USD' }),
      TODAY,
    );
    if (!result.ok) throw new Error('expected success');
    expect(result.data.date).toBe(TODAY);
  });
});

describe('parseAccountForm', () => {
  it('parses a new account', () => {
    const result = parseAccountForm(
      fdOf({ name: 'Payoneer', kind: 'wallet', currency: 'USD', isLiquid: 'on' }),
    );
    expect(result).toEqual({
      ok: true,
      data: { id: null, name: 'Payoneer', kind: 'wallet', currency: 'USD', isLiquid: true },
    });
  });

  it('parses an existing account edit with an id', () => {
    const result = parseAccountForm(
      fdOf({ id: ACCOUNT_ID, name: 'Payoneer', kind: 'wallet', currency: 'USD' }),
    );
    if (!result.ok) throw new Error('expected success');
    expect(result.data.id).toBe(ACCOUNT_ID);
    expect(result.data.isLiquid).toBe(false);
  });

  it('rejects a blank name', () => {
    const result = parseAccountForm(fdOf({ name: '  ', kind: 'wallet', currency: 'USD' }));
    expect(result.ok).toBe(false);
  });
});

describe('parseIncomeSourceForm', () => {
  it('parses a valid income source', () => {
    const result = parseIncomeSourceForm(fdOf({ name: 'E2E Retainer', kind: 'retainer' }));
    expect(result).toEqual({ ok: true, data: { name: 'E2E Retainer', kind: 'retainer' } });
  });

  it('rejects an unknown kind', () => {
    const result = parseIncomeSourceForm(fdOf({ name: 'E2E Retainer', kind: 'nope' }));
    expect(result.ok).toBe(false);
  });
});
