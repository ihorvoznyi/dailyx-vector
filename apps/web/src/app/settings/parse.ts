import { CURRENCIES, type Settings } from '@dailyx/db';
import { z } from 'zod';

/** '3800' → 380000, '19.99' → 1999, '0.5' → 50. Exact: no float multiply. */
export function toHundredths(value: string): number {
  const [whole = '0', frac = ''] = value.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

/** 380000 → '3800.00', 1999 → '19.99', 50 → '0.50'. For defaultValue in the form. */
export function fromHundredths(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false; // RangeError = unknown zone; this is the check, not a swallowed error
  }
}

const hundredths = z
  .string()
  .trim()
  .regex(/^\d{1,11}(\.\d{1,2})?$/, 'Use a positive number with at most 2 decimals')
  .transform(toHundredths);

const form = z
  .object({
    baseCurrency: z.enum(CURRENCIES),
    monthlyCost: hundredths,
    monthlyCostCurrency: z.enum(CURRENCIES),
    taxRate: hundredths.refine((bps) => bps <= 10_000, 'Tax rate is at most 100%'),
    baselineRate: hundredths,
    targetHours: z.coerce.number().int('Target hours must be a whole number').min(0).max(168),
    horizonMonths: z.coerce.number().int('Horizon must be whole months').min(1).max(120),
    timezone: z.string().refine(isTimeZone, 'Unknown timezone'),
  })
  .transform(({ taxRate, ...rest }): Settings => ({ ...rest, taxRateBps: taxRate }));

export type ParseResult = { ok: true; data: Settings } | { ok: false; error: string };

export function parseSettingsForm(formData: FormData): ParseResult {
  const result = form.safeParse(Object.fromEntries(formData));
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  return {
    ok: false,
    error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid settings',
  };
}
