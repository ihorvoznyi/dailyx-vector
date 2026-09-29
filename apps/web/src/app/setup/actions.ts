'use server';

import { type IsoDate } from '@dailyx/core';
import { forUser, type UserData } from '@dailyx/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { todayIn } from '../../lib/dates';
import { requireUser } from '../../server/auth';
import { presetOf } from '../../server/channels';
import { getDb } from '../../server/db';

import { parseSetupForm, SETUP_ACCOUNTS, type SetupData } from './parse';

/** `caps` with `sentPerWeek` set, or removed when `sentPerWeek` is null. Other keys are kept. */
function withSent(
  caps: Record<string, number>,
  sentPerWeek: number | null,
): Record<string, number> {
  const next = { ...caps };
  if (sentPerWeek === null) delete next.sentPerWeek;
  else next.sentPerWeek = sentPerWeek;
  return next;
}

/** DB-injectable write path, so `setup.test.ts` can test it without Next. */
export async function applySetup(data: UserData, parsed: SetupData, today: IsoDate): Promise<void> {
  await data.settings.update(parsed.settings);

  const existingBets = await data.channelBets.list();
  const pickedPresets = new Set(parsed.bets.map((bet) => bet.preset));

  for (const bet of parsed.bets) {
    const existing = existingBets.find((row) => row.preset === bet.preset);
    if (existing) {
      await data.channelBets.update(existing.id, {
        hoursPerWeek: bet.hoursPerWeek,
        caps: withSent(existing.caps, bet.sentPerWeek),
      });
    } else {
      await data.channelBets.create({
        preset: bet.preset,
        name: presetOf(bet.preset).name,
        hoursPerWeek: bet.hoursPerWeek,
        startedOn: today,
        caps: bet.sentPerWeek === null ? {} : { sentPerWeek: bet.sentPerWeek },
      });
    }
  }

  const unpicked = existingBets.filter(
    (row) => !pickedPresets.has(row.preset) && row.hoursPerWeek > 0,
  );
  for (const row of unpicked) {
    await data.channelBets.update(row.id, { hoursPerWeek: 0 });
  }

  if (parsed.accounts) {
    const existingAccounts = await data.moneyAccounts.list();
    if (existingAccounts.length === 0) {
      const accountsByKey = new Map(parsed.accounts.map((a) => [a.key, a]));
      const specs = SETUP_ACCOUNTS.map((spec) => {
        const entered = accountsByKey.get(spec.key);
        return { spec, balance: entered?.balance ?? 0, isLiquid: entered?.isLiquid ?? true };
      });
      const accounts = await data.moneyAccounts.createMany(
        specs.map(({ spec, isLiquid }) => ({
          kind: spec.kind,
          name: spec.name,
          currency: spec.currency,
          isLiquid,
        })),
      );
      await data.balanceSnapshots.createMany(
        specs.map(({ balance }, i) => ({
          accountId: accounts[i]!.id,
          asOf: today,
          amount: balance,
          currency: accounts[i]!.currency,
        })),
      );
      if (parsed.uahRateE6 !== null) {
        await data.fxRates.create({
          date: today,
          base: 'USD',
          quote: 'UAH',
          rateE6: parsed.uahRateE6,
          source: 'manual',
        });
      }
    }
  }
}

export async function saveSetup(formData: FormData): Promise<never> {
  const user = await requireUser();
  const parsed = parseSetupForm(formData);
  if (!parsed.ok) redirect(`/setup?error=${encodeURIComponent(parsed.error)}`);

  const data = forUser(getDb(), user.id);
  const settings = await data.settings.get();
  const today = todayIn(settings.timezone);
  await applySetup(data, parsed.data, today);

  revalidatePath('/', 'layout');
  redirect('/');
}
