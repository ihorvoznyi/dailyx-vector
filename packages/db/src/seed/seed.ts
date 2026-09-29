import { addDays, weekStart, type Certainty, type IsoDate, type TimedStage } from '@dailyx/core';

import { forUser } from '../access';
import type { Db } from '../db';
import { user } from '../schema';

export interface SeedOptions {
  /** The seed user's email (ALLOWED_EMAIL). */
  email: string;
  /** Anchor for every relative date. */
  today: IsoDate;
  appEnv: string | undefined;
}

export type SeedResult =
  | { skipped: true; userId: string }
  | { skipped: false; userId: string; counts: Record<string, number> };

/** Days after `sentOn` each timed stage lands, when it's reached (Vector preview funnel shape). */
const STAGE_OFFSETS: readonly [TimedStage, number][] = [
  ['attention', 2],
  ['conversation', 5],
  ['meeting', 12],
  ['win', 30],
];

/**
 * `counts` = reach, attention, conversation, meeting, win — one funnel row. Spreads `counts[0]`
 * outreach items evenly over the 90 days ending `today`, and gives each item every stage its
 * index still qualifies for.
 */
export function funnelItems(
  counts: readonly [number, number, number, number, number],
  today: IsoDate,
): { sentOn: IsoDate; stageDates: Partial<Record<TimedStage, IsoDate>> }[] {
  const [reach] = counts;
  const items: { sentOn: IsoDate; stageDates: Partial<Record<TimedStage, IsoDate>> }[] = [];
  for (let i = 0; i < reach; i += 1) {
    const sentOn = addDays(today, -89 + Math.floor((i * 90) / reach));
    const stageDates: Partial<Record<TimedStage, IsoDate>> = {};
    STAGE_OFFSETS.forEach(([stage, offset], stageIndex) => {
      if (i < counts[stageIndex + 1]!) stageDates[stage] = addDays(sentOn, offset);
    });
    items.push({ sentOn, stageDates });
  }
  return items;
}

/** The UTC date with day `day` in the month `monthsOffset` months after `today`'s month. */
export function monthDay(today: IsoDate, monthsOffset: number, day: number): IsoDate {
  const [y, m] = today.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1 + monthsOffset, day)).toISOString().slice(0, 10);
}

interface ChannelSpec {
  readonly preset: 'upwork' | 'email' | 'linkedin' | 'referrals';
  readonly name: string;
  readonly hoursPerWeek: number;
  readonly maxHours: number | null;
  readonly cashCostMonthly: number;
  readonly funnel: readonly [number, number, number, number, number];
  readonly sentPerWeek: number;
}

const CHANNELS: readonly ChannelSpec[] = [
  {
    preset: 'upwork',
    name: 'Upwork',
    hoursPerWeek: 8,
    maxHours: 15,
    cashCostMonthly: 10333,
    funnel: [180, 112, 41, 19, 6],
    sentPerWeek: 15,
  },
  {
    preset: 'email',
    name: 'Cold email',
    hoursPerWeek: 5,
    maxHours: null,
    cashCostMonthly: 9667,
    funnel: [2400, 1050, 72, 14, 2],
    sentPerWeek: 200,
  },
  {
    preset: 'linkedin',
    name: 'LinkedIn',
    hoursPerWeek: 6,
    maxHours: null,
    cashCostMonthly: 10000,
    funnel: [300, 96, 31, 6, 1],
    sentPerWeek: 25,
  },
  {
    preset: 'referrals',
    name: 'Referrals',
    hoursPerWeek: 1,
    maxHours: 2,
    cashCostMonthly: 0,
    funnel: [6, 4, 3, 2, 1],
    sentPerWeek: 1,
  },
];

interface IncomeSourceSpec {
  readonly name: string;
  readonly kind: 'project' | 'retainer' | 'hourly' | 'product' | 'lead';
  readonly channelPreset: ChannelSpec['preset'] | null;
  readonly platform: string | null;
}

const INCOME_SOURCES: readonly IncomeSourceSpec[] = [
  { name: 'Northwind Pay', kind: 'project', channelPreset: 'upwork', platform: 'Upwork' },
  { name: 'Lumen Health', kind: 'retainer', channelPreset: 'referrals', platform: null },
  { name: 'Kite Analytics', kind: 'hourly', channelPreset: 'email', platform: null },
  { name: 'Workflow Kit', kind: 'product', channelPreset: null, platform: 'Gumroad' },
  { name: 'Orbit Labs', kind: 'lead', channelPreset: null, platform: null },
];

interface PaymentSpec {
  readonly incomeSourceName: string;
  readonly certainty: Certainty;
  readonly amount: number;
  readonly platformFee?: number;
  readonly probability?: number;
  readonly isRecurring?: boolean;
  readonly date: IsoDate;
}

function paymentSpecs(today: IsoDate): readonly PaymentSpec[] {
  return [
    {
      incomeSourceName: 'Northwind Pay',
      certainty: 'received',
      amount: 150_000,
      platformFee: 15_000,
      date: addDays(today, -20),
    },
    {
      incomeSourceName: 'Northwind Pay',
      certainty: 'secured',
      amount: 350_000,
      date: addDays(today, 11),
    },
    {
      incomeSourceName: 'Northwind Pay',
      certainty: 'committed',
      amount: 400_000,
      date: addDays(today, 45),
    },
    ...[-3, -2, -1, 0].map((m) => ({
      incomeSourceName: 'Lumen Health',
      certainty: 'received' as const,
      amount: 240_000,
      isRecurring: true,
      date: monthDay(today, m, 1),
    })),
    {
      incomeSourceName: 'Lumen Health',
      certainty: 'secured',
      amount: 240_000,
      isRecurring: true,
      date: monthDay(today, 1, 1),
    },
    {
      incomeSourceName: 'Kite Analytics',
      certainty: 'received',
      amount: 260_000,
      date: addDays(today, -25),
    },
    {
      incomeSourceName: 'Kite Analytics',
      certainty: 'secured',
      amount: 130_000,
      date: addDays(today, 5),
    },
    {
      incomeSourceName: 'Kite Analytics',
      certainty: 'committed',
      amount: 260_000,
      date: addDays(today, 35),
    },
    ...[-3, -2, -1, 0].map((m) => ({
      incomeSourceName: 'Workflow Kit',
      certainty: 'received' as const,
      amount: 42_000,
      isRecurring: true,
      date: monthDay(today, m, 15),
    })),
    {
      incomeSourceName: 'Workflow Kit',
      certainty: 'secured',
      amount: 42_000,
      isRecurring: true,
      date: monthDay(today, 1, 15),
    },
    {
      incomeSourceName: 'Orbit Labs',
      certainty: 'pipeline',
      amount: 600_000,
      probability: 0.3,
      date: addDays(today, 30),
    },
  ];
}

/** Seeds one M1 dataset from the Vector previews for `opts.email`, refusing outside dev (D-stage 9). */
export async function seed(db: Db, opts: SeedOptions): Promise<SeedResult> {
  if (opts.appEnv) throw new Error(`Refusing to seed with APP_ENV=${opts.appEnv}`);

  const email = opts.email.trim().toLowerCase();
  const today = opts.today;

  // The only write outside `forUser`: Better Auth's `user` table has no user-scoped access layer.
  const existing = await db.query.user.findFirst({
    where: (t, { eq: whereEq }) => whereEq(t.email, email),
  });
  const userId =
    existing?.id ??
    (
      await db
        .insert(user)
        .values({ id: 'seed-owner', name: 'Owner', email, emailVerified: true })
        .returning({ id: user.id })
    )[0]!.id;

  const data = forUser(db, userId);
  if ((await data.channelBets.list()).length > 0) return { skipped: true, userId };

  await data.settings.update({
    baseCurrency: 'USD',
    monthlyCost: 380_000,
    monthlyCostCurrency: 'USD',
    taxRateBps: 500,
    baselineRate: 6500,
    targetHours: 40,
    horizonMonths: 12,
    timezone: 'Europe/Kyiv',
  });

  const counts: Record<string, number> = {};

  const accountSpecs = [
    {
      kind: 'broker' as const,
      name: 'IBKR',
      currency: 'USD' as const,
      balance: 2_645_000,
      ageDays: 0,
    },
    {
      kind: 'bank' as const,
      name: 'Monobank',
      currency: 'UAH' as const,
      balance: 61_240_000,
      ageDays: 0,
    },
    {
      kind: 'wallet' as const,
      name: 'PayPal',
      currency: 'USD' as const,
      balance: 524_000,
      ageDays: 0,
    },
    {
      kind: 'wallet' as const,
      name: 'Payoneer',
      currency: 'USD' as const,
      balance: 170_000,
      ageDays: 10,
    },
  ];
  const accounts = await data.moneyAccounts.createMany(
    accountSpecs.map((a) => ({ kind: a.kind, name: a.name, currency: a.currency, isLiquid: true })),
  );
  counts.moneyAccounts = accounts.length;

  const snapshots = await data.balanceSnapshots.createMany(
    accounts.map((account, i) => ({
      accountId: account.id,
      asOf: addDays(today, -accountSpecs[i]!.ageDays),
      amount: accountSpecs[i]!.balance,
      currency: accountSpecs[i]!.currency,
    })),
  );
  counts.balanceSnapshots = snapshots.length;

  const fxRateRows = await data.fxRates.createMany([
    { date: today, base: 'USD', quote: 'UAH', rateE6: 41_300_000, source: 'manual' },
  ]);
  counts.fxRates = fxRateRows.length;

  const channels = await data.channelBets.createMany(
    CHANNELS.map((c) => ({
      preset: c.preset,
      name: c.name,
      hoursPerWeek: c.hoursPerWeek,
      maxHours: c.maxHours,
      startedOn: addDays(today, -120),
      cashCostMonthly: c.cashCostMonthly,
      caps: { sentPerWeek: c.sentPerWeek },
    })),
  );
  counts.channelBets = channels.length;
  const channelIdByPreset = new Map(CHANNELS.map((c, i) => [c.preset, channels[i]!.id]));

  /** Preset + 0-based item index → how many days ago it started awaiting a reply. */
  const AWAITING_REPLY: readonly [ChannelSpec['preset'], number, number][] = [
    ['upwork', 100, 2],
    ['upwork', 101, 2],
    ['linkedin', 90, 3],
  ];
  const awaitingReplyDaysAgo = new Map(
    AWAITING_REPLY.map(([preset, index, daysAgo]) => [`${preset}-${index}`, daysAgo]),
  );

  const outreachRows = CHANNELS.flatMap((c) =>
    funnelItems(c.funnel, today).map((item, i) => {
      const daysAgo = awaitingReplyDaysAgo.get(`${c.preset}-${i}`);
      return {
        channelId: channelIdByPreset.get(c.preset)!,
        sentOn: item.sentOn,
        stageDates: item.stageDates,
        externalId: `seed-${c.preset}-${i + 1}`,
        ...(daysAgo === undefined
          ? {}
          : { awaitingReplySince: new Date(`${addDays(today, -daysAgo)}T09:00:00.000Z`) }),
      };
    }),
  );
  const outreach = await data.outreachItems.createMany(outreachRows);
  counts.outreachItems = outreach.length;

  const incomeSources = await data.incomeSources.createMany(
    INCOME_SOURCES.map((s) => ({
      name: s.name,
      kind: s.kind,
      channelId: s.channelPreset ? (channelIdByPreset.get(s.channelPreset) ?? null) : null,
      platform: s.platform,
    })),
  );
  counts.incomeSources = incomeSources.length;
  const incomeSourceIdByName = new Map(
    INCOME_SOURCES.map((s, i) => [s.name, incomeSources[i]!.id]),
  );

  const payments = await data.payments.createMany(
    paymentSpecs(today).map((p) => ({
      incomeSourceId: incomeSourceIdByName.get(p.incomeSourceName)!,
      date: p.date,
      amount: p.amount,
      currency: 'USD',
      platformFee: p.platformFee ?? 0,
      certainty: p.certainty,
      probability: p.probability ?? null,
      isRecurring: p.isRecurring ?? false,
    })),
  );
  counts.payments = payments.length;

  const weeks = [-28, -21, -14, -7].map((offset) => addDays(weekStart(today), offset));

  const timeEntryRows = weeks.flatMap((week) =>
    channels.map((channel, i) => ({
      date: week,
      hours: CHANNELS[i]!.hoursPerWeek,
      channelId: channel.id,
    })),
  );
  const timeEntries = await data.timeEntries.createMany(timeEntryRows);
  counts.timeEntries = timeEntries.length;

  const weeklyReviews = await data.weeklyReviews.createMany(
    weeks.map((week) => ({
      weekStart: week,
      completedAt: new Date(`${addDays(week, 6)}T18:00:00Z`),
    })),
  );
  counts.weeklyReviews = weeklyReviews.length;

  return { skipped: false, userId, counts };
}
