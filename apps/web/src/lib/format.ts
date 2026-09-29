import type { CurrencyCode, DateWindow, IsoDate, Money } from '@dailyx/core';
import { format } from '@dailyx/ui';

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = { USD: '$', UAH: '₴', EUR: '€' };

/** Minor units + currency, formatted with the currency's symbol and true minus. */
export function formatMoney(m: Money, decimals: 0 | 2 = 2): string {
  return format(m.amount / 100, { prefix: CURRENCY_SYMBOL[m.currency], decimals });
}

/** Minor units to major units, for `@dailyx/ui` components that take major units. */
export function toMajor(minor: number): number {
  return minor / 100;
}

export function formatPct(ratio: number | null, decimals = 0): string {
  if (ratio === null) return '—';
  return `${format(ratio * 100, { decimals })}%`;
}

export function formatMonths(months: number | null): string {
  if (months === null) return '—';
  return `${format(months, { decimals: 1 })} mo`;
}

/** 8 -> '8h'; 2.5 -> '2.5h'; 9.25 -> '9.25h'. Keeps as many decimals as the value has. */
export function formatHours(hours: number): string {
  const frac = String(hours).split('.')[1];
  return `${format(hours, { decimals: frac ? frac.length : 0 })}h`;
}

export function formatDate(date: IsoDate): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(date: IsoDate): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

export function formatWindow(w: DateWindow): string {
  return `${formatDate(w.start)} – ${formatDate(w.end)}`;
}

export function formatTimestamp(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

/** <1h -> '<1h'; <48h -> whole hours; else whole days. */
export function formatWait(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 48) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}
