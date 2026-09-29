import {
  money,
  type AccountBalance,
  type FxRate,
  type IncomeSourceRef,
  type OutreachItem,
  type Payment,
  type TimeEntry,
} from '@dailyx/core';

import type {
  balanceSnapshots,
  fxRates,
  incomeSources,
  moneyAccounts,
  outreachItems,
  payments,
  timeEntries,
} from './schema';

type Row<T extends { $inferSelect: unknown }> = T['$inferSelect'];

/** The one row → `@dailyx/core` boundary (ADR 0004). */
export function toFxRate(r: Row<typeof fxRates>): FxRate {
  return { id: r.id, date: r.date, base: r.base, quote: r.quote, rateE6: r.rateE6 };
}

export function toPayment(r: Row<typeof payments>): Payment {
  return {
    id: r.id,
    incomeSourceId: r.incomeSourceId,
    date: r.date,
    amount: money(r.amount, r.currency),
    platformFee: money(r.platformFee, r.currency),
    taxReserved: r.taxReserved === null ? null : money(r.taxReserved, r.currency),
    certainty: r.certainty,
    isRecurring: r.isRecurring,
  };
}

export function toTimeEntry(r: Row<typeof timeEntries>): TimeEntry {
  return {
    id: r.id,
    date: r.date,
    hours: r.hours,
    incomeSourceId: r.incomeSourceId,
    channelId: r.channelId,
  };
}

export function toOutreachItem(r: Row<typeof outreachItems>): OutreachItem {
  return { id: r.id, channelId: r.channelId, sentOn: r.sentOn, stageDates: r.stageDates };
}

export function toIncomeSourceRef(r: Row<typeof incomeSources>): IncomeSourceRef {
  return { id: r.id, channelId: r.channelId };
}

export function toAccountBalance(
  s: Row<typeof balanceSnapshots>,
  a: Row<typeof moneyAccounts>,
): AccountBalance {
  if (s.accountId !== a.id) {
    throw new RangeError(`snapshot ${s.id} account ${s.accountId} does not match account ${a.id}`);
  }
  return {
    id: s.id,
    accountId: s.accountId,
    isLiquid: a.isLiquid,
    balance: money(s.amount, s.currency),
  };
}
