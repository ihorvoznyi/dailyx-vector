import { netIncome } from '@dailyx/core';
import { describe, expect, it } from 'vitest';

import { toAccountBalance, toFxRate, toOutreachItem, toPayment } from './map';
import type { balanceSnapshots, fxRates, moneyAccounts, outreachItems, payments } from './schema';

type PaymentRow = typeof payments.$inferSelect;
type FxRow = typeof fxRates.$inferSelect;
type OutreachRow = typeof outreachItems.$inferSelect;
type SnapshotRow = typeof balanceSnapshots.$inferSelect;
type AccountRow = typeof moneyAccounts.$inferSelect;

const paymentRow: PaymentRow = {
  id: 'p1',
  userId: 'u1',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  incomeSourceId: 's1',
  date: '2026-09-08',
  amount: 150000,
  currency: 'USD',
  platformFee: 15000,
  taxReserved: null,
  certainty: 'received',
  probability: null,
  isRecurring: false,
};

const fxRow: FxRow = {
  id: 'f1',
  userId: 'u1',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  date: '2026-09-28',
  base: 'USD',
  quote: 'UAH',
  rateE6: 41_300_000,
  source: 'manual',
};

const outreachRow: OutreachRow = {
  id: 'o1',
  userId: 'u1',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  channelId: 'c1',
  externalId: null,
  contactName: null,
  company: null,
  url: null,
  sentOn: '2026-07-01',
  stageDates: { attention: '2026-07-03' },
  awaitingReplySince: null,
  variant: null,
  hypothesisId: null,
  valueEstimate: null,
  valueCurrency: null,
  incomeSourceId: null,
};

const snapshotRow: SnapshotRow = {
  id: 'b1',
  userId: 'u1',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  accountId: 'a1',
  asOf: '2026-09-01',
  amount: 61_240_000,
  currency: 'UAH',
};

const accountRow: AccountRow = {
  id: 'a1',
  userId: 'u1',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  kind: 'bank',
  name: 'Mono',
  currency: 'UAH',
  isLiquid: true,
};

describe('map', () => {
  it('maps a payment row', () => {
    expect(toPayment(paymentRow)).toEqual({
      id: 'p1',
      incomeSourceId: 's1',
      date: '2026-09-08',
      amount: { amount: 150000, currency: 'USD' },
      platformFee: { amount: 15000, currency: 'USD' },
      taxReserved: null,
      certainty: 'received',
      isRecurring: false,
    });
  });

  it('maps a payment row with a recorded tax reserve', () => {
    expect(toPayment({ ...paymentRow, taxReserved: 7500 })).toEqual({
      id: 'p1',
      incomeSourceId: 's1',
      date: '2026-09-08',
      amount: { amount: 150000, currency: 'USD' },
      platformFee: { amount: 15000, currency: 'USD' },
      taxReserved: { amount: 7500, currency: 'USD' },
      certainty: 'received',
      isRecurring: false,
    });
  });

  it('maps an fx rate row', () => {
    expect(toFxRate(fxRow)).toEqual({
      id: 'f1',
      date: '2026-09-28',
      base: 'USD',
      quote: 'UAH',
      rateE6: 41300000,
    });
  });

  it('maps an outreach item row', () => {
    expect(toOutreachItem(outreachRow)).toEqual({
      id: 'o1',
      channelId: 'c1',
      sentOn: '2026-07-01',
      stageDates: { attention: '2026-07-03' },
    });
  });

  it('maps a balance snapshot + account to an AccountBalance', () => {
    expect(toAccountBalance(snapshotRow, accountRow)).toEqual({
      id: 'b1',
      accountId: 'a1',
      isLiquid: true,
      balance: { amount: 61240000, currency: 'UAH' },
    });
  });

  it('throws when the snapshot and account ids do not match', () => {
    expect(() => toAccountBalance(snapshotRow, { ...accountRow, id: 'a2' })).toThrow(RangeError);
  });

  it('throws when a payment amount is not a safe integer', () => {
    expect(() => toPayment({ ...paymentRow, amount: 2 ** 53 })).toThrow(RangeError);
  });

  it('wires into core netIncome', () => {
    expect(netIncome(toPayment(paymentRow), 500)).toEqual({ amount: 127500, currency: 'USD' });
  });
});
