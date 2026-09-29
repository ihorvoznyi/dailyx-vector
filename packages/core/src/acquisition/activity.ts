import { addDays, type DateWindow, type IsoDate, weekStart } from '../dates';
import type { TimeEntry } from '../money/effective-rate';
import type { Metric } from '../result';
import { stageRates, type StageRate } from './stage-rates';
import { furthestStage, type MaturityDays, type OutreachItem, UNIVERSAL_STAGES } from './stages';

/** A count: `numerator` equals `value`, no denominator. */
export type Count = Metric<number, number, null>;

export interface StageCountsInput {
  readonly items: readonly OutreachItem[];
  /** Items whose `sentOn` falls in this window count. */
  readonly window: DateWindow;
}

/**
 * Five counts, Reach through Win: items sent in the window that reached each stage (a later
 * stage implies the earlier ones). No maturity filter: these are what the funnel shows.
 * recordIds: the counted items, in input order.
 */
export function stageCounts(input: StageCountsInput): Count[] {
  const { window } = input;
  const inWindow = input.items.filter((i) => window.start <= i.sentOn && i.sentOn <= window.end);
  return UNIVERSAL_STAGES.map((_, index) => {
    const reached = inWindow.filter((i) => furthestStage(i) >= index);
    return {
      value: reached.length,
      numerator: reached.length,
      denominator: null,
      recordIds: reached.map((i) => i.id),
    };
  });
}

export interface WaitingItem {
  readonly id: string;
  /** ISO timestamp, or null when no reply is awaited. */
  readonly awaitingReplySince: string | null;
}

export interface RepliesWaitingInput {
  readonly items: readonly WaitingItem[];
  /** ISO timestamp. */
  readonly now: string;
  /** Only waits of at least this many hours count. Default 0. */
  readonly minHours?: number;
}

/** value: items waiting ≥ minHours. oldestHours: the longest counted wait, or null. recordIds oldest first. */
export interface RepliesWaiting extends Count {
  readonly oldestHours: number | null;
}

/** Throws RangeError when `now` or a timestamp doesn't parse. */
export function repliesWaiting(input: RepliesWaitingInput): RepliesWaiting {
  const { items, now, minHours = 0 } = input;
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) throw new RangeError(`Not an ISO timestamp: ${now}`);

  const waiting = items
    .filter((i): i is WaitingItem & { awaitingReplySince: string } => i.awaitingReplySince !== null)
    .map((i) => {
      const sinceMs = Date.parse(i.awaitingReplySince);
      if (Number.isNaN(sinceMs))
        throw new RangeError(`Not an ISO timestamp: ${i.awaitingReplySince}`);
      return { id: i.id, hours: (nowMs - sinceMs) / 3_600_000 };
    })
    .filter((i) => i.hours >= minHours)
    .sort((a, b) => b.hours - a.hours);

  return {
    value: waiting.length,
    numerator: waiting.length,
    denominator: null,
    recordIds: waiting.map((i) => i.id),
    oldestHours: waiting.length === 0 ? null : waiting[0]!.hours,
  };
}

export interface HoursLoggedInput {
  readonly entries: readonly TimeEntry[];
  readonly window: DateWindow;
  /** One channel; omitted = every channel entry (channelId !== null). Client-work entries never count. */
  readonly channelId?: string;
}

/** Sum of hours, rounded to 2 decimals. recordIds: counted entries, input order. */
export function hoursLogged(input: HoursLoggedInput): Count {
  const { entries, window, channelId } = input;
  const counted = entries.filter((e) => {
    if (e.date < window.start || e.date > window.end) return false;
    return channelId === undefined ? e.channelId !== null : e.channelId === channelId;
  });
  const sum = counted.reduce((total, e) => total + e.hours, 0);
  const value = Math.round(sum * 100) / 100;
  return {
    value,
    numerator: value,
    denominator: null,
    recordIds: counted.map((e) => e.id),
  };
}

export interface WeeklyRatesInput {
  readonly items: readonly OutreachItem[];
  /** 0..3; step i runs from stage i to i + 1. Throws RangeError otherwise. */
  readonly step: number;
  /** How many weeks, ending with the week that contains `asOf`. */
  readonly weeks: number;
  readonly asOf: IsoDate;
  readonly maturityDays: MaturityDays;
}

export interface WeeklyRate {
  /** Monday of the week; the window is Monday..Sunday. */
  readonly week: IsoDate;
  readonly rate: StageRate;
}

/** Oldest week first. Each week is `stageRates` over that week's window with the same asOf. */
export function weeklyRates(input: WeeklyRatesInput): WeeklyRate[] {
  const { items, step, weeks, asOf, maturityDays } = input;
  if (!Number.isInteger(step) || step < 0 || step > 3) {
    throw new RangeError(`step must be 0..3, got ${step}`);
  }

  const lastWeekStart = weekStart(asOf);
  const results: WeeklyRate[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = addWeeks(lastWeekStart, -i);
    const end = addWeeks(start, 1, -1);
    const rates = stageRates({ items, window: { start, end }, asOf, maturityDays });
    results.push({ week: start, rate: rates[step]! });
  }
  return results;
}

/** `date` moved by `weeks` whole weeks, then by `extraDays` days. */
function addWeeks(date: IsoDate, weeks: number, extraDays = 0): IsoDate {
  return addDays(date, weeks * 7 + extraDays);
}

/** The first step touching no flagged stage (stage indices, 0 = Reach); null when every step does. */
export function keyStep(flaggedStages: readonly number[]): number | null {
  const flagged = new Set(flaggedStages);
  for (let step = 0; step < 4; step += 1) {
    if (!flagged.has(step) && !flagged.has(step + 1)) return step;
  }
  return null;
}
