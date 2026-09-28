import { describe, expect, it } from 'vitest';

import type { DateWindow, IsoDate } from '../dates';
import {
  DEFAULT_MATURITY_DAYS,
  type OutreachItem,
  type TimedStage,
  type UniversalStage,
} from './stages';
import { stageRates } from './stage-rates';

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
describe('stageRates', () => {
  it('computes the four universal steps for the Upwork reference funnel', () => {
    expect(
      stageRates({
        items: funnel('up', [180, 112, 41, 19, 6], '2026-07-15'),
        window: WINDOW,
        asOf: AS_OF,
        maturityDays: DEFAULT_MATURITY_DAYS,
      }),
    ).toEqual([
      step('reach', 'attention', 112 / 180, 112, 180, ids('up', 180)),
      step('attention', 'conversation', 41 / 112, 41, 112, ids('up', 112)),
      step('conversation', 'meeting', 19 / 41, 19, 41, ids('up', 41)),
      step('meeting', 'win', 6 / 19, 6, 19, ids('up', 19)),
    ]);
  });

  it('applies maturity, the window and the at-least boundary', () => {
    const items: OutreachItem[] = [
      {
        id: 'm0',
        channelId: 'upwork',
        sentOn: '2026-06-30',
        stageDates: {
          attention: '2026-06-30',
          conversation: '2026-07-01',
          meeting: '2026-07-02',
          win: '2026-07-03',
        },
      },
      {
        id: 'm1',
        channelId: 'upwork',
        sentOn: '2026-09-25',
        stageDates: { attention: '2026-09-26' },
      },
      {
        id: 'm2',
        channelId: 'upwork',
        sentOn: '2026-09-21',
        stageDates: { attention: '2026-09-22' },
      },
      {
        id: 'm3',
        channelId: 'upwork',
        sentOn: '2026-09-07',
        stageDates: { attention: '2026-09-08', conversation: '2026-09-09', meeting: '2026-09-15' },
      },
      {
        id: 'm4',
        channelId: 'upwork',
        sentOn: '2026-08-14',
        stageDates: {
          attention: '2026-08-15',
          conversation: '2026-08-16',
          meeting: '2026-08-20',
          win: '2026-09-01',
        },
      },
      {
        id: 'm5',
        channelId: 'upwork',
        sentOn: '2026-08-15',
        stageDates: { attention: '2026-08-16', conversation: '2026-08-17', meeting: '2026-08-25' },
      },
      { id: 'm6', channelId: 'upwork', sentOn: '2026-09-01', stageDates: {} },
      {
        id: 'm7',
        channelId: 'upwork',
        sentOn: '2026-09-06',
        stageDates: { attention: '2026-09-07', conversation: '2026-09-08' },
      },
    ];
    expect(
      stageRates({ items, window: WINDOW, asOf: AS_OF, maturityDays: DEFAULT_MATURITY_DAYS }),
    ).toEqual([
      step('reach', 'attention', 5 / 6, 5, 6, ['m2', 'm3', 'm4', 'm5', 'm6', 'm7']),
      step('attention', 'conversation', 0.8, 4, 5, ['m2', 'm3', 'm4', 'm5', 'm7']),
      step('conversation', 'meeting', 0.75, 3, 4, ['m3', 'm4', 'm5', 'm7']),
      step('meeting', 'win', 1, 1, 1, ['m4']),
    ]);
  });

  it('lets a later stage imply the earlier ones', () => {
    const items: OutreachItem[] = [
      { id: 's1', channelId: 'upwork', sentOn: '2026-07-15', stageDates: { win: '2026-08-20' } },
      { id: 's2', channelId: 'upwork', sentOn: '2026-07-15', stageDates: {} },
    ];
    expect(
      stageRates({ items, window: WINDOW, asOf: AS_OF, maturityDays: DEFAULT_MATURITY_DAYS }),
    ).toEqual([
      step('reach', 'attention', 0.5, 1, 2, ['s1', 's2']),
      step('attention', 'conversation', 1, 1, 1, ['s1']),
      step('conversation', 'meeting', 1, 1, 1, ['s1']),
      step('meeting', 'win', 1, 1, 1, ['s1']),
    ]);
  });

  it('returns four null steps with no items', () => {
    expect(
      stageRates({ items: [], window: WINDOW, asOf: AS_OF, maturityDays: DEFAULT_MATURITY_DAYS }),
    ).toEqual([
      step('reach', 'attention', null, 0, 0, []),
      step('attention', 'conversation', null, 0, 0, []),
      step('conversation', 'meeting', null, 0, 0, []),
      step('meeting', 'win', null, 0, 0, []),
    ]);
  });

  it('applies maturity per channel, not the defaults', () => {
    const items: OutreachItem[] = [
      {
        id: 'm1',
        channelId: 'upwork',
        sentOn: '2026-09-25',
        stageDates: { attention: '2026-09-26' },
      },
    ];
    expect(
      stageRates({
        items,
        window: WINDOW,
        asOf: AS_OF,
        maturityDays: { attention: 3, conversation: 3, meeting: 3, win: 3 },
      }),
    ).toEqual([
      step('reach', 'attention', 1, 1, 1, ['m1']),
      step('attention', 'conversation', 0, 0, 1, ['m1']),
      step('conversation', 'meeting', null, 0, 0, []),
      step('meeting', 'win', null, 0, 0, []),
    ]);
    expect(
      stageRates({ items, window: WINDOW, asOf: AS_OF, maturityDays: DEFAULT_MATURITY_DAYS }),
    ).toEqual([
      step('reach', 'attention', null, 0, 0, []),
      step('attention', 'conversation', null, 0, 0, []),
      step('conversation', 'meeting', null, 0, 0, []),
      step('meeting', 'win', null, 0, 0, []),
    ]);
  });
});
