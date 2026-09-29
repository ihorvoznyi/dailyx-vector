import { daysBetween, type IsoDate } from '@dailyx/core';

export const STALE_AFTER_DAYS = 7;

/** Whole days from `asOf` to `today`, never negative. */
export function ageDays(asOf: IsoDate, today: IsoDate): number {
  return Math.max(0, daysBetween(asOf, today));
}

/** No snapshot (`null`) counts as stale; otherwise stale past `STALE_AFTER_DAYS`. */
export function isStale(asOf: IsoDate | null, today: IsoDate): boolean {
  if (asOf === null) return true;
  return ageDays(asOf, today) > STALE_AFTER_DAYS;
}

export function updatedAgo(asOf: IsoDate, today: IsoDate): string {
  const age = ageDays(asOf, today);
  if (age === 0) return 'today';
  if (age === 1) return 'yesterday';
  return `${age} days ago`;
}

export function sourceLine(asOf: IsoDate | null, today: IsoDate): string {
  if (asOf === null) return 'Manual · no balance yet';
  return `Manual · updated ${updatedAgo(asOf, today)}`;
}
