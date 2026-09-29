import { repliesWaiting, type IsoDate } from '@dailyx/core';
import type { UserData } from '@dailyx/db';

import type { OutreachRow } from '../components/outreach/outreach-log';
import { todayIn, weekStartIn } from '../lib/dates';
import { formatDate, formatWait } from '../lib/format';
import { buildMath, type MathSpec } from '../lib/math';
import { activeBets, type ChannelBetRow } from './channels';
import { loadMoney, type AccountView } from './money';

/** Only waits of at least this many hours belong on the weekly review. */
const MIN_WAIT_HOURS = 24;

export interface ReviewView {
  weekStart: IsoDate;
  /** `weekly_reviews` row for `weekStart` has `completedAt !== null`. */
  reviewed: boolean;
  /** repliesWaiting(minHours 24), oldest wait first. */
  waiting: { row: OutreachRow; channelName: string; hours: number }[];
  waitingMath: MathSpec;
  /** Active bets; hours is the existing entry for (weekStart, bet.id), or bet.hoursPerWeek. */
  hours: { bet: ChannelBetRow; hours: number; confirmed: boolean }[];
  stale: AccountView[];
  uahRate: number | null;
  remaining: number;
}

/** Everything `/review` shows. `now` is injectable for tests. */
export async function loadReview(data: UserData, now: Date = new Date()): Promise<ReviewView> {
  const settings = await data.settings.get();
  const weekStart = weekStartIn(settings.timezone, now);
  const today = todayIn(settings.timezone, now);

  const [bets, outreachRows, timeEntryRows, weeklyReviewRows, money] = await Promise.all([
    data.channelBets.list(),
    data.outreachItems.list(),
    data.timeEntries.list(),
    data.weeklyReviews.list(),
    loadMoney(data, now),
  ]);

  const review = weeklyReviewRows.find((r) => r.weekStart === weekStart);
  const reviewed = review?.completedAt != null;

  const betById = new Map(bets.map((b) => [b.id, b]));
  const outreachById = new Map(outreachRows.map((r) => [r.id, r]));

  const waitingResult = repliesWaiting({
    items: outreachRows.map((r) => ({
      id: r.id,
      awaitingReplySince: r.awaitingReplySince ? r.awaitingReplySince.toISOString() : null,
    })),
    now: now.toISOString(),
    minHours: MIN_WAIT_HOURS,
  });

  const waiting = waitingResult.recordIds.map((id) => {
    const row = outreachById.get(id)!;
    const channelName = betById.get(row.channelId)?.name ?? 'Unknown';
    const hours = (now.getTime() - row.awaitingReplySince!.getTime()) / 3_600_000;
    return { row, channelName, hours };
  });

  const waitingMath = buildMath({
    title: 'Replies waiting over 24h',
    value: String(waitingResult.value),
    formula: `Outreach items with a reply awaited for at least ${MIN_WAIT_HOURS} hours`,
    window: `As of ${formatDate(today)}`,
    counts: [{ label: 'Waiting', value: String(waitingResult.value) }],
    sources: waiting.map(({ row, channelName, hours }) => ({
      id: row.id,
      label: `${channelName} · ${row.contactName ?? 'Unnamed'} · waiting ${formatWait(hours)}`,
    })),
    editedAt: waiting.map(({ row }) => row.awaitingReplySince),
  });

  const hours = activeBets(bets).map((bet) => {
    const entry = timeEntryRows.find((e) => e.date === weekStart && e.channelId === bet.id);
    return { bet, hours: entry?.hours ?? bet.hoursPerWeek, confirmed: entry !== undefined };
  });

  const stale = money.accounts.filter((a) => a.stale);

  const remaining = waiting.length + hours.filter((h) => !h.confirmed).length + stale.length;

  return {
    weekStart,
    reviewed,
    waiting,
    waitingMath,
    hours,
    stale,
    uahRate: money.uahRate?.rateE6 ?? null,
    remaining,
  };
}

const HOURS_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;

export function parseHoursForm(
  fd: FormData,
  betIds: readonly string[],
): { ok: true; data: { betId: string; hours: number }[] } | { ok: false; error: string } {
  const data: { betId: string; hours: number }[] = [];
  for (const betId of betIds) {
    const raw = fd.get(`hours.${betId}`);
    if (typeof raw !== 'string' || !HOURS_PATTERN.test(raw)) {
      return { ok: false, error: 'Enter hours as a number, in quarter-hour steps' };
    }
    const value = Number(raw);
    if (value > 168) return { ok: false, error: 'Hours must be 168 or less' };
    data.push({ betId, hours: value });
  }
  return { ok: true, data };
}

/** One TimeEntry per bet dated weekStart: update the existing one or create it. */
export async function confirmWeekHours(
  data: UserData,
  weekStart: IsoDate,
  rows: { betId: string; hours: number }[],
): Promise<void> {
  const existing = await data.timeEntries.list();
  for (const { betId, hours } of rows) {
    const found = existing.find((e) => e.date === weekStart && e.channelId === betId);
    if (found) {
      await data.timeEntries.update(found.id, { hours });
    } else {
      await data.timeEntries.create({ date: weekStart, hours, channelId: betId });
    }
  }
}

/** Upsert weekly_reviews for weekStart with completedAt = now. */
export async function finishWeek(data: UserData, weekStart: IsoDate, now: Date): Promise<void> {
  const existing = (await data.weeklyReviews.list()).find((r) => r.weekStart === weekStart);
  if (existing) {
    await data.weeklyReviews.update(existing.id, { completedAt: now });
  } else {
    await data.weeklyReviews.create({ weekStart, completedAt: now });
  }
}
