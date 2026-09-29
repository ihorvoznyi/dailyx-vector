import { type CurrencyCode } from '@dailyx/core';
import { CURRENCIES, type ChannelPresetId, type MoneyAccountKind } from '@dailyx/db';
import { z } from 'zod';

import { hundredths, rateE6 } from '../../lib/amount';
import { isPresetId, PRESET_ORDER } from '../../server/channels';

export const SETUP_ACCOUNTS = [
  { key: 'monobank', name: 'Monobank', kind: 'bank', currency: 'UAH' },
  { key: 'ibkr', name: 'IBKR', kind: 'broker', currency: 'USD' },
  { key: 'paypal', name: 'PayPal', kind: 'wallet', currency: 'USD' },
  { key: 'payoneer', name: 'Payoneer', kind: 'wallet', currency: 'USD' },
] as const satisfies readonly {
  key: string;
  name: string;
  kind: MoneyAccountKind;
  currency: CurrencyCode;
}[];

export interface SetupData {
  /** In PRESET_ORDER order. */
  bets: { preset: ChannelPresetId; hoursPerWeek: number; sentPerWeek: number | null }[];
  settings: { monthlyCost: number; monthlyCostCurrency: CurrencyCode; taxRateBps: number };
  /** Present only when the form carried withAccounts=1 (the user has no accounts yet). */
  accounts:
    { key: (typeof SETUP_ACCOUNTS)[number]['key']; balance: number; isLiquid: boolean }[] | null;
  /** UAH per USD × 1e6, required with accounts. */
  uahRateE6: number | null;
}

export type ParseResult = { ok: true; data: SetupData } | { ok: false; error: string };

const hoursSchema = z.coerce.number().int('Hours must be a whole number').min(1).max(40);
const sentPerWeekSchema = z.coerce
  .number()
  .int('Sent per week must be a whole number')
  .min(0)
  .max(10_000);
const currencySchema = z.enum(CURRENCIES);
const taxRateSchema = hundredths.refine((bps) => bps <= 10_000, 'Tax rate is at most 100%');

function fail(field: string, message: string): ParseResult {
  return { ok: false, error: `${field}: ${message}` };
}

export function parseSetupForm(formData: FormData): ParseResult {
  const betsRaw = formData.get('bets');
  if (typeof betsRaw !== 'string') return fail('bets', 'Pick at least one channel');

  let betsJson: unknown;
  try {
    betsJson = JSON.parse(betsRaw);
  } catch {
    return fail('bets', 'Invalid channel selection');
  }
  if (typeof betsJson !== 'object' || betsJson === null || Array.isArray(betsJson)) {
    return fail('bets', 'Pick at least one channel');
  }
  const betsEntries = betsJson as Record<string, unknown>;
  const betKeys = Object.keys(betsEntries);
  if (betKeys.length === 0) return fail('bets', 'Pick at least one channel');
  for (const key of betKeys) {
    if (!isPresetId(key)) return fail('bets', `Unknown channel "${key}"`);
  }

  const bets: SetupData['bets'] = [];
  for (const preset of PRESET_ORDER) {
    if (!(preset in betsEntries)) continue;
    const hours = hoursSchema.safeParse(betsEntries[preset]);
    if (!hours.success) return fail('bets', `${preset}: hours must be a whole number 1..40`);
    const sentRaw = formData.get(`sentPerWeek.${preset}`);
    let sentPerWeek: number | null = null;
    if (typeof sentRaw === 'string' && sentRaw.trim() !== '') {
      const sent = sentPerWeekSchema.safeParse(sentRaw);
      if (!sent.success) {
        return fail(`sentPerWeek.${preset}`, 'Use a whole number 0..10000');
      }
      sentPerWeek = sent.data;
    }
    bets.push({ preset, hoursPerWeek: hours.data, sentPerWeek });
  }

  const monthlyCost = hundredths.safeParse(formData.get('monthlyCost'));
  if (!monthlyCost.success) {
    return fail('monthlyCost', monthlyCost.error.issues[0]?.message ?? 'Invalid monthly cost');
  }
  const monthlyCostCurrency = currencySchema.safeParse(formData.get('monthlyCostCurrency'));
  if (!monthlyCostCurrency.success) return fail('monthlyCostCurrency', 'Unknown currency');
  const taxRate = taxRateSchema.safeParse(formData.get('taxRate'));
  if (!taxRate.success) {
    return fail('taxRate', taxRate.error.issues[0]?.message ?? 'Invalid tax rate');
  }

  const withAccounts = formData.get('withAccounts') === '1';
  let accounts: SetupData['accounts'] = null;
  let uahRateE6: number | null = null;
  if (withAccounts) {
    const parsedAccounts: NonNullable<SetupData['accounts']> = [];
    for (const spec of SETUP_ACCOUNTS) {
      const balance = hundredths.safeParse(formData.get(`account.${spec.key}.balance`));
      if (!balance.success) {
        return fail(
          `account.${spec.key}.balance`,
          balance.error.issues[0]?.message ?? 'Invalid balance',
        );
      }
      const isLiquid = formData.get(`account.${spec.key}.liquid`) === 'on';
      parsedAccounts.push({ key: spec.key, balance: balance.data, isLiquid });
    }
    const uahParsed = rateE6.safeParse(formData.get('uahRate'));
    if (!uahParsed.success) {
      return fail('uahRate', uahParsed.error.issues[0]?.message ?? 'Invalid rate');
    }
    accounts = parsedAccounts;
    uahRateE6 = uahParsed.data;
  }

  return {
    ok: true,
    data: {
      bets,
      settings: {
        monthlyCost: monthlyCost.data,
        monthlyCostCurrency: monthlyCostCurrency.data,
        taxRateBps: taxRate.data,
      },
      accounts,
      uahRateE6,
    },
  };
}
