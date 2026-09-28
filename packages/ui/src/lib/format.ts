/** Options of the design system's number formatter (`NumberFormat` in the Vector index.d.ts). */
export interface NumberFormat {
  prefix?: string;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
}

/**
 * Formats a number the Vector way: en-US grouping, a true minus sign (−) before the prefix,
 * and compact units (K from 10,000, M, B) with one decimal. `null`, `undefined` and NaN
 * render as an em dash.
 */
export function format(v: number | null | undefined, o: NumberFormat = {}): string {
  if (v == null || Number.isNaN(v)) return '—';
  const d = o.decimals ?? 0;
  let s: string;
  if (o.compact) {
    const a = Math.abs(v);
    let u = '';
    if (a >= 1e9) {
      v = v / 1e9;
      u = 'B';
    } else if (a >= 1e6) {
      v = v / 1e6;
      u = 'M';
    } else if (a >= 1e4) {
      v = v / 1e3;
      u = 'K';
    }
    const digits = u ? 1 : d;
    s =
      v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) +
      u;
  } else {
    s = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  const prefix = o.prefix ?? '';
  const suffix = o.suffix ?? '';
  if (s.startsWith('-')) return `−${prefix}${s.slice(1)}${suffix}`;
  return `${prefix}${s}${suffix}`;
}
