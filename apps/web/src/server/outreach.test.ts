import { forUser, user } from '@dailyx/db';
import { createTestDb, seed } from '@dailyx/db/testing';
import { describe, expect, it } from 'vitest';

import { parseLeadList } from '../lib/lead-list';
import { logMany, logOne, setAwaiting, toggleStage } from './outreach';

const TODAY = '2026-09-28';

async function seededOwner() {
  const db = await createTestDb();
  await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
  const data = forUser(db, 'seed-owner');
  const referrals = (await data.channelBets.list()).find((b) => b.preset === 'referrals');
  if (!referrals) throw new Error('expected a referrals bet from the seed');
  return { data, referrals };
}

describe('logOne / logMany', () => {
  it('logs a pasted list of leads on the referrals channel', async () => {
    const { data, referrals } = await seededOwner();
    const before = await data.outreachItems.list();
    expect(before.filter((i) => i.channelId === referrals.id)).toHaveLength(6);

    const parsed = parseLeadList('Ann Lee, Acme, https://acme.io\nBob, , \n\n  Cara,Kite  ');
    if (!parsed.ok) throw new Error('expected leads to parse');
    const count = await logMany(data, referrals.id, parsed.leads, TODAY);

    expect(count).toBe(3);
    const after = (await data.outreachItems.list()).filter((i) => i.channelId === referrals.id);
    expect(after).toHaveLength(9);
    const newOnes = after.filter((i) => i.sentOn === TODAY);
    expect(newOnes).toHaveLength(3);
  });

  it('logs one empty lead', async () => {
    const { data, referrals } = await seededOwner();
    const before = await data.outreachItems.list();

    const id = await logOne(
      data,
      referrals.id,
      { contactName: null, company: null, url: null },
      TODAY,
    );

    const after = await data.outreachItems.list();
    expect(after).toHaveLength(before.length + 1);
    const created = after.find((i) => i.id === id);
    expect(created?.contactName).toBeNull();
  });

  it('rejects an id that is not the caller channel', async () => {
    const { data } = await seededOwner();
    await expect(
      logOne(
        data,
        '00000000-0000-0000-0000-000000000000',
        { contactName: null, company: null, url: null },
        TODAY,
      ),
    ).rejects.toThrow('not found');
  });
});

describe('toggleStage', () => {
  it('sets a stage date, then clears it on a second tap', async () => {
    const { data, referrals } = await seededOwner();
    const id = await logOne(
      data,
      referrals.id,
      { contactName: null, company: null, url: null },
      TODAY,
    );

    await toggleStage(data, id, 'attention', TODAY);
    const tapped = await data.outreachItems.get(id);
    expect(tapped?.stageDates).toEqual({ attention: TODAY });

    await toggleStage(data, id, 'attention', TODAY);
    const cleared = await data.outreachItems.get(id);
    expect(cleared?.stageDates).toEqual({});
  });

  it("rejects a random id and another user's item id", async () => {
    const { data } = await seededOwner();
    await expect(
      toggleStage(data, '00000000-0000-0000-0000-000000000000', 'attention', TODAY),
    ).rejects.toThrow('not found');

    const db2 = await createTestDb();
    await db2.insert(user).values({ id: 'other', name: 'Other', email: 'other@x.com' });
    const otherData = forUser(db2, 'other');
    const otherBet = await otherData.channelBets.create({
      preset: 'linkedin',
      name: 'Other channel',
      startedOn: TODAY,
    });
    const otherItem = await otherData.outreachItems.create({
      channelId: otherBet.id,
      sentOn: TODAY,
      stageDates: {},
    });

    await expect(toggleStage(data, otherItem.id, 'attention', TODAY)).rejects.toThrow('not found');
  });
});

describe('setAwaiting', () => {
  it('sets and clears awaitingReplySince', async () => {
    const { data, referrals } = await seededOwner();
    const items = await data.outreachItems.list();
    const item = items.find((i) => i.channelId === referrals.id);
    if (!item) throw new Error('expected a referrals item');

    const now = new Date('2026-09-28T10:00:00Z');
    await setAwaiting(data, item.id, true, now);
    const waiting = await data.outreachItems.get(item.id);
    expect(waiting?.awaitingReplySince?.toISOString()).toBe(now.toISOString());

    await setAwaiting(data, item.id, false, now);
    const answered = await data.outreachItems.get(item.id);
    expect(answered?.awaitingReplySince).toBeNull();
  });
});
