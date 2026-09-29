import { forUser } from '@dailyx/db';
import { createTestDb, seed } from '@dailyx/db/testing';
import { channels } from '@dailyx/ui';
import { describe, expect, it } from 'vitest';

import { loadAllLens, loadChannelLens, loadLensTabs } from './acquisition';

const TODAY = '2026-09-28';
const NOW = new Date('2026-09-28T12:00:00Z');

async function seededOwner() {
  const db = await createTestDb();
  await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
  return forUser(db, 'seed-owner');
}

describe('loadChannelLens', () => {
  it('the Upwork funnel matches the seed funnel', async () => {
    const data = await seededOwner();
    const lens = await loadChannelLens(data, 'upwork', NOW);
    expect(lens).not.toBeNull();
    expect(lens!.funnel.stages.map((s) => s.value)).toEqual([180, 112, 41, 19, 6]);
  });

  it('flags the email Opens step and never picks it as the leak', async () => {
    const data = await seededOwner();
    const lens = await loadChannelLens(data, 'email', NOW);
    expect(lens).not.toBeNull();
    expect(lens!.funnel.stages[1]!.flag).toBe(channels.email.flags![1]);
    expect(lens!.funnel.leak).not.toBe(0);
    expect(lens!.funnel.leak).not.toBe(1);
    expect(lens!.trend?.name).toBe('Meetings booked ÷ Replied');
  });

  it('Upwork health: replies waiting, oldest wait and sent this week', async () => {
    const data = await seededOwner();
    const lens = await loadChannelLens(data, 'upwork', NOW);
    expect(lens).not.toBeNull();

    const repliesWaiting = lens!.health.find((h) => h.label === 'Replies waiting')!;
    expect(repliesWaiting.value).toBe('2');
    expect(repliesWaiting.status).toBe('fix');

    const oldestWait = lens!.health.find((h) => h.label === 'Oldest wait')!;
    expect(oldestWait.value).toBe('2d');

    const sent = lens!.health.find((h) => h.label === 'Sent · 7 days')!;
    expect(sent.meter).toEqual([14, 15]);
  });

  it('returns null for a preset with no active bet', async () => {
    const data = await seededOwner();
    const lens = await loadChannelLens(data, 'content', NOW);
    expect(lens).toBeNull();
  });
});

describe('loadLensTabs', () => {
  it('lists all channels, with replies-waiting badges', async () => {
    const data = await seededOwner();
    const tabs = await loadLensTabs(data, NOW);
    expect(tabs.map((t) => t.id)).toEqual(['all', 'upwork', 'email', 'linkedin', 'referrals']);

    const upwork = tabs.find((t) => t.id === 'upwork')!;
    expect(upwork.badge).toBe('2');
    expect(upwork.badgeTone).toBe('warn');

    const linkedin = tabs.find((t) => t.id === 'linkedin')!;
    expect(linkedin.badge).toBe('1');
    expect(linkedin.badgeTone).toBe('warn');

    const all = tabs.find((t) => t.id === 'all')!;
    expect(all.badge).toBe('3');
    expect(all.badgeTone).toBe('warn');

    const email = tabs.find((t) => t.id === 'email')!;
    const referrals = tabs.find((t) => t.id === 'referrals')!;
    expect(email.badge).toBeUndefined();
    expect(referrals.badge).toBeUndefined();
  });
});

describe('loadAllLens', () => {
  it('returns one funnel view per active bet', async () => {
    const data = await seededOwner();
    const all = await loadAllLens(data, NOW);
    expect(all.map((a) => a.bet.preset)).toEqual(['upwork', 'email', 'linkedin', 'referrals']);
    const upwork = all.find((a) => a.bet.preset === 'upwork')!;
    expect(upwork.funnel.stages.map((s) => s.value)).toEqual([180, 112, 41, 19, 6]);
  });
});
