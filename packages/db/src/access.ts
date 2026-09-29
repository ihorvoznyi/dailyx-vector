import { and, eq } from 'drizzle-orm';

import type { Db } from './db';
import {
  auditEvents,
  balanceSnapshots,
  channelBets,
  fxRates,
  incomeSources,
  moneyAccounts,
  outreachItems,
  payments,
  timeEntries,
  user,
  weeklyReviews,
} from './schema';

type ScopedTable =
  | typeof balanceSnapshots
  | typeof channelBets
  | typeof fxRates
  | typeof incomeSources
  | typeof moneyAccounts
  | typeof outreachItems
  | typeof payments
  | typeof timeEntries
  | typeof weeklyReviews;

/** Columns the access layer owns; callers never pass them. */
type Managed = 'id' | 'userId' | 'createdAt' | 'updatedAt';

export type NewRow<T extends ScopedTable> = Omit<T['$inferInsert'], Managed>;
export type RowPatch<T extends ScopedTable> = Partial<NewRow<T>>;

/** Rows per INSERT statement in createMany; keeps every statement well under Postgres's 65,535 parameters. */
const CHUNK = 500;

function scoped<T extends ScopedTable>(db: Db, userId: string, table: T, entity: string) {
  type Row = T['$inferSelect'];
  const owned = (id: string) => and(eq(table.id, id), eq(table.userId, userId));

  return {
    /** Every row of this user's, unordered. */
    async list(): Promise<Row[]> {
      /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- required by tsc:
         `.from`/`.set`/`.values` reject `T` while it's a union type parameter (spec's "Verified by
         trial"); typescript-eslint's isolated per-expression check disagrees with program-wide tsc. */
      return (await db
        .select()
        .from(table as ScopedTable)
        .where(eq(table.userId, userId))) as Row[];
      /* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */
    },

    /** The row, or null when it doesn't exist or belongs to another user. */
    async get(id: string): Promise<Row | null> {
      /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- see list() above. */
      const [row] = (await db
        .select()
        .from(table as ScopedTable)
        .where(owned(id))) as Row[];
      /* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */
      return row ?? null;
    },

    create(values: NewRow<T>): Promise<Row> {
      return db.transaction(async (tx) => {
        const [row] = (await tx
          .insert(table)
          .values({ ...values, userId } as never)
          .returning()) as Row[];
        if (!row) throw new Error(`insert into ${entity} returned no row`);
        await tx
          .insert(auditEvents)
          .values({ userId, entity, entityId: row.id, change: { before: null, after: row } });
        return row;
      });
    },

    /** All or nothing: one transaction, one audit row per inserted row. */
    createMany(values: readonly NewRow<T>[]): Promise<Row[]> {
      return db.transaction(async (tx) => {
        const rows: Row[] = [];
        for (let i = 0; i < values.length; i += CHUNK) {
          const chunk = values.slice(i, i + CHUNK).map((v) => ({ ...v, userId }));
          const inserted = (await tx
            .insert(table)
            .values(chunk as never)
            .returning()) as Row[];
          await tx.insert(auditEvents).values(
            inserted.map((row) => ({
              userId,
              entity,
              entityId: row.id,
              change: { before: null, after: row },
            })),
          );
          rows.push(...inserted);
        }
        return rows;
      });
    },

    /** Null when the row doesn't exist or belongs to another user; nothing is written then. */
    update(id: string, patch: RowPatch<T>): Promise<Row | null> {
      return db.transaction(async (tx) => {
        /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- see list() above. */
        const [before] = (await tx
          .select()
          .from(table as ScopedTable)
          .where(owned(id))) as Row[];
        /* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */
        if (!before) return null;
        const [after] = (await tx
          .update(table)
          .set(patch as never)
          .where(owned(id))
          .returning()) as Row[];
        if (!after) throw new Error(`update of ${entity} ${id} returned no row`);
        await tx
          .insert(auditEvents)
          .values({ userId, entity, entityId: id, change: { before, after } });
        return after;
      });
    },
  };
}

const settingsColumns = {
  baseCurrency: user.baseCurrency,
  monthlyCost: user.monthlyCost,
  monthlyCostCurrency: user.monthlyCostCurrency,
  taxRateBps: user.taxRateBps,
  baselineRate: user.baselineRate,
  targetHours: user.targetHours,
  horizonMonths: user.horizonMonths,
  timezone: user.timezone,
};

/** The Settings columns of the user row (SPEC → Domain model). */
export type Settings = Pick<typeof user.$inferSelect, keyof typeof settingsColumns>;

function settings(db: Db, userId: string) {
  const select = (q: Db) => q.select(settingsColumns).from(user).where(eq(user.id, userId));
  return {
    async get(): Promise<Settings> {
      const [row] = await select(db);
      if (!row) throw new Error(`user ${userId} not found`);
      return row;
    },
    update(patch: Partial<Settings>): Promise<Settings> {
      return db.transaction(async (tx) => {
        const [before] = await select(tx);
        if (!before) throw new Error(`user ${userId} not found`);
        const [after] = await tx
          .update(user)
          .set(patch)
          .where(eq(user.id, userId))
          .returning(settingsColumns);
        if (!after) throw new Error(`update of user ${userId} returned no row`);
        await tx
          .insert(auditEvents)
          .values({ userId, entity: 'user', entityId: userId, change: { before, after } });
        return after;
      });
    },
  };
}

/**
 * The only query path into user data (D1, ADR 0001/0004). Every read is filtered by `userId`;
 * every write stamps `userId` and records an `audit_events` row in the same transaction.
 */
export function forUser(db: Db, userId: string) {
  return {
    settings: settings(db, userId),
    moneyAccounts: scoped(db, userId, moneyAccounts, 'money_accounts'),
    balanceSnapshots: scoped(db, userId, balanceSnapshots, 'balance_snapshots'),
    fxRates: scoped(db, userId, fxRates, 'fx_rates'),
    incomeSources: scoped(db, userId, incomeSources, 'income_sources'),
    payments: scoped(db, userId, payments, 'payments'),
    timeEntries: scoped(db, userId, timeEntries, 'time_entries'),
    weeklyReviews: scoped(db, userId, weeklyReviews, 'weekly_reviews'),
    channelBets: scoped(db, userId, channelBets, 'channel_bets'),
    outreachItems: scoped(db, userId, outreachItems, 'outreach_items'),
  };
}

export type UserData = ReturnType<typeof forUser>;
