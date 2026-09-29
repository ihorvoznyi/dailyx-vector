import { describe, expect, it } from 'vitest';

import { hoursLogged, keyStep, repliesWaiting, stageCounts, weeklyRates } from './activity';
import { DEFAULT_MATURITY_DAYS, type OutreachItem } from './stages';

describe('stageCounts', () => {
  const items: OutreachItem[] = [
    { id: 'a', channelId: 'c', sentOn: '2026-09-01', stageDates: { attention: '2026-09-02' } },
    {
      id: 'b',
      channelId: 'c',
      sentOn: '2026-09-10',
      stageDates: { attention: '2026-09-11', conversation: '2026-09-12' },
    },
    { id: 'c', channelId: 'c', sentOn: '2026-09-20', stageDates: {} },
    { id: 'd', channelId: 'c', sentOn: '2026-08-01', stageDates: { attention: '2026-08-02' } },
    { id: 'e', channelId: 'c', sentOn: '2026-09-15', stageDates: { meeting: '2026-09-20' } },
  ];
  const window = { start: '2026-09-01', end: '2026-09-30' };

  it('counts Reach through Win, a later stage implying the earlier ones', () => {
    const counts = stageCounts({ items, window });
    expect(counts.map((c) => c.value)).toEqual([4, 3, 2, 1, 0]);
    expect(counts.map((c) => c.recordIds)).toEqual([
      ['a', 'b', 'c', 'e'],
      ['a', 'b', 'e'],
      ['b', 'e'],
      ['e'],
      [],
    ]);
    for (const count of counts) {
      expect(count.denominator).toBeNull();
      expect(count.numerator).toBe(count.value);
    }
  });
});

describe('repliesWaiting', () => {
  const items = [
    { id: 'x', awaitingReplySince: '2026-09-27T12:00:00.000Z' },
    { id: 'y', awaitingReplySince: '2026-09-29T02:00:00.000Z' },
    { id: 'z', awaitingReplySince: null },
    { id: 'w', awaitingReplySince: '2026-09-28T12:00:00.000Z' },
  ];
  const now = '2026-09-29T12:00:00.000Z';

  it('counts every waiting item with no minHours', () => {
    const result = repliesWaiting({ items, now });
    expect(result.value).toBe(3);
    expect(result.recordIds).toEqual(['x', 'w', 'y']);
    expect(result.oldestHours).toBe(48);
  });

  it('includes a wait of exactly minHours', () => {
    const result = repliesWaiting({ items, now, minHours: 24 });
    expect(result.value).toBe(2);
    expect(result.recordIds).toEqual(['x', 'w']);
    expect(result.oldestHours).toBe(48);
  });

  it('returns nothing when no wait meets minHours', () => {
    const result = repliesWaiting({ items, now, minHours: 100 });
    expect(result.value).toBe(0);
    expect(result.recordIds).toEqual([]);
    expect(result.oldestHours).toBeNull();
  });

  it('throws RangeError on an unparsable timestamp', () => {
    expect(() => repliesWaiting({ items, now: 'nope' })).toThrow(RangeError);
  });
});

describe('hoursLogged', () => {
  const entries = [
    { id: 't1', date: '2026-09-28', hours: 8, channelId: 'u', incomeSourceId: null },
    { id: 't2', date: '2026-09-28', hours: 5, channelId: 'e', incomeSourceId: null },
    { id: 't3', date: '2026-09-21', hours: 8, channelId: 'u', incomeSourceId: null },
    { id: 't4', date: '2026-09-28', hours: 2.5, channelId: null, incomeSourceId: 's' },
  ];
  const window = { start: '2026-09-28', end: '2026-10-04' };

  it('sums one channel in the window', () => {
    const result = hoursLogged({ entries, window, channelId: 'u' });
    expect(result.value).toBe(8);
    expect(result.recordIds).toEqual(['t1']);
  });

  it('sums every channel entry when channelId is omitted', () => {
    const result = hoursLogged({ entries, window });
    expect(result.value).toBe(13);
    expect(result.recordIds).toEqual(['t1', 't2']);
  });

  it('adds a later entry for the same channel', () => {
    const t5 = { id: 't5', date: '2026-09-29', hours: 1.25, channelId: 'u', incomeSourceId: null };
    const result = hoursLogged({ entries: [...entries, t5], window, channelId: 'u' });
    expect(result.value).toBe(9.25);
  });
});

describe('weeklyRates', () => {
  const items: OutreachItem[] = [
    { id: 'p', channelId: 'c', sentOn: '2026-09-14', stageDates: { attention: '2026-09-15' } },
    { id: 'q', channelId: 'c', sentOn: '2026-09-16', stageDates: {} },
    { id: 'r', channelId: 'c', sentOn: '2026-09-22', stageDates: { attention: '2026-09-23' } },
    { id: 's', channelId: 'c', sentOn: '2026-09-28', stageDates: { attention: '2026-09-29' } },
  ];

  it('computes three weeks oldest first', () => {
    const result = weeklyRates({
      items,
      step: 0,
      weeks: 3,
      asOf: '2026-09-29',
      maturityDays: DEFAULT_MATURITY_DAYS,
    });
    expect(result.map((r) => r.week)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28']);

    expect(result[0]!.rate.value).toBe(0.5);
    expect(result[0]!.rate.numerator).toBe(1);
    expect(result[0]!.rate.denominator).toBe(2);
    expect(result[0]!.rate.recordIds).toEqual(['p', 'q']);

    expect(result[1]!.rate.value).toBe(1);
    expect(result[1]!.rate.numerator).toBe(1);
    expect(result[1]!.rate.denominator).toBe(1);
    expect(result[1]!.rate.recordIds).toEqual(['r']);

    expect(result[2]!.rate.value).toBeNull();
    expect(result[2]!.rate.numerator).toBe(0);
    expect(result[2]!.rate.denominator).toBe(0);
    expect(result[2]!.rate.recordIds).toEqual([]);
  });

  it('throws RangeError on an out-of-range step', () => {
    expect(() =>
      weeklyRates({
        items,
        step: 4,
        weeks: 3,
        asOf: '2026-09-29',
        maturityDays: DEFAULT_MATURITY_DAYS,
      }),
    ).toThrow(RangeError);
  });
});

describe('keyStep', () => {
  it('returns the first step touching no flagged stage', () => {
    expect(keyStep([])).toBe(0);
    expect(keyStep([1])).toBe(2);
    expect(keyStep([0])).toBe(1);
    expect(keyStep([4])).toBe(0);
    expect(keyStep([0, 1, 2, 3, 4])).toBeNull();
  });
});
