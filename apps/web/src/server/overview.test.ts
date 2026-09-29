import { forUser } from '@dailyx/db';
import { createTestDb, seed } from '@dailyx/db/testing';
import { describe, expect, it } from 'vitest';

import { loadMoney } from './money';
import { loadOverview } from './overview';

const TODAY = '2026-09-28';
const NOW = new Date('2026-09-28T12:00:00Z');

describe('loadOverview', () => {
  it('matches /money net worth, and counts sent + waiting per channel', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: TODAY, appEnv: undefined });
    const data = forUser(db, 'seed-owner');

    const [view, money] = await Promise.all([loadOverview(data, NOW), loadMoney(data, NOW)]);

    expect(view.money.netWorth?.metric.value).toEqual(money.netWorth?.metric.value);
    expect(view.money.netWorth?.metric.value).toEqual({ amount: 4_821_809, currency: 'USD' });

    // Cross-check by hand, floor(i * reach / 2400) style formulas from the seed's distribution:
    // upwork i=178,179 -> floor(i/2)=89 (2 items); email i=2374..2399 -> floor(i*90/2400)=89 (26);
    // linkedin i=297..299 -> floor(i*0.3)=89 (3); referrals: 5*15=75 < 89 (0 items). Total 31.
    expect(view.sentThisWeek.value).toBe(31);

    const waiting = view.channels.map((c) => c.waiting.value);
    expect(waiting).toEqual([2, 0, 1, 0]);

    const presets = view.channels.map((c) => c.bet.preset);
    expect(presets).toEqual(['upwork', 'email', 'linkedin', 'referrals']);
  });
});
