'use server';

import { forUser } from '@dailyx/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { todayIn } from '@/lib/dates';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';

import {
  parseAccountForm,
  parseBalanceForm,
  parseIncomeSourceForm,
  parsePaymentForm,
} from './parse';

/** Upserts the manual USD/UAH rate for the balance's date, then redirects to `returnTo`. */
export async function updateBalance(formData: FormData): Promise<never> {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);

  const rawReturnTo = formData.get('returnTo');
  const returnTo = rawReturnTo === '/review' ? '/review' : '/money';

  const accountId = formData.get('accountId');
  if (typeof accountId !== 'string') {
    redirect(`${returnTo}?error=${encodeURIComponent('Missing account')}`);
  }
  const account = await data.moneyAccounts.get(accountId);
  if (!account) redirect(`${returnTo}?error=${encodeURIComponent('Account not found')}`);

  const settings = await data.settings.get();
  const today = todayIn(settings.timezone);
  const parsed = parseBalanceForm(formData, account.currency, today);
  if (!parsed.ok) redirect(`${returnTo}?error=${encodeURIComponent(parsed.error)}`);

  const balance = parsed.data;
  await data.balanceSnapshots.create({
    accountId: balance.accountId,
    asOf: balance.asOf,
    amount: balance.amount,
    currency: account.currency,
  });

  if (balance.rateE6 !== null) {
    const existing = (await data.fxRates.list()).find(
      (r) =>
        r.date === balance.asOf && r.base === 'USD' && r.quote === 'UAH' && r.source === 'manual',
    );
    if (existing) {
      await data.fxRates.update(existing.id, { rateE6: balance.rateE6 });
    } else {
      await data.fxRates.create({
        date: balance.asOf,
        base: 'USD',
        quote: 'UAH',
        rateE6: balance.rateE6,
        source: 'manual',
      });
    }
  }

  revalidatePath('/', 'layout');
  redirect(`${balance.returnTo}?saved=balance`);
}

/** Creates or edits an account. Currency and kind are fixed after creation. */
export async function saveAccount(formData: FormData): Promise<never> {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);

  const parsed = parseAccountForm(formData);
  if (!parsed.ok) redirect(`/money?error=${encodeURIComponent(parsed.error)}#accounts`);

  if (parsed.data.id) {
    const existing = await data.moneyAccounts.get(parsed.data.id);
    if (!existing) redirect(`/money?error=${encodeURIComponent('Account not found')}#accounts`);
    await data.moneyAccounts.update(parsed.data.id, {
      name: parsed.data.name,
      isLiquid: parsed.data.isLiquid,
    });
  } else {
    await data.moneyAccounts.create({
      kind: parsed.data.kind,
      name: parsed.data.name,
      currency: parsed.data.currency,
      isLiquid: parsed.data.isLiquid,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/money?saved=account#accounts');
}

export async function addIncomeSource(formData: FormData): Promise<never> {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);

  const parsed = parseIncomeSourceForm(formData);
  if (!parsed.ok) redirect(`/money?error=${encodeURIComponent(parsed.error)}`);

  await data.incomeSources.create({
    name: parsed.data.name,
    kind: parsed.data.kind,
    channelId: null,
    platform: null,
  });

  revalidatePath('/', 'layout');
  redirect('/money?saved=income-source');
}

/** Payments added in M1 are always received. Recurring by checkbox or by income source kind. */
export async function addPayment(formData: FormData): Promise<never> {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);

  const settings = await data.settings.get();
  const today = todayIn(settings.timezone);
  const parsed = parsePaymentForm(formData, today);
  if (!parsed.ok) redirect(`/money?error=${encodeURIComponent(parsed.error)}`);

  const incomeSource = await data.incomeSources.get(parsed.data.incomeSourceId);
  if (!incomeSource) redirect(`/money?error=${encodeURIComponent('Income source not found')}`);

  const isRecurring =
    parsed.data.isRecurring || incomeSource.kind === 'retainer' || incomeSource.kind === 'product';

  await data.payments.create({
    incomeSourceId: parsed.data.incomeSourceId,
    date: parsed.data.date,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    platformFee: parsed.data.platformFee,
    taxReserved: parsed.data.taxReserved,
    certainty: 'received',
    probability: null,
    isRecurring,
  });

  revalidatePath('/', 'layout');
  redirect('/money?saved=payment');
}
