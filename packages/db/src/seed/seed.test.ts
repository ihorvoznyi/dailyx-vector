import { addDays, money, netWorth } from '@dailyx/core';
import { count, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { forUser } from '../access';
import { toAccountBalance, toFxRate } from '../map';
import { auditEvents, moneyAccounts, user } from '../schema';
import { createTestDb } from '../testing';
import { funnelItems, monthDay, seed } from './seed';

const TODAY = '2026-09-28';

describe('monthDay', () => {
  it('rolls the month, wrapping the year when needed', () => {
    expect(monthDay('2026-09-28', -3, 1)).toBe('2026-06-01');
    expect(monthDay('2026-09-28', 1, 15)).toBe('2026-10-15');
    expect(monthDay('2026-01-10', -1, 1)).toBe('2025-12-01');
  });
});

describe('funnelItems', () => {
  it('matches the hand-checked fixture', () => {
    expect(funnelItems([6, 4, 3, 2, 1], TODAY)).toEqual([
      {
        sentOn: '2026-07-01',
        stageDates: {
          attention: '2026-07-03',
          conversation: '2026-07-06',
          meeting: '2026-07-13',
          win: '2026-07-31',
        },
      },
      {
        sentOn: '2026-07-16',
        stageDates: { attention: '2026-07-18', conversation: '2026-07-21', meeting: '2026-07-28' },
      },
      {
        sentOn: '2026-07-31',
        stageDates: { attention: '2026-08-02', conversation: '2026-08-05' },
      },
      { sentOn: '2026-08-15', stageDates: { attention: '2026-08-17' } },
      { sentOn: '2026-08-30', stageDates: {} },
      { sentOn: '2026-09-14', stageDates: {} },
    ]);
  });
});

describe('seed', () => {
  it('creates the M1 dataset with hand-checked counts', async () => {
    const db = await createTestDb();
    const result = await seed(db, { email: ' Owner@X.com ', today: TODAY, appEnv: undefined });

    expect(result.skipped).toBe(false);
    if (result.skipped) throw new Error('unreachable');
    expect(result.userId).toBe('seed-owner');
    expect(result.counts).toEqual({
      moneyAccounts: 4,
      balanceSnapshots: 4,
      fxRates: 1,
      channelBets: 4,
      incomeSources: 5,
      payments: 17,
      timeEntries: 16,
      weeklyReviews: 4,
      outreachItems: 2886,
    });

    const [row] = await db.select().from(user).where(eq(user.id, 'seed-owner'));
    expect(row?.email).toBe('owner@x.com');

    const [auditRow] = await db
      .select({ n: count() })
      .from(auditEvents)
      .where(eq(auditEvents.userId, 'seed-owner'));
    expect(auditRow?.n).toBe(2942);
  }, 30_000);

  it('funnels each channel to the exact hand-checked stage counts', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');
    const channels = await data.channelBets.list();
    const outreach = await data.outreachItems.list();

    const expected: Record<string, readonly [number, number, number, number, number]> = {
      upwork: [180, 112, 41, 19, 6],
      email: [2400, 1050, 72, 14, 2],
      linkedin: [300, 96, 31, 6, 1],
      referrals: [6, 4, 3, 2, 1],
    };

    for (const channel of channels) {
      const items = outreach.filter((o) => o.channelId === channel.id);
      const counts: [number, number, number, number, number] = [
        items.length,
        items.filter((o) => o.stageDates.attention).length,
        items.filter((o) => o.stageDates.conversation).length,
        items.filter((o) => o.stageDates.meeting).length,
        items.filter((o) => o.stageDates.win).length,
      ];
      expect(counts).toEqual(expected[channel.preset]);
    }

    for (const item of outreach) {
      expect(item.sentOn >= '2026-07-01').toBe(true);
      expect(item.sentOn <= TODAY).toBe(true);
      const stages = ['attention', 'conversation', 'meeting', 'win'] as const;
      let previous = item.sentOn;
      let sawMissing = false;
      for (const stage of stages) {
        const date = item.stageDates[stage];
        if (date === undefined) {
          sawMissing = true;
          continue;
        }
        expect(sawMissing).toBe(false);
        expect(date >= previous).toBe(true);
        expect(date <= TODAY).toBe(true);
        previous = date;
      }
    }
  }, 30_000);

  it('writes the seed settings', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const settings = await forUser(db, 'seed-owner').settings.get();
    expect(settings.taxRateBps).toBe(500);
    expect(settings.monthlyCost).toBe(380_000);
    expect(settings.baselineRate).toBe(6500);
    expect(settings.timezone).toBe('Europe/Kyiv');
  }, 30_000);

  it('wires the seeded balances into core netWorth', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');
    const accounts = await data.moneyAccounts.list();
    const snapshots = await data.balanceSnapshots.list();
    const fxRows = await data.fxRates.list();
    const accountById = new Map(accounts.map((a) => [a.id, a]));

    const result = netWorth({
      balances: snapshots.map((s) => toAccountBalance(s, accountById.get(s.accountId)!)),
      positions: [],
      rates: fxRows.map((r) => toFxRate(r)),
      base: 'USD',
      on: TODAY,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.data.value).toEqual(money(4_821_809, 'USD'));
  }, 30_000);

  it('names the four accounts, Cash replaced by Payoneer', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const accounts = await forUser(db, 'seed-owner').moneyAccounts.list();
    expect(accounts.map((a) => a.name).sort()).toEqual(['IBKR', 'Monobank', 'PayPal', 'Payoneer']);
  }, 30_000);

  it("ages Payoneer's snapshot 10 days, and keeps the rest fresh", async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');
    const accounts = await data.moneyAccounts.list();
    const snapshots = await data.balanceSnapshots.list();
    const accountById = new Map(accounts.map((a) => [a.id, a]));

    for (const snapshot of snapshots) {
      const account = accountById.get(snapshot.accountId)!;
      expect(snapshot.asOf).toBe(account.name === 'Payoneer' ? addDays(TODAY, -10) : TODAY);
    }
  }, 30_000);

  it('sets awaitingReplySince on exactly three outreach items', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');
    const channels = await data.channelBets.list();
    const outreach = await data.outreachItems.list();
    const channelById = new Map(channels.map((c) => [c.id, c]));

    const waiting = outreach.filter((o) => o.awaitingReplySince !== null);
    expect(waiting).toHaveLength(3);
    const byPreset = waiting.map((o) => channelById.get(o.channelId)!.preset).sort();
    expect(byPreset).toEqual(['linkedin', 'upwork', 'upwork']);
  }, 30_000);

  it("gives Upwork's bet a sentPerWeek cap", async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const channels = await forUser(db, 'seed-owner').channelBets.list();
    const upwork = channels.find((c) => c.preset === 'upwork')!;
    expect(upwork.caps).toEqual({ sentPerWeek: 15 });
  }, 30_000);

  it('is idempotent for the same email', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const second = await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    expect(second).toEqual({ skipped: true, userId: 'seed-owner' });

    const [accountsRow] = await db.select({ n: count() }).from(moneyAccounts);
    expect(accountsRow?.n).toBe(4);
  }, 30_000);

  it('attaches to an existing user with the same email instead of creating one', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'google-123', name: 'Ihor', email: 'owner@x.com' });
    const result = await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    expect(result.userId).toBe('google-123');
  }, 30_000);

  it('refuses to seed outside dev, without touching the user table', async () => {
    const db = await createTestDb();
    await expect(
      seed(db, { email: 'owner@x.com', today: TODAY, appEnv: 'production' }),
    ).rejects.toThrow(/APP_ENV/);
    await expect(
      seed(db, { email: 'owner@x.com', today: TODAY, appEnv: 'preview' }),
    ).rejects.toThrow(/APP_ENV/);

    const [userRow] = await db.select({ n: count() }).from(user);
    expect(userRow?.n).toBe(0);
  });
});
