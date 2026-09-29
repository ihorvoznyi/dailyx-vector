import { describe, expect, it } from 'vitest';

import { createTestDb } from './testing';
import { balanceSnapshots, channelBets, moneyAccounts, timeEntries, user } from './schema';

describe('createDb + migrations (PGlite)', () => {
  it('defaults the user row', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'A', email: 'a@x.com' });
    const [row] = await db.select().from(user);
    expect(row?.taxRateBps).toBe(500);
    expect(row?.baseCurrency).toBe('USD');
    expect(row?.horizonMonths).toBe(12);
    expect(row?.timezone).toBe('UTC');
    expect(row?.monthlyCost).toBe(0);
  });

  it('defaults a money account row', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'A', email: 'a@x.com' });
    const [row] = await db
      .insert(moneyAccounts)
      .values({ userId: 'u1', kind: 'bank', name: 'Mono', currency: 'UAH' })
      .returning();
    expect(row?.isLiquid).toBe(true);
    expect(row?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row?.createdAt).toBeInstanceOf(Date);
  });

  it('round-trips a safe-integer bigint and a date string', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'A', email: 'a@x.com' });
    const [account] = await db
      .insert(moneyAccounts)
      .values({ userId: 'u1', kind: 'bank', name: 'Mono', currency: 'UAH' })
      .returning();
    const [row] = await db
      .insert(balanceSnapshots)
      .values({
        userId: 'u1',
        accountId: account!.id,
        asOf: '2026-09-01',
        amount: 9_007_199_254_740_991,
        currency: 'UAH',
      })
      .returning();
    expect(row?.amount).toBe(9_007_199_254_740_991);
    expect(typeof row?.amount).toBe('number');
    expect(row?.asOf).toBe('2026-09-01');
  });

  it('defaults channel_bets maturityDays and caps', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'A', email: 'a@x.com' });
    const [row] = await db
      .insert(channelBets)
      .values({
        userId: 'u1',
        preset: 'upwork',
        name: 'Upwork',
        startedOn: '2026-08-01',
        hoursPerWeek: 7.5,
      })
      .returning();
    expect(row?.hoursPerWeek).toBe(7.5);
    expect(row?.maturityDays).toEqual({ attention: 7, conversation: 7, meeting: 21, win: 45 });
    expect(row?.caps).toEqual({});
  });

  it('rejects a time_entries row with neither target', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'A', email: 'a@x.com' });
    await expect(
      db.insert(timeEntries).values({ userId: 'u1', date: '2026-09-01', hours: 1 }),
    ).rejects.toThrow();
  });

  it('rejects a cross-user composite FK', async () => {
    const db = await createTestDb();
    await db.insert(user).values([
      { id: 'u1', name: 'A', email: 'a@x.com' },
      { id: 'u2', name: 'B', email: 'b@x.com' },
    ]);
    const [account] = await db
      .insert(moneyAccounts)
      .values({ userId: 'u1', kind: 'bank', name: 'Mono', currency: 'UAH' })
      .returning();
    await expect(
      db.insert(balanceSnapshots).values({
        userId: 'u2',
        accountId: account!.id,
        asOf: '2026-09-01',
        amount: 100,
        currency: 'UAH',
      }),
    ).rejects.toThrow();
  });
});
