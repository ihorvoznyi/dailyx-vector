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

export const hundredths = z
  .string()
  .trim()
  .regex(/^\d{1,11}(\.\d{1,2})?$/, 'Use a positive number with at most 2 decimals')
  .transform(toHundredths);

/** '41.3' → 41_300_000; exact, up to 6 decimals. */
export function toMicros(value: string): number {
  const [whole = '0', frac = ''] = value.split('.');
  return Number(whole) * 1_000_000 + Number(frac.padEnd(6, '0'));
}

/** 41_300_000 → '41.3'; 41_305_000 → '41.305' (for defaultValue and labels). */
export function fromMicros(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 1_000_000);
  const frac = String(abs % 1_000_000)
    .padStart(6, '0')
    .replace(/0+$/, '');
  return frac ? `${sign}${whole}.${frac}` : `${sign}${whole}`;
}

/** A positive rate with at most 6 decimals, transformed to `rateE6` (micros). */
export const rateE6 = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,6})?$/, 'Use a positive number with at most 6 decimals')
  .transform(toMicros)
  .refine((v) => v > 0, 'Rate must be above 0');
