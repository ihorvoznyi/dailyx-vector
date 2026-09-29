import type { IsoDate, TimedStage } from '@dailyx/core';
import type { UserData } from '@dailyx/db';

import type { Lead } from '../lib/lead-list';

function rowOf(lead: Lead) {
  return {
    contactName: lead.contactName,
    company: lead.company,
    url: lead.url,
  };
}

/** One Sent item on the channel, dated `today`. Throws when `channelId` isn't the user's. */
export async function logOne(
  data: UserData,
  channelId: string,
  lead: Lead,
  today: IsoDate,
): Promise<string> {
  const bet = await data.channelBets.get(channelId);
  if (!bet) throw new Error('not found');
  const row = await data.outreachItems.create({
    channelId,
    sentOn: today,
    stageDates: {},
    ...rowOf(lead),
  });
  return row.id;
}

/** N Sent items dated `today`, one createMany (one transaction, N audit rows). */
export async function logMany(
  data: UserData,
  channelId: string,
  leads: Lead[],
  today: IsoDate,
): Promise<number> {
  const bet = await data.channelBets.get(channelId);
  if (!bet) throw new Error('not found');
  const rows = await data.outreachItems.createMany(
    leads.map((lead) => ({ channelId, sentOn: today, stageDates: {}, ...rowOf(lead) })),
  );
  return rows.length;
}

/** Toggles `stageDates[stage]`: set to `today` when missing, removed when present. */
export async function toggleStage(
  data: UserData,
  itemId: string,
  stage: TimedStage,
  today: IsoDate,
): Promise<void> {
  const item = await data.outreachItems.get(itemId);
  if (!item) throw new Error('not found');
  const stageDates = { ...item.stageDates };
  if (stageDates[stage] === undefined) stageDates[stage] = today;
  else delete stageDates[stage];
  await data.outreachItems.update(itemId, { stageDates });
}

/** waiting → `awaitingReplySince` = now; not waiting → null. */
export async function setAwaiting(
  data: UserData,
  itemId: string,
  waiting: boolean,
  now: Date,
): Promise<void> {
  const item = await data.outreachItems.get(itemId);
  if (!item) throw new Error('not found');
  await data.outreachItems.update(itemId, { awaitingReplySince: waiting ? now : null });
}
