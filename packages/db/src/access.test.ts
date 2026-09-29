import { count, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { forUser } from './access';
import type { Db } from './db';
import { auditEvents, user } from './schema';
import { createTestDb } from './testing';

/** Repo name → how to create A's one row (parents first) and a patch to prove writes stamp `userId`. */
interface TableEntry {
  readonly name: string;
  readonly create: (ids: Record<string, string>) => Record<string, unknown>;
  readonly patch: Record<string, unknown>;
}

const ENTRIES: readonly TableEntry[] = [
  {
    name: 'moneyAccounts',
    create: () => ({ kind: 'bank', name: 'Mono', currency: 'UAH' }),
    patch: { name: 'Monobank' },
  },
  {
    name: 'channelBets',
    create: () => ({ preset: 'upwork', name: 'Upwork', startedOn: '2026-08-01' }),
    patch: { name: 'Upwork v2' },
  },
  {
    name: 'incomeSources',
    create: (ids) => ({ name: 'Acme', kind: 'project', channelId: ids.channelBets }),
    patch: { name: 'Acme Inc' },
  },
  {
    name: 'balanceSnapshots',
    create: (ids) => ({
      accountId: ids.moneyAccounts,
      asOf: '2026-09-01',
      amount: 100000,
      currency: 'UAH',
    }),
    patch: { amount: 200000 },
  },
  {
    name: 'payments',
    create: (ids) => ({
      incomeSourceId: ids.incomeSources,
      date: '2026-09-08',
      amount: 150000,
      currency: 'USD',
      certainty: 'received',
    }),
    patch: { amount: 160000 },
  },
  {
    name: 'timeEntries',
    create: (ids) => ({
      date: '2026-09-08',
      hours: 2,
      channelId: ids.channelBets,
      incomeSourceId: null,
    }),
    patch: { hours: 3 },
  },
  {
    name: 'weeklyReviews',
    create: () => ({ weekStart: '2026-09-07' }),
    patch: { completedAt: new Date('2026-09-10') },
  },
  {
    name: 'fxRates',
    create: () => ({ date: '2026-09-28', base: 'USD', quote: 'UAH', rateE6: 41300000 }),
    patch: { rateE6: 41500000 },
  },
  {
    name: 'outreachItems',
    create: (ids) => ({ channelId: ids.channelBets, sentOn: '2026-07-01' }),
    patch: { contactName: 'Jane' },
  },
];

/** Type-erased repo accessor: every scoped repo shares this create/list/get/update shape. */
interface AnyRepo {
  list(): Promise<Record<string, unknown>[]>;
  get(id: string): Promise<Record<string, unknown> | null>;
  create(values: Record<string, unknown>): Promise<Record<string, unknown> & { id: string }>;
  update(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown> | null>;
}

function repo(db: Db, userId: string, name: string): AnyRepo {
  return (forUser(db, userId) as unknown as Record<string, AnyRepo>)[name]!;
}

async function auditCount(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(auditEvents)
    .where(eq(auditEvents.userId, userId));
  return row?.n ?? 0;
}

describe('forUser', () => {
  let db: Db;
  const ids: Record<string, string> = {};
  const aRows: Record<string, { id: string }> = {};

  beforeAll(async () => {
    db = await createTestDb();
    await db.insert(user).values([
      { id: 'ua', name: 'A', email: 'a@x.com' },
      { id: 'ub', name: 'B', email: 'b@x.com' },
    ]);
    for (const entry of ENTRIES) {
      const row = await repo(db, 'ua', entry.name).create(entry.create(ids));
      aRows[entry.name] = row;
      ids[entry.name] = row.id;
    }
  });

  it('covers every non-settings repo (a tenth repo cannot be forgotten silently)', () => {
    const keys = Object.keys(forUser(db, 'x'))
      .filter((k) => k !== 'settings')
      .sort();
    expect(ENTRIES.map((e) => e.name).sort()).toEqual(keys);
  });

  it.each(ENTRIES.map((e) => [e.name, e] as const))(
    '%s: isolates user A from user B',
    async (_name, entry) => {
      const aRow = aRows[entry.name]!;
      expect(await repo(db, 'ub', entry.name).list()).toEqual([]);
      expect(await repo(db, 'ub', entry.name).get(aRow.id)).toBeNull();

      const updateResult = await repo(db, 'ub', entry.name).update(aRow.id, entry.patch);
      expect(updateResult).toBeNull();
      expect(await repo(db, 'ua', entry.name).get(aRow.id)).toEqual(aRow);

      expect(await repo(db, 'ua', entry.name).list()).toEqual([aRow]);
    },
  );

  it('rejects cross-user references and rolls back the audit row', async () => {
    const before = await auditCount(db, 'ub');

    await expect(
      forUser(db, 'ub').balanceSnapshots.create({
        accountId: ids.moneyAccounts!,
        asOf: '2026-09-02',
        amount: 1,
        currency: 'UAH',
      }),
    ).rejects.toThrow();
    expect(await auditCount(db, 'ub')).toBe(before);

    await expect(
      forUser(db, 'ub').payments.create({
        incomeSourceId: ids.incomeSources!,
        date: '2026-09-09',
        amount: 1,
        currency: 'USD',
        certainty: 'received',
      }),
    ).rejects.toThrow();
    expect(await auditCount(db, 'ub')).toBe(before);

    await expect(
      forUser(db, 'ub').outreachItems.create({ channelId: ids.channelBets!, sentOn: '2026-07-02' }),
    ).rejects.toThrow();
    expect(await auditCount(db, 'ub')).toBe(before);

    await expect(
      forUser(db, 'ub').timeEntries.create({
        date: '2026-09-09',
        hours: 1,
        channelId: ids.channelBets!,
      }),
    ).rejects.toThrow();
    expect(await auditCount(db, 'ub')).toBe(before);
  });

  it("records exactly 9 audit rows for A's creates", async () => {
    const entityIds = new Set(Object.values(aRows).map((row) => row.id));
    const rows = await db.select().from(auditEvents).where(eq(auditEvents.userId, 'ua'));
    expect(rows).toHaveLength(9);
    for (const row of rows) {
      expect(entityIds.has(row.entityId)).toBe(true);
      expect(row.actor).toBe('user');
      expect(row.change.before).toBeNull();
      expect((row.change.after as { id: string }).id).toBe(row.entityId);
    }
  });

  it('records the 10th audit row on a successful update, with before/after values', async () => {
    const updated = await forUser(db, 'ua').moneyAccounts.update(ids.moneyAccounts!, {
      name: 'Monobank',
    });
    expect(updated?.name).toBe('Monobank');

    const all = await db.select().from(auditEvents).where(eq(auditEvents.userId, 'ua'));
    expect(all).toHaveLength(10);
    const forAccount = all.filter((row) => row.entityId === ids.moneyAccounts);
    expect(forAccount).toHaveLength(2);
    const updateRow = forAccount.find(
      (row) => (row.change.after as { name: string }).name === 'Monobank',
    );
    expect((updateRow?.change.before as { name: string }).name).toBe('Mono');
    expect((updateRow?.change.after as { name: string }).name).toBe('Monobank');
  });
});
