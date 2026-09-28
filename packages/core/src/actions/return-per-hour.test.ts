import { describe, expect, it } from 'vitest';
import type { Money } from '../money/money';
import type { Action, RankedAction, RankOptions } from './return-per-hour';
import { actionReturnPerHour, rankActions } from './return-per-hour';

const usd = (cents: number): Money => ({ amount: cents, currency: 'USD' });

const act = (
  id: string,
  dollars: number,
  probability: number | null,
  isRecurring: boolean,
  hours: number,
  done = false,
): Action => ({ id, amount: usd(dollars * 100), probability, isRecurring, hours, done });

const A1 = act('a1', 1300, 1, false, 0.17); // Invoice Kite
const A2 = act('a2', 6000, 0.3, false, 0.5); // Follow up Orbit
const A3 = act('a3', 800, 0.5, true, 2); // Lumen add-on, recurring
const A4 = act('a4', 3500, 0.95, false, 12); // Ship milestone 2
const A5 = act('a5', 120, 0.6, true, 6); // Workflow Kit templates, recurring
const A6 = act('a6', 650, 1, false, 10); // Extra Kite hours
const A7 = act('a7', 300, 0.3, false, 14); // Redesign site
const OPTS: RankOptions = { horizonMonths: 12, baselineRate: usd(6_500) };

// Unskipped by T24.
describe.skip('actionReturnPerHour', () => {
  it('A1: Invoice Kite', () => {
    expect(actionReturnPerHour(A1, 12)).toEqual({
      value: usd(764_706),
      numerator: usd(130_000),
      denominator: 0.17,
      recordIds: ['a1'],
    });
  });

  it('A2: Follow up Orbit', () => {
    expect(actionReturnPerHour(A2, 12)).toEqual({
      value: usd(360_000),
      numerator: usd(180_000),
      denominator: 0.5,
      recordIds: ['a2'],
    });
  });

  it('A3: Lumen add-on, recurring', () => {
    expect(actionReturnPerHour(A3, 12)).toEqual({
      value: usd(240_000),
      numerator: usd(480_000),
      denominator: 2,
      recordIds: ['a3'],
    });
  });

  it('A4: Ship milestone 2', () => {
    expect(actionReturnPerHour(A4, 12)).toEqual({
      value: usd(27_708),
      numerator: usd(332_500),
      denominator: 12,
      recordIds: ['a4'],
    });
  });

  it('A5: Workflow Kit templates, recurring', () => {
    expect(actionReturnPerHour(A5, 12)).toEqual({
      value: usd(14_400),
      numerator: usd(86_400),
      denominator: 6,
      recordIds: ['a5'],
    });
  });

  it('A6: Extra Kite hours', () => {
    expect(actionReturnPerHour(A6, 12)).toEqual({
      value: usd(6_500),
      numerator: usd(65_000),
      denominator: 10,
      recordIds: ['a6'],
    });
  });

  it('A7: Redesign site', () => {
    expect(actionReturnPerHour(A7, 12)).toEqual({
      value: usd(643),
      numerator: usd(9_000),
      denominator: 14,
      recordIds: ['a7'],
    });
  });

  it('null probability means certain', () => {
    const a1n = act('a1n', 1300, null, false, 0.17);
    expect(actionReturnPerHour(a1n, 12)).toEqual({
      value: usd(764_706),
      numerator: usd(130_000),
      denominator: 0.17,
      recordIds: ['a1n'],
    });
  });

  it('zero hours give a null value', () => {
    const z = act('z', 1000, 0.5, false, 0);
    expect(actionReturnPerHour(z, 12)).toEqual({
      value: null,
      numerator: usd(50_000),
      denominator: 0,
      recordIds: ['z'],
    });
  });

  it('horizon counts only for recurring actions', () => {
    expect(actionReturnPerHour(A3, 6)).toEqual({
      value: usd(120_000),
      numerator: usd(240_000),
      denominator: 2,
      recordIds: ['a3'],
    });
    expect(actionReturnPerHour(A1, 6)).toEqual({
      value: usd(764_706),
      numerator: usd(130_000),
      denominator: 0.17,
      recordIds: ['a1'],
    });
  });

  it('rounds the expected value half away from zero', () => {
    const h = act('h', 0.25, 0.5, false, 1);
    expect(actionReturnPerHour(h, 12)).toEqual({
      value: usd(13),
      numerator: usd(13),
      denominator: 1,
      recordIds: ['h'],
    });
  });
});

// Unskipped by T24.
describe.skip('rankActions', () => {
  it('ranks by return per hour, highest first, and flags below baseline', () => {
    const shuffled = [A7, A4, A1, A6, A3, A2, A5];
    const ranked = rankActions(shuffled, OPTS);

    expect(ranked.map((r) => r.action.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']);

    const belowBaselineById: Record<string, boolean> = {};
    for (const r of ranked) {
      belowBaselineById[r.action.id] = r.belowBaseline;
    }
    expect(belowBaselineById).toEqual({
      a1: false,
      a2: false,
      a3: false,
      a4: false,
      a5: false,
      a6: false,
      a7: true,
    });

    const table: Record<string, RankedAction['metric']> = {
      a1: {
        value: usd(764_706),
        numerator: usd(130_000),
        denominator: 0.17,
        recordIds: ['a1'],
      },
      a2: { value: usd(360_000), numerator: usd(180_000), denominator: 0.5, recordIds: ['a2'] },
      a3: { value: usd(240_000), numerator: usd(480_000), denominator: 2, recordIds: ['a3'] },
      a4: { value: usd(27_708), numerator: usd(332_500), denominator: 12, recordIds: ['a4'] },
      a5: { value: usd(14_400), numerator: usd(86_400), denominator: 6, recordIds: ['a5'] },
      a6: { value: usd(6_500), numerator: usd(65_000), denominator: 10, recordIds: ['a6'] },
      a7: { value: usd(643), numerator: usd(9_000), denominator: 14, recordIds: ['a7'] },
    };
    for (const r of ranked) {
      expect(r.metric).toEqual(table[r.action.id]);
    }
  });

  it('sinks done actions below open ones', () => {
    const ranked = rankActions([{ ...A1, done: true }, A2, A7], OPTS);
    expect(ranked.map((r) => r.action.id)).toEqual(['a2', 'a7', 'a1']);
  });

  it('ranks a null return last in its group, and it is not below baseline', () => {
    const z = act('z', 1000, 0.5, false, 0);
    const ranked = rankActions([z, A7, A2], OPTS);
    expect(ranked.map((r) => r.action.id)).toEqual(['a2', 'a7', 'z']);
    const zRanked = ranked.find((r) => r.action.id === 'z');
    expect(zRanked?.belowBaseline).toBe(false);
  });

  it('keeps input order on ties', () => {
    const t1 = act('t1', 650, 1, false, 10);
    const t2 = act('t2', 650, 1, false, 10);
    expect(rankActions([t1, t2], OPTS).map((r) => r.action.id)).toEqual(['t1', 't2']);
    expect(rankActions([t2, t1], OPTS).map((r) => r.action.id)).toEqual(['t2', 't1']);
  });

  it('returns an empty array for empty input', () => {
    expect(rankActions([], OPTS)).toEqual([]);
  });
});
