/** Chart series colours in order; series 1 is always the metric the card is about. Max five. */
export const SERIES = [
  'var(--color-series-1)',
  'var(--color-series-2)',
  'var(--color-series-3)',
  'var(--color-series-4)',
  'var(--color-series-5)',
] as const;

/** The series colour for position `i`, wrapping after five. */
export const seriesColor = (i: number): string => SERIES[i % SERIES.length]!;
