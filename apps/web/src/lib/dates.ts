import { weekStart, type IsoDate } from '@dailyx/core';

/** The calendar date in `timeZone` at `now` (IANA zone). */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Monday of the week containing todayIn(timeZone, now). */
export function weekStartIn(timeZone: string, now: Date = new Date()): IsoDate {
  return weekStart(todayIn(timeZone, now));
}
