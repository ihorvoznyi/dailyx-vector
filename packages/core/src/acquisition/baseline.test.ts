import { describe, expect, it } from 'vitest';

import type { DateWindow, IsoDate } from '../dates';
import {
  DEFAULT_MATURITY_DAYS,
  type OutreachItem,
  type TimedStage,
  type UniversalStage,
} from './stages';
import { stageRates } from './stage-rates';
import { baselineRates, previousWindow } from './baseline';

/** Float matcher usable inside toEqual (the cast keeps no-unsafe-assignment quiet). */
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

const WINDOW: DateWindow = { start: '2026-07-01', end: '2026-09-28' };
const AS_OF = '2026-09-28';

/** Item k (0-based) reaches each stage while k is below that stage's count; reached stages are dated sentOn. */
function funnel(
  prefix: string,
  [reach, attention, conversation, meeting, win]: readonly [number, number, number, number, number],
  sentOn: IsoDate,
): OutreachItem[] {
  return Array.from({ length: reach }, (_, k) => ({
    id: `${prefix}-${k}`,
    channelId: 'upwork',
    sentOn,
    stageDates: {
      ...(k < attention ? { attention: sentOn } : {}),
      ...(k < conversation ? { conversation: sentOn } : {}),
      ...(k < meeting ? { meeting: sentOn } : {}),
      ...(k < win ? { win: sentOn } : {}),
    },
  }));
}
const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, k) => `${prefix}-${k}`);
const step = (
  from: UniversalStage,
  to: TimedStage,
  value: number | null,
  numerator: number,
  denominator: number,
  recordIds: string[],
) => ({ from, to, value: value === null ? null : near(value), numerator, denominator, recordIds });

// Unskipped by stage 11 (T22a).
describe('previousWindow', () => {
  it('returns the same-length window ending the day before start', () => {
    expect(previousWindow({ start: '2026-07-01', end: '2026-09-28' })).toEqual({
      start: '2026-04-02',
      end: '2026-06-30',
    });
  });

  it('handles a one-month window', () => {
    expect(previousWindow({ start: '2026-09-01', end: '2026-09-30' })).toEqual({
      start: '2026-08-02',
      end: '2026-08-31',
    });
  });

  it('handles a single-day window', () => {
    expect(previousWindow({ start: '2026-03-01', end: '2026-03-01' })).toEqual({
      start: '2026-02-28',
      end: '2026-02-28',
    });
  });

  it('handles a leap day', () => {
    expect(previousWindow({ start: '2028-03-01', end: '2028-03-01' })).toEqual({
      start: '2028-02-29',
      end: '2028-02-29',
    });
  });
});

// Unskipped by stage 11 (T22a).
describe('baselineRates', () => {
  it('reads only the previous window and splits cleanly from stageRates', () => {
    const items = [
      ...funnel('up', [180, 112, 41, 19, 6], '2026-07-15'),
      ...funnel('base', [200, 110, 36, 18, 5], '2026-05-15'),
    ];
    const input = { items, window: WINDOW, asOf: AS_OF, maturityDays: DEFAULT_MATURITY_DAYS };

    expect(baselineRates(input)).toEqual([
      step('reach', 'attention', 0.55, 110, 200, ids('base', 200)),
      step('attention', 'conversation', 36 / 110, 36, 110, ids('base', 110)),
      step('conversation', 'meeting', 0.5, 18, 36, ids('base', 36)),
      step('meeting', 'win', 5 / 18, 5, 18, ids('base', 18)),
    ]);

    expect(stageRates(input)).toEqual([
      step('reach', 'attention', 112 / 180, 112, 180, ids('up', 180)),
      step('attention', 'conversation', 41 / 112, 41, 112, ids('up', 112)),
      step('conversation', 'meeting', 19 / 41, 19, 41, ids('up', 41)),
      step('meeting', 'win', 6 / 19, 6, 19, ids('up', 19)),
    ]);
  });

  it('respects the previous window edges', () => {
    const items: OutreachItem[] = [
      {
        id: 'b-in',
        channelId: 'upwork',
        sentOn: '2026-06-30',
        stageDates: { attention: '2026-07-01' },
      },
      { id: 'b-edge', channelId: 'upwork', sentOn: '2026-04-02', stageDates: {} },
      {
        id: 'b-out',
        channelId: 'upwork',
        sentOn: '2026-04-01',
        stageDates: { attention: '2026-04-02' },
      },
    ];
    expect(
      baselineRates({ items, window: WINDOW, asOf: AS_OF, maturityDays: DEFAULT_MATURITY_DAYS }),
    ).toEqual([
      step('reach', 'attention', 0.5, 1, 2, ['b-in', 'b-edge']),
      step('attention', 'conversation', 0, 0, 1, ['b-in']),
      step('conversation', 'meeting', null, 0, 0, []),
      step('meeting', 'win', null, 0, 0, []),
    ]);
  });
});
