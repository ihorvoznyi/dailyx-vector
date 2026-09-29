import { forUser } from '@dailyx/db';
import { createTestDb, seed } from '@dailyx/db/testing';
import { describe, expect, it } from 'vitest';

import { confirmWeekHours, finishWeek, loadReview, parseHoursForm } from './review';

const TODAY = '2026-09-28';
const NOW = new Date('2026-09-28T12:00:00Z');

async function seededOwner() {
  const db = await createTestDb();
  await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
  return forUser(db, 'seed-owner');
}

describe('loadReview', () => {
  it('computes the weekly review for the seed', async () => {
    const data = await seededOwner();
    const bets = await data.channelBets.list();
    const upwork = bets.find((b) => b.preset === 'upwork')!;
    const linkedin = bets.find((b) => b.preset === 'linkedin')!;

    const view = await loadReview(data, NOW);

    expect(view.weekStart).toBe('2026-09-28');
    expect(view.reviewed).toBe(false);

    expect(view.waiting).toHaveLength(3);
    expect(view.waiting[0]!.row.channelId).toBe(linkedin.id);
    expect(view.waiting[0]!.hours).toBeCloseTo(75, 5);
    expect(view.waiting[1]!.row.channelId).toBe(upwork.id);
    expect(view.waiting[1]!.hours).toBeCloseTo(51, 5);
    expect(view.waiting[2]!.row.channelId).toBe(upwork.id);
    expect(view.waiting[2]!.hours).toBeCloseTo(51, 5);

    expect(view.stale.map((a) => a.account.name)).toEqual(['Payoneer']);

    expect(view.hours.map((h) => h.confirmed)).toEqual([false, false, false, false]);
    expect(view.hours.map((h) => h.hours)).toEqual([8, 5, 6, 1]);

    expect(view.remaining).toBe(8);
  });

  it('upserts one TimeEntry per bet, dated weekStart', async () => {
    const data = await seededOwner();
    const bets = await data.channelBets.list();
    const upwork = bets.find((b) => b.preset === 'upwork')!;
    const email = bets.find((b) => b.preset === 'email')!;
    const linkedin = bets.find((b) => b.preset === 'linkedin')!;
    const referrals = bets.find((b) => b.preset === 'referrals')!;

    await confirmWeekHours(data, '2026-09-28', [
      { betId: upwork.id, hours: 7.5 },
      { betId: email.id, hours: 5 },
      { betId: linkedin.id, hours: 6 },
      { betId: referrals.id, hours: 1 },
    ]);

    const afterFirst = (await data.timeEntries.list()).filter((e) => e.date === '2026-09-28');
    expect(afterFirst).toHaveLength(4);

    await confirmWeekHours(data, '2026-09-28', [{ betId: upwork.id, hours: 9 }]);

    const afterSecond = (await data.timeEntries.list()).filter((e) => e.date === '2026-09-28');
    expect(afterSecond).toHaveLength(4);
    const upworkEntry = afterSecond.find((e) => e.channelId === upwork.id);
    expect(upworkEntry?.hours).toBe(9);

    const view = await loadReview(data, NOW);
    expect(view.hours.every((h) => h.confirmed)).toBe(true);
  });

  it('finishes the week idempotently', async () => {
    const data = await seededOwner();

    await finishWeek(data, '2026-09-28', NOW);
    const view = await loadReview(data, NOW);
    expect(view.reviewed).toBe(true);

    await finishWeek(data, '2026-09-28', NOW);
    const reviews = await data.weeklyReviews.list();
    expect(reviews).toHaveLength(5);
  });
});

describe('parseHoursForm', () => {
  it('accepts a valid hours value', () => {
    const fd = new FormData();
    fd.set('hours.bet-1', '7.5');
    const result = parseHoursForm(fd, ['bet-1']);
    expect(result).toEqual({ ok: true, data: [{ betId: 'bet-1', hours: 7.5 }] });
  });

  it('rejects a value over 168', () => {
    const fd = new FormData();
    fd.set('hours.bet-1', '169');
    const result = parseHoursForm(fd, ['bet-1']);
    expect(result.ok).toBe(false);
  });

  it('rejects a missing bet', () => {
    const fd = new FormData();
    const result = parseHoursForm(fd, ['bet-1']);
    expect(result.ok).toBe(false);
  });

  it('rejects a negative value', () => {
    const fd = new FormData();
    fd.set('hours.bet-1', '-1');
    const result = parseHoursForm(fd, ['bet-1']);
    expect(result.ok).toBe(false);
  });
});
