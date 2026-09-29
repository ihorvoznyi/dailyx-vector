import {
  addDays,
  baselineRates,
  biggestLeak,
  deltasPp,
  hoursLogged,
  keyStep,
  repliesWaiting,
  stageCounts,
  stageRates,
  weeklyRates,
  type DateWindow,
  type IsoDate,
  type OutreachItem,
  type StageRate,
} from '@dailyx/core';
import { toOutreachItem, toTimeEntry, type ChannelPresetId, type UserData } from '@dailyx/db';
import { universalStages, type ChannelPreset } from '@dailyx/ui';

import type { OutreachRow } from '../components/outreach/outreach-log';
import { todayIn, weekStartIn } from '../lib/dates';
import { formatHours, formatPct, formatShortDate, formatWait, formatWindow } from '../lib/format';
import { buildMath, type MathSource, type MathSpec } from '../lib/math';
import { activeBets, flaggedStages, presetOf, type ChannelBetRow } from './channels';

export interface LensTab {
  id: ChannelPresetId | 'all';
  name: string;
  mark: string;
  sub: string;
  badge?: string;
  badgeTone?: 'warn';
}

export interface FunnelView {
  stages: { label: string; value: number; universal: string; flag: string | null }[];
  /** Core `stageRates` values, 4 steps. */
  rates: (number | null)[];
  /** Core `baselineRates` values. */
  baseline: (number | null)[];
  /** Core `biggestLeak(...)?.step ?? null`. */
  leak: number | null;
  /** 4, one per step. */
  stepMath: MathSpec[];
  /** 5, one per stage count. */
  countMath: MathSpec[];
  /** Any baseline value !== null. */
  hasBaseline: boolean;
}

export interface ChannelLensView {
  bet: ChannelBetRow;
  preset: ChannelPreset;
  funnel: FunnelView;
  health: {
    label: string;
    value: string;
    unit?: string;
    status: 'ok' | 'watch' | 'fix' | 'info';
    note?: string;
    meter?: [number, number];
    math: MathSpec;
  }[];
  trend: { name: string; points: { x: string; y: number }[]; latest: MathSpec | null } | null;
  /** Newest first, at most 50. */
  items: OutreachRow[];
}

function outreachLabel(row: OutreachRow): string {
  const company = row.company ? ` · ${row.company}` : '';
  return `${row.contactName ?? 'Unnamed'}${company} · sent ${formatShortDate(row.sentOn)}`;
}

function sourcesFor(
  recordIds: readonly string[],
  rowsById: Map<string, OutreachRow>,
): MathSource[] {
  return recordIds.map((id) => {
    const row = rowsById.get(id);
    if (!row) throw new Error(`acquisition math: unknown outreach item ${id}`);
    return { id, label: outreachLabel(row) };
  });
}

function editedAtFor(recordIds: readonly string[], rowsById: Map<string, OutreachRow>) {
  return recordIds.map((id) => rowsById.get(id)?.updatedAt ?? null);
}

/** The funnel and its math for one active bet, over the 90-day window ending `today`. */
function buildFunnelView(
  channelItems: OutreachItem[],
  rowsById: Map<string, OutreachRow>,
  bet: ChannelBetRow,
  preset: ChannelPreset,
  window: DateWindow,
  today: IsoDate,
): FunnelView {
  const counts = stageCounts({ items: channelItems, window });
  const rates = stageRates({
    items: channelItems,
    window,
    asOf: today,
    maturityDays: bet.maturityDays,
  });
  const baseline = baselineRates({
    items: channelItems,
    window,
    asOf: today,
    maturityDays: bet.maturityDays,
  });
  const rateValues = rates.map((r) => r.value);
  const baselineValues = baseline.map((b) => b.value);
  const flagged = flaggedStages(bet.preset);
  const leak = biggestLeak({ rates: rateValues, baseline: baselineValues, flaggedStages: flagged });
  const deltas = deltasPp(rateValues, baselineValues);

  const stages = preset.stages.map((label, i) => ({
    label,
    value: counts[i]!.value,
    universal: universalStages[i]!,
    flag: preset.flags?.[i] ?? null,
  }));

  const stepMath: MathSpec[] = rates.map((rate: StageRate, i) => {
    const delta = deltas[i] ?? null;
    return buildMath({
      title: `${preset.stages[i]} → ${preset.stages[i + 1]}`,
      value: formatPct(rate.value),
      formula: `Items that reached ${preset.stages[i + 1]} ÷ items that reached ${preset.stages[i]}, counting only items at least ${bet.maturityDays[rate.to]} days old`,
      window: formatWindow(window),
      counts: [
        { label: 'Reached', value: String(rate.numerator) },
        { label: 'Out of', value: String(rate.denominator) },
        { label: '90-day baseline', value: formatPct(baselineValues[i] ?? null) },
        { label: 'Delta', value: delta === null ? '—' : `${delta.toFixed(1)} pp` },
      ],
      sources: sourcesFor(rate.recordIds, rowsById),
      editedAt: editedAtFor(rate.recordIds, rowsById),
    });
  });

  const countMath: MathSpec[] = counts.map((count, i) =>
    buildMath({
      title: preset.stages[i]!,
      value: String(count.value),
      formula:
        i === 0
          ? `Items sent in the window that reached ${preset.stages[i]}`
          : `Items sent in the window that reached ${preset.stages[i]} or a later stage`,
      window: formatWindow(window),
      counts: [{ label: 'Count', value: String(count.value) }],
      sources: sourcesFor(count.recordIds, rowsById),
      editedAt: editedAtFor(count.recordIds, rowsById),
    }),
  );

  return {
    stages,
    rates: rateValues,
    baseline: baselineValues,
    leak: leak?.step ?? null,
    stepMath,
    countMath,
    hasBaseline: baselineValues.some((v) => v !== null),
  };
}

/** All active bets' funnel views, for `/acquisition` ("All channels"). */
export async function loadAllLens(
  data: UserData,
  now: Date = new Date(),
): Promise<{ bet: ChannelBetRow; preset: ChannelPreset; funnel: FunnelView }[]> {
  const [bets, settings, outreachRows] = await Promise.all([
    data.channelBets.list(),
    data.settings.get(),
    data.outreachItems.list(),
  ]);
  const today = todayIn(settings.timezone, now);
  const window: DateWindow = { start: addDays(today, -89), end: today };

  return activeBets(bets).map((bet) => {
    const rows = outreachRows.filter((r) => r.channelId === bet.id);
    const rowsById = new Map(rows.map((r) => [r.id, r]));
    const items = rows.map(toOutreachItem);
    const preset = presetOf(bet.preset);
    return { bet, preset, funnel: buildFunnelView(items, rowsById, bet, preset, window, today) };
  });
}

/** One channel's full lens, or null when it has no active bet. */
export async function loadChannelLens(
  data: UserData,
  preset: ChannelPresetId,
  now: Date = new Date(),
): Promise<ChannelLensView | null> {
  const [bets, settings, outreachRows, timeEntryRows] = await Promise.all([
    data.channelBets.list(),
    data.settings.get(),
    data.outreachItems.list(),
    data.timeEntries.list(),
  ]);
  const bet = activeBets(bets).find((b) => b.preset === preset);
  if (!bet) return null;

  const tz = settings.timezone;
  const today = todayIn(tz, now);
  const window: DateWindow = { start: addDays(today, -89), end: today };
  const presetInfo = presetOf(bet.preset);

  const rows = outreachRows.filter((r) => r.channelId === bet.id);
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  const items = rows.map(toOutreachItem);

  const funnel = buildFunnelView(items, rowsById, bet, presetInfo, window, today);

  // Health: Sent · 7 days.
  const sentWindow: DateWindow = { start: addDays(today, -6), end: today };
  const sentCount = stageCounts({ items, window: sentWindow })[0]!;
  const planned = bet.caps.sentPerWeek;
  const sentStatus: 'ok' | 'watch' | 'fix' | 'info' =
    planned === undefined
      ? 'info'
      : sentCount.value >= planned
        ? 'ok'
        : sentCount.value >= planned / 2
          ? 'watch'
          : 'fix';
  const sentMath = buildMath({
    title: 'Sent · 7 days',
    value: String(sentCount.value),
    formula: 'Items sent in the last 7 days',
    window: formatWindow(sentWindow),
    counts: [{ label: 'Sent', value: String(sentCount.value) }],
    sources: sourcesFor(sentCount.recordIds, rowsById),
    editedAt: editedAtFor(sentCount.recordIds, rowsById),
  });

  // Health: Replies waiting / Oldest wait.
  const waitingInput = rows.map((r) => ({
    id: r.id,
    awaitingReplySince: r.awaitingReplySince?.toISOString() ?? null,
  }));
  const waiting = repliesWaiting({ items: waitingInput, now: now.toISOString() });
  const over24 = repliesWaiting({ items: waitingInput, now: now.toISOString(), minHours: 24 });
  const waitingStatus: 'ok' | 'watch' | 'fix' =
    waiting.value === 0 ? 'ok' : over24.value > 0 ? 'fix' : 'watch';
  const waitingMath = buildMath({
    title: 'Replies waiting',
    value: String(waiting.value),
    formula: 'Items awaiting a reply right now',
    window: `As of ${formatShortDate(today)}`,
    counts: [
      { label: 'Waiting', value: String(waiting.value) },
      { label: 'Over 24h', value: String(over24.value) },
    ],
    sources: sourcesFor(waiting.recordIds, rowsById),
    editedAt: editedAtFor(waiting.recordIds, rowsById),
  });
  const oldestStatus: 'ok' | 'watch' | 'fix' =
    waiting.oldestHours === null ? 'ok' : waiting.oldestHours >= 24 ? 'fix' : 'watch';
  const oldestMath = buildMath({
    title: 'Oldest wait',
    value: waiting.oldestHours === null ? '—' : formatWait(waiting.oldestHours),
    formula: 'The longest a currently-waiting item has waited',
    window: `As of ${formatShortDate(today)}`,
    counts: [
      {
        label: 'Oldest wait',
        value: waiting.oldestHours === null ? '—' : formatWait(waiting.oldestHours),
      },
    ],
    sources: sourcesFor(waiting.recordIds, rowsById),
    editedAt: editedAtFor(waiting.recordIds, rowsById),
  });

  // Health: Hours this week.
  const ws = weekStartIn(tz, now);
  const hoursWindow: DateWindow = { start: ws, end: addDays(ws, 6) };
  const timeEntries = timeEntryRows.map(toTimeEntry);
  const timeEntriesById = new Map(timeEntryRows.map((e) => [e.id, e]));
  const hours = hoursLogged({ entries: timeEntries, window: hoursWindow, channelId: bet.id });
  const hoursMath = buildMath({
    title: 'Hours this week',
    value: formatHours(hours.value),
    formula: 'Confirmed TimeEntries on this channel this week',
    window: formatWindow(hoursWindow),
    counts: [{ label: 'Hours', value: formatHours(hours.value) }],
    sources: hours.recordIds.map((id) => {
      const entry = timeEntriesById.get(id);
      if (!entry) throw new Error(`acquisition math: unknown time entry ${id}`);
      return { id, label: `${formatHours(entry.hours)} · ${entry.date}` };
    }),
    editedAt: hours.recordIds.map((id) => timeEntriesById.get(id)?.updatedAt ?? null),
  });

  const health: ChannelLensView['health'] = [
    {
      label: 'Sent · 7 days',
      value: String(sentCount.value),
      status: sentStatus,
      note:
        planned === undefined
          ? 'No weekly target: set one in setup'
          : planned > 0
            ? `Planned ${planned} a week`
            : undefined,
      meter: planned !== undefined ? [sentCount.value, planned] : undefined,
      math: sentMath,
    },
    {
      label: 'Replies waiting',
      value: String(waiting.value),
      status: waitingStatus,
      note: `${over24.value} over 24h`,
      math: waitingMath,
    },
    {
      label: 'Oldest wait',
      value: waiting.oldestHours === null ? '—' : formatWait(waiting.oldestHours),
      status: oldestStatus,
      math: oldestMath,
    },
    {
      label: 'Hours this week',
      value: formatHours(hours.value),
      status: 'info',
      note: `Planned ${formatHours(bet.hoursPerWeek)} · confirmed in review`,
      meter: [hours.value, bet.hoursPerWeek],
      math: hoursMath,
    },
  ];

  // Trend: keyStep's weekly rate over 13 weeks.
  const step = keyStep(flaggedStages(bet.preset));
  let trend: ChannelLensView['trend'] = null;
  if (step !== null) {
    const weekly = weeklyRates({
      items,
      step,
      weeks: 13,
      asOf: today,
      maturityDays: bet.maturityDays,
    });
    const mature = weekly.filter((w) => w.rate.value !== null);
    const points = mature.map((w) => ({ x: formatShortDate(w.week), y: w.rate.value! * 100 }));
    const lastMature = mature.at(-1) ?? null;
    const latest = lastMature
      ? buildMath({
          title: `${presetInfo.stages[step + 1]} ÷ ${presetInfo.stages[step]}`,
          value: formatPct(lastMature.rate.value),
          formula: `Items that reached ${presetInfo.stages[step + 1]} ÷ items that reached ${presetInfo.stages[step]}, counting only items at least ${bet.maturityDays[lastMature.rate.to]} days old`,
          window: formatWindow({ start: lastMature.week, end: addDays(lastMature.week, 6) }),
          counts: [
            { label: 'Reached', value: String(lastMature.rate.numerator) },
            { label: 'Out of', value: String(lastMature.rate.denominator) },
          ],
          sources: sourcesFor(lastMature.rate.recordIds, rowsById),
          editedAt: editedAtFor(lastMature.rate.recordIds, rowsById),
        })
      : null;
    trend = { name: `${presetInfo.stages[step + 1]} ÷ ${presetInfo.stages[step]}`, points, latest };
  }

  return {
    bet,
    preset: presetInfo,
    funnel,
    health,
    trend,
    items: [...rows]
      .sort(
        (a, b) =>
          b.sentOn.localeCompare(a.sentOn) ||
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b.id.localeCompare(a.id),
      )
      .slice(0, 50),
  };
}

/** The lens row: "All channels" first, then one tab per active bet. */
export async function loadLensTabs(data: UserData, now: Date = new Date()): Promise<LensTab[]> {
  const [bets, outreachRows] = await Promise.all([
    data.channelBets.list(),
    data.outreachItems.list(),
  ]);
  const active = activeBets(bets);
  const nowIso = now.toISOString();

  const waitingByBet = new Map(
    active.map((bet) => {
      const rows = outreachRows.filter((r) => r.channelId === bet.id);
      const waiting = repliesWaiting({
        items: rows.map((r) => ({
          id: r.id,
          awaitingReplySince: r.awaitingReplySince?.toISOString() ?? null,
        })),
        now: nowIso,
      });
      const over24 = repliesWaiting({
        items: rows.map((r) => ({
          id: r.id,
          awaitingReplySince: r.awaitingReplySince?.toISOString() ?? null,
        })),
        now: nowIso,
        minHours: 24,
      });
      return [bet.id, { count: waiting.value, over24: over24.value > 0 }] as const;
    }),
  );

  const totalHours = active.reduce((sum, bet) => sum + bet.hoursPerWeek, 0);
  const totalWaiting = [...waitingByBet.values()].reduce((sum, w) => sum + w.count, 0);
  const anyOver24 = [...waitingByBet.values()].some((w) => w.over24);

  const all: LensTab = {
    id: 'all',
    name: 'All channels',
    mark: '∑',
    sub: `${active.length} bets · ${formatHours(totalHours)}/wk`,
    ...(totalWaiting > 0
      ? { badge: String(totalWaiting), ...(anyOver24 ? { badgeTone: 'warn' as const } : {}) }
      : {}),
  };

  const tabs: LensTab[] = active.map((bet) => {
    const waiting = waitingByBet.get(bet.id)!;
    return {
      id: bet.preset,
      name: bet.name,
      mark: presetOf(bet.preset).mark,
      sub: `${formatHours(bet.hoursPerWeek)}/wk`,
      ...(waiting.count > 0
        ? {
            badge: String(waiting.count),
            ...(waiting.over24 ? { badgeTone: 'warn' as const } : {}),
          }
        : {}),
    };
  });

  return [all, ...tabs];
}
