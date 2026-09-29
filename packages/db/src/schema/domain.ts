import {
  DEFAULT_MATURITY_DAYS,
  type Certainty,
  type CurrencyCode,
  type IsoDate,
  type MaturityDays,
  type TimedStage,
} from '@dailyx/core';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  date,
  foreignKey,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';

/** id, user_id, created_at, updated_at — on every domain table. */
const base = () => ({
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
const currency = (name: string) => char(name, { length: 3 }).$type<CurrencyCode>();
const minor = (name: string) => bigint(name, { mode: 'number' });
const day = (name: string) => date(name, { mode: 'string' }).$type<IsoDate>();
const hours = (name: string) => numeric(name, { precision: 6, scale: 2, mode: 'number' });

/** Every currency Vector handles (ADR 0003). */
export const CURRENCIES = ['USD', 'UAH', 'EUR'] as const satisfies readonly CurrencyCode[];

export type MoneyAccountKind = 'bank' | 'broker' | 'wallet' | 'cash';
export type IncomeSourceKind = 'project' | 'retainer' | 'hourly' | 'product' | 'lead';
export type IncomeSourceStatus = 'active' | 'paused' | 'ended';
export type ChannelPresetId =
  'upwork' | 'email' | 'linkedin' | 'content' | 'referrals' | 'marketplace';
export type FxSource = 'manual' | 'nbu';
export type AuditActor = 'sync' | 'user' | 'rule';

export const channelBets = pgTable(
  'channel_bets',
  {
    ...base(),
    preset: text('preset').$type<ChannelPresetId>().notNull(),
    name: text('name').notNull(),
    hoursPerWeek: hours('hours_per_week').notNull().default(0),
    maxHours: hours('max_hours'),
    startedOn: day('started_on').notNull(),
    caps: jsonb('caps').$type<Record<string, number>>().notNull().default({}),
    maturityDays: jsonb('maturity_days')
      .$type<MaturityDays>()
      .notNull()
      .default(DEFAULT_MATURITY_DAYS),
    cashCostMonthly: minor('cash_cost_monthly').notNull().default(0),
    cashCostCurrency: currency('cash_cost_currency').notNull().default('USD'),
  },
  (t) => [unique('channel_bets_id_user').on(t.id, t.userId)],
);

export const moneyAccounts = pgTable(
  'money_accounts',
  {
    ...base(),
    kind: text('kind').$type<MoneyAccountKind>().notNull(),
    name: text('name').notNull(),
    currency: currency('currency').notNull(),
    isLiquid: boolean('is_liquid').notNull().default(true),
  },
  (t) => [unique('money_accounts_id_user').on(t.id, t.userId)],
);

export const balanceSnapshots = pgTable(
  'balance_snapshots',
  {
    ...base(),
    accountId: uuid('account_id').notNull(),
    asOf: day('as_of').notNull(),
    amount: minor('amount').notNull(),
    currency: currency('currency').notNull(),
  },
  (t) => [
    foreignKey({
      name: 'balance_snapshots_account_fk',
      columns: [t.accountId, t.userId],
      foreignColumns: [moneyAccounts.id, moneyAccounts.userId],
    }).onDelete('cascade'),
  ],
);

export const fxRates = pgTable('fx_rates', {
  ...base(),
  date: day('date').notNull(),
  base: currency('base').notNull(),
  quote: currency('quote').notNull(),
  rateE6: bigint('rate_e6', { mode: 'number' }).notNull(),
  source: text('source').$type<FxSource>().notNull().default('manual'),
});

export const incomeSources = pgTable(
  'income_sources',
  {
    ...base(),
    name: text('name').notNull(),
    kind: text('kind').$type<IncomeSourceKind>().notNull(),
    status: text('status').$type<IncomeSourceStatus>().notNull().default('active'),
    channelId: uuid('channel_id'),
    platform: text('platform'),
  },
  (t) => [
    unique('income_sources_id_user').on(t.id, t.userId),
    foreignKey({
      name: 'income_sources_channel_fk',
      columns: [t.channelId, t.userId],
      foreignColumns: [channelBets.id, channelBets.userId],
    }),
  ],
);

export const payments = pgTable(
  'payments',
  {
    ...base(),
    incomeSourceId: uuid('income_source_id').notNull(),
    date: day('date').notNull(),
    amount: minor('amount').notNull(),
    currency: currency('currency').notNull(),
    platformFee: minor('platform_fee').notNull().default(0),
    taxReserved: minor('tax_reserved'),
    certainty: text('certainty').$type<Certainty>().notNull(),
    probability: numeric('probability', { precision: 3, scale: 2, mode: 'number' }),
    isRecurring: boolean('is_recurring').notNull().default(false),
  },
  (t) => [
    foreignKey({
      name: 'payments_income_source_fk',
      columns: [t.incomeSourceId, t.userId],
      foreignColumns: [incomeSources.id, incomeSources.userId],
    }).onDelete('cascade'),
  ],
);

export const timeEntries = pgTable(
  'time_entries',
  {
    ...base(),
    date: day('date').notNull(),
    hours: hours('hours').notNull(),
    incomeSourceId: uuid('income_source_id'),
    channelId: uuid('channel_id'),
    note: text('note'),
  },
  (t) => [
    foreignKey({
      name: 'time_entries_income_source_fk',
      columns: [t.incomeSourceId, t.userId],
      foreignColumns: [incomeSources.id, incomeSources.userId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'time_entries_channel_fk',
      columns: [t.channelId, t.userId],
      foreignColumns: [channelBets.id, channelBets.userId],
    }).onDelete('cascade'),
    check(
      'time_entries_one_target',
      sql`(${t.incomeSourceId} is null) <> (${t.channelId} is null)`,
    ),
  ],
);

export const weeklyReviews = pgTable(
  'weekly_reviews',
  {
    ...base(),
    weekStart: day('week_start').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [unique('weekly_reviews_user_week').on(t.userId, t.weekStart)],
);

export const outreachItems = pgTable(
  'outreach_items',
  {
    ...base(),
    channelId: uuid('channel_id').notNull(),
    externalId: text('external_id'),
    contactName: text('contact_name'),
    company: text('company'),
    url: text('url'),
    sentOn: day('sent_on').notNull(),
    stageDates: jsonb('stage_dates')
      .$type<Partial<Record<TimedStage, IsoDate>>>()
      .notNull()
      .default({}),
    awaitingReplySince: timestamp('awaiting_reply_since', { withTimezone: true }),
    variant: text('variant'),
    hypothesisId: uuid('hypothesis_id'),
    valueEstimate: minor('value_estimate'),
    valueCurrency: currency('value_currency'),
    incomeSourceId: uuid('income_source_id'),
  },
  (t) => [
    foreignKey({
      name: 'outreach_items_channel_fk',
      columns: [t.channelId, t.userId],
      foreignColumns: [channelBets.id, channelBets.userId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'outreach_items_income_source_fk',
      columns: [t.incomeSourceId, t.userId],
      foreignColumns: [incomeSources.id, incomeSources.userId],
    }),
  ],
);

export const auditEvents = pgTable('audit_events', {
  ...base(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  actor: text('actor').$type<AuditActor>().notNull().default('user'),
  change: jsonb('change').$type<{ before: unknown; after: unknown }>().notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});
