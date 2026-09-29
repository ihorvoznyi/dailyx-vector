import { forUser, user } from '@dailyx/db';
import { createTestDb } from '@dailyx/db/testing';
import { describe, expect, it } from 'vitest';

import { applySetup } from './actions';
import { parseSetupForm } from './parse';

function validFormData(): FormData {
  const fd = new FormData();
  const base = {
    bets: '{"upwork":8,"email":5}',
    'sentPerWeek.upwork': '15',
    'sentPerWeek.email': '',
    monthlyCost: '3800',
    monthlyCostCurrency: 'USD',
    taxRate: '5',
    withAccounts: '1',
    'account.monobank.balance': '612400',
    'account.ibkr.balance': '26450',
    'account.paypal.balance': '5240',
    'account.payoneer.balance': '1700',
    'account.monobank.liquid': 'on',
    'account.ibkr.liquid': 'on',
    'account.paypal.liquid': 'on',
    'account.payoneer.liquid': 'on',
    uahRate: '41.3',
  };
  for (const [key, value] of Object.entries(base)) fd.append(key, value);
  return fd;
}

describe('applySetup', () => {
  it('creates bets, accounts, snapshots, an fx rate and settings on a fresh user', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'U', email: 'u@x.com' });
    const data = forUser(db, 'u1');

    const parsed = parseSetupForm(validFormData());
    if (!parsed.ok) throw new Error(`expected a valid form: ${parsed.error}`);
    await applySetup(data, parsed.data, '2026-09-29');

    const bets = await data.channelBets.list();
    expect(bets).toHaveLength(2);
    const upwork = bets.find((b) => b.preset === 'upwork');
    const email = bets.find((b) => b.preset === 'email');
    expect(upwork?.hoursPerWeek).toBe(8);
    expect(upwork?.caps).toEqual({ sentPerWeek: 15 });
    expect(upwork?.startedOn).toBe('2026-09-29');
    expect(email?.hoursPerWeek).toBe(5);
    expect(email?.caps).toEqual({});
    expect(email?.startedOn).toBe('2026-09-29');

    const accounts = await data.moneyAccounts.list();
    expect(accounts).toHaveLength(4);

    const snapshots = await data.balanceSnapshots.list();
    expect(snapshots).toHaveLength(4);
    expect(snapshots.map((s) => s.amount).sort((a, b) => a - b)).toEqual([
      170_000, 524_000, 2_645_000, 61_240_000,
    ]);

    const fxRates = await data.fxRates.list();
    expect(fxRates).toHaveLength(1);
    expect(fxRates[0]?.rateE6).toBe(41_300_000);

    const settings = await data.settings.get();
    expect(settings.monthlyCost).toBe(380_000);

    // Re-apply: un-pick upwork, keep email at a new pace, and no accounts this time.
    const reFd = new FormData();
    reFd.append('bets', '{"email":6}');
    reFd.append('monthlyCost', '3800');
    reFd.append('monthlyCostCurrency', 'USD');
    reFd.append('taxRate', '5');
    const reParsed = parseSetupForm(reFd);
    if (!reParsed.ok) throw new Error(`expected a valid re-apply form: ${reParsed.error}`);
    await applySetup(data, reParsed.data, '2026-09-29');

    const rebets = await data.channelBets.list();
    expect(rebets).toHaveLength(2);
    const reUpwork = rebets.find((b) => b.preset === 'upwork');
    const reEmail = rebets.find((b) => b.preset === 'email');
    expect(reUpwork?.hoursPerWeek).toBe(0);
    expect(reUpwork?.id).toBe(upwork?.id);
    expect(reEmail?.hoursPerWeek).toBe(6);

    expect(await data.moneyAccounts.list()).toHaveLength(4);
    expect(await data.fxRates.list()).toHaveLength(1);
  });
});
