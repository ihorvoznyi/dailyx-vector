import type { CurrencyCode, IsoDate } from '@dailyx/core';
import { CURRENCIES, type IncomeSourceKind, type MoneyAccountKind } from '@dailyx/db';
import { z } from 'zod';

import { hundredths, rateE6 } from '../../../lib/amount';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const MONEY_ACCOUNT_KINDS = [
  'bank',
  'broker',
  'wallet',
  'cash',
] as const satisfies readonly MoneyAccountKind[];
export const INCOME_SOURCE_KINDS = [
  'project',
  'retainer',
  'hourly',
  'product',
  'lead',
] as const satisfies readonly IncomeSourceKind[];

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

function firstIssue<T>(
  result: { success: true; data: T } | { success: false; error: z.ZodError },
): ParseResult<T> {
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  return { ok: false, error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid form' };
}

/** Blank string parses to `whenBlank`; otherwise validated (and transformed) by `hundredths`. */
function blankableHundredths<T>(whenBlank: T) {
  return z
    .string()
    .optional()
    .transform((v) => v ?? '')
    .pipe(z.union([z.literal(''), hundredths]))
    .transform((v): number | T => (v === '' ? whenBlank : v));
}

export interface BalanceFormData {
  accountId: string;
  amount: number;
  asOf: IsoDate;
  rateE6: number | null;
  returnTo: '/money' | '/review';
}

export function parseBalanceForm(
  fd: FormData,
  currency: CurrencyCode,
  today: IsoDate,
): ParseResult<BalanceFormData> {
  const schema = z.object({
    accountId: z.string().uuid(),
    amount: hundredths,
    asOf: z
      .string()
      .regex(DATE_RE, 'Enter a valid date')
      .optional()
      .transform((v) => v ?? today)
      .refine((d) => d <= today, 'asOf cannot be in the future'),
    rate: currency === 'UAH' ? rateE6 : z.string().optional(),
    returnTo: z.enum(['/money', '/review']).optional().default('/money'),
  });
  const result = firstIssue(schema.safeParse(Object.fromEntries(fd)));
  if (!result.ok) return result;
  const { accountId, amount, asOf, returnTo } = result.data;
  return {
    ok: true,
    data: {
      accountId,
      amount,
      asOf,
      rateE6: currency === 'UAH' ? (result.data.rate as number) : null,
      returnTo,
    },
  };
}

export interface PaymentFormData {
  incomeSourceId: string;
  date: IsoDate;
  amount: number;
  currency: CurrencyCode;
  platformFee: number;
  taxReserved: number | null;
  isRecurring: boolean;
}

export function parsePaymentForm(fd: FormData, today: IsoDate): ParseResult<PaymentFormData> {
  const schema = z
    .object({
      incomeSourceId: z.string().uuid(),
      date: z
        .string()
        .regex(DATE_RE, 'Enter a valid date')
        .optional()
        .transform((v) => v ?? today),
      amount: hundredths,
      currency: z.enum(CURRENCIES),
      platformFee: blankableHundredths(0),
      taxReserved: blankableHundredths<null>(null),
      recurring: z
        .string()
        .optional()
        .transform((v) => v === 'on'),
    })
    .transform(({ recurring, ...rest }) => ({ ...rest, isRecurring: recurring }));
  const result = firstIssue(schema.safeParse(Object.fromEntries(fd)));
  return result;
}

export interface AccountFormData {
  id: string | null;
  name: string;
  kind: MoneyAccountKind;
  currency: CurrencyCode;
  isLiquid: boolean;
}

export function parseAccountForm(fd: FormData): ParseResult<AccountFormData> {
  const schema = z.object({
    id: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    name: z.string().trim().min(1, 'Name is required').max(60, 'Name is at most 60 characters'),
    kind: z.enum(MONEY_ACCOUNT_KINDS),
    currency: z.enum(CURRENCIES),
    isLiquid: z
      .string()
      .optional()
      .transform((v) => v === 'on'),
  });
  return firstIssue(schema.safeParse(Object.fromEntries(fd)));
}

export interface IncomeSourceFormData {
  name: string;
  kind: IncomeSourceKind;
}

export function parseIncomeSourceForm(fd: FormData): ParseResult<IncomeSourceFormData> {
  const schema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(60, 'Name is at most 60 characters'),
    kind: z.enum(INCOME_SOURCE_KINDS),
  });
  return firstIssue(schema.safeParse(Object.fromEntries(fd)));
}
