import { forUser, user } from '@dailyx/db';
import { createTestDb, seed } from '@dailyx/db/testing';
import { describe, expect, it } from 'vitest';

import { formatMoney, formatMonths } from '../lib/format';
import { latestSnapshots, loadMoney } from './money';

const TODAY = '2026-09-28';
const NOW = new Date('2026-09-28T12:00:00Z');

describe('loadMoney', () => {
  it('computes net worth, runway, freedom and accounts for the seed', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');

    const view = await loadMoney(data, NOW);

    expect(view.missingRate).toBeNull();

    expect(view.netWorth).not.toBeNull();
    expect(view.netWorth?.metric.value).toEqual({ amount: 4_821_809, currency: 'USD' });
    expect(formatMoney(view.netWorth!.metric.value)).toBe('$48,218.09');
    expect(view.netWorth?.stale).toBe(true);

    expect(view.runway).not.toBeNull();
    expect(view.runway?.metric.value).toBeCloseTo(4_821_809 / 380_000, 5);
    expect(formatMonths(view.runway!.metric.value)).toBe('12.7 mo');

    expect(view.freedom).not.toBeNull();
    expect(view.freedom?.ratio.numerator).toEqual({ amount: 267_900, currency: 'USD' });
    expect(view.freedom?.ratio.value).toBeCloseTo(267_900 / 380_000, 5);
    expect(view.freedom?.toFreedom.denominator).toEqual({ amount: 89_300, currency: 'USD' });
    expect(view.freedom?.toFreedom.numerator).toEqual({ amount: 112_100, currency: 'USD' });

    const names = view.accounts.map((a) => a.account.name);
    expect(names).toEqual(['IBKR', 'Monobank', 'PayPal', 'Payoneer']);

    const payoneer = view.accounts.find((a) => a.account.name === 'Payoneer')!;
    expect(payoneer.stale).toBe(true);
    expect(payoneer.sourceLine).toBe('Manual · updated 10 days ago');

    const monobank = view.accounts.find((a) => a.account.name === 'Monobank')!;
    expect(monobank.valueInBase).toEqual({ amount: 1_482_809, currency: 'USD' });

    expect(view.series).toEqual([
      { date: '2026-09-18', value: { amount: 170_000, currency: 'USD' } },
      { date: '2026-09-28', value: { amount: 4_821_809, currency: 'USD' } },
    ]);

    expect(view.hoursLastWeek).toBe(20);
  });

  it('lets a later same-day snapshot win by createdAt', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');

    const ibkr = (await data.moneyAccounts.list()).find((a) => a.name === 'IBKR')!;
    await data.balanceSnapshots.create({
      accountId: ibkr.id,
      asOf: TODAY,
      amount: 1,
      currency: 'USD',
    });

    const view = await loadMoney(data, NOW);

    expect(view.netWorth?.metric.value).toEqual({ amount: 2_176_810, currency: 'USD' });
  });

  it('reports a missing rate and nulls every metric', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'U', email: 'u@x.com', baseCurrency: 'USD' });
    const data = forUser(db, 'u1');
    const account = await data.moneyAccounts.create({
      kind: 'bank',
      name: 'Privat',
      currency: 'UAH',
      isLiquid: true,
    });
    await data.balanceSnapshots.create({
      accountId: account.id,
      asOf: TODAY,
      amount: 100_000,
      currency: 'UAH',
    });

    const view = await loadMoney(data, NOW);

    expect(view.missingRate?.kind).toBe('missing-fx-rate');
    expect(view.netWorth).toBeNull();
    expect(view.runway).toBeNull();
    expect(view.freedom).toBeNull();
  });
});

describe('latestSnapshots', () => {
  it('picks the max asOf, then the max createdAt on a tie', () => {
    const older = {
      id: 's1',
      accountId: 'a',
      asOf: '2026-09-20',
      amount: 100,
      currency: 'USD' as const,
      createdAt: new Date('2026-09-20T00:00:00Z'),
      updatedAt: new Date('2026-09-20T00:00:00Z'),
      userId: 'u',
    };
    const newerSameDay = {
      ...older,
      id: 's2',
      asOf: '2026-09-28',
      amount: 200,
      createdAt: new Date('2026-09-28T00:00:00Z'),
    };
    const laterButOlderCreated = {
      ...older,
      id: 's3',
      asOf: '2026-09-28',
      amount: 1,
      createdAt: new Date('2026-09-27T00:00:00Z'),
    };

    const rows = [older, laterButOlderCreated, newerSameDay];
    const result = latestSnapshots(rows, '2026-09-28');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('s2');
  });

  it('excludes snapshots after `on`', () => {
    const row = {
      id: 's1',
      accountId: 'a',
      asOf: '2026-09-29',
      amount: 100,
      currency: 'USD' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'u',
    };
    expect(latestSnapshots([row], '2026-09-28')).toEqual([]);
  });
});
