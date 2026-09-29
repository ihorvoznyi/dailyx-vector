import { addDays, repliesWaiting, stageCounts, type DateWindow } from '@dailyx/core';
import { toOutreachItem, type outreachItems, type UserData } from '@dailyx/db';

import { weekStartIn } from '../lib/dates';
import { buildMath, type MathSpec } from '../lib/math';
import { formatDate, formatWindow } from '../lib/format';
import { activeBets, presetOf, type ChannelBetRow } from './channels';
import { loadMoney, type MoneyView } from './money';

type OutreachItemRow = typeof outreachItems.$inferSelect;

export interface OverviewView {
  money: MoneyView;
  /** core stageCounts over all items, window weekStartIn..+6, [0]. */
  sentThisWeek: { value: number; math: MathSpec };
  /** Active bets. */
  channels: {
    bet: ChannelBetRow;
    name: string;
    sent: { value: number; math: MathSpec };
    waiting: { value: number; math: MathSpec };
  }[];
  /** e.g. 'Tuesday, Sep 29' in the user's timezone. */
  todayLabel: string;
}

/** A show-the-math source label for one outreach item. */
function outreachLabel(row: OutreachItemRow): { id: string; label: string } {
  const who = row.contactName || row.company || 'Unknown';
  return { id: row.id, label: `${who} · sent ${formatDate(row.sentOn)}` };
}

function sentMath(
  title: string,
  window: DateWindow,
  count: { value: number; recordIds: readonly string[] },
  rowsById: Map<string, OutreachItemRow>,
): MathSpec {
  const rows = count.recordIds.map((id) => rowsById.get(id)!);
  return buildMath({
    title,
    value: String(count.value),
    formula: 'Outreach items sent, Monday through Sunday of this week',
    window: formatWindow(window),
    counts: [{ label: 'Sent', value: String(count.value) }],
    sources: rows.map(outreachLabel),
    editedAt: rows.map((r) => r.updatedAt),
  });
}

function waitingMath(
  title: string,
  count: { value: number; recordIds: readonly string[] },
  rowsById: Map<string, OutreachItemRow>,
): MathSpec {
  const rows = count.recordIds.map((id) => rowsById.get(id)!);
  return buildMath({
    title,
    value: String(count.value),
    formula: 'Items awaiting a reply, any wait length',
    window: 'As of now',
    counts: [{ label: 'Waiting', value: String(count.value) }],
    sources: rows.map(outreachLabel),
    editedAt: rows.map((r) => r.updatedAt),
  });
}

/** Everything the Overview `/` shows. `now` is injectable for tests. */
export async function loadOverview(data: UserData, now: Date = new Date()): Promise<OverviewView> {
  const [money, settings, bets, outreachRows] = await Promise.all([
    loadMoney(data, now),
    data.settings.get(),
    data.channelBets.list(),
    data.outreachItems.list(),
  ]);

  const ws = weekStartIn(settings.timezone, now);
  const window: DateWindow = { start: ws, end: addDays(ws, 6) };
  const items = outreachRows.map(toOutreachItem);
  const rowsById = new Map(outreachRows.map((r) => [r.id, r]));

  const sentCount = stageCounts({ items, window })[0]!;
  const sentThisWeek = {
    value: sentCount.value,
    math: sentMath('Sent this week', window, sentCount, rowsById),
  };

  const channels = activeBets(bets).map((bet) => {
    const name = presetOf(bet.preset).name;
    const channelRows = outreachRows.filter((r) => r.channelId === bet.id);
    const channelItems = channelRows.map(toOutreachItem);
    const channelSentCount = stageCounts({ items: channelItems, window })[0]!;
    const channelWaitingCount = repliesWaiting({
      items: channelRows.map((r) => ({
        id: r.id,
        awaitingReplySince: r.awaitingReplySince ? r.awaitingReplySince.toISOString() : null,
      })),
      now: now.toISOString(),
      minHours: 0,
    });
    return {
      bet,
      name,
      sent: {
        value: channelSentCount.value,
        // Deliberately doesn't embed the channel name: this string becomes an aria-label, and a
        // bare channel name (e.g. "Referrals") would collide with the channel-picker buttons in
        // quick-log's dialog under Playwright's substring role matching.
        math: sentMath('Channel sent this week', window, channelSentCount, rowsById),
      },
      waiting: {
        value: channelWaitingCount.value,
        math: waitingMath('Channel waiting for reply', channelWaitingCount, rowsById),
      },
    };
  });

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);

  return { money, sentThisWeek, channels, todayLabel };
}
