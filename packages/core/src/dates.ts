/** A calendar date in UTC, `YYYY-MM-DD`. */
export type IsoDate = string;

/** A run of calendar days, inclusive at both ends. */
export interface DateWindow {
  readonly start: IsoDate;
  readonly end: IsoDate;
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight UTC of `date`, in epoch ms. Throws RangeError unless it is a real `YYYY-MM-DD` day. */
function utcMs(date: IsoDate): number {
  const ms = ISO_DATE.test(date) ? Date.parse(date) : Number.NaN;
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Not a calendar date (YYYY-MM-DD): ${date}`);
  }
  return ms;
}

/** `date` moved by a whole number of days; negative moves back. */
export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isInteger(days)) throw new RangeError(`days must be an integer, got ${days}`);
  return new Date(utcMs(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return (utcMs(to) - utcMs(from)) / DAY_MS;
}

/** The Monday on or before `date`. Throws RangeError unless `date` is a real `YYYY-MM-DD` day. */
export function weekStart(date: IsoDate): IsoDate {
  const dayOfWeek = new Date(utcMs(date)).getUTCDay();
  return addDays(date, -((dayOfWeek + 6) % 7));
}
