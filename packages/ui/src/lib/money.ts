import { format, type NumberFormat } from './format';

/** Dollars the Vector way: `$` prefix, no decimals unless asked. */
export const money = (v: number | null | undefined, o: NumberFormat = {}): string =>
  format(v, { prefix: '$', ...o });

/** An hourly rate such as `$78/h`; an em dash when unknown. */
export const perHour = (v: number | null | undefined): string =>
  v == null ? '—' : `${money(v)}/h`;
