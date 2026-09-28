import { describe, expect, it } from 'vitest';

import { biggestLeak } from './leak';

/** Float matcher usable inside toEqual (the cast keeps no-unsafe-assignment quiet). */
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

const UPWORK = [112 / 180, 41 / 112, 19 / 41, 6 / 19];
const EMAIL = [1050 / 2400, 72 / 1050, 14 / 72, 2 / 14];
const LINKEDIN = [96 / 300, 31 / 96, 6 / 31, 1 / 6];
const REFERRALS = [4 / 6, 3 / 4, 2 / 3, 1 / 2];

// Unskipped by stage 11 (T22a).
describe('biggestLeak', () => {
  it('finds the biggest leak for the Upwork reference funnel', () => {
    expect(
      biggestLeak({ rates: UPWORK, baseline: [0.55, 0.33, 0.5, 0.28], flaggedStages: [] }),
    ).toEqual({
      step: 2,
      score: near(0.926829268292683),
      rate: near(19 / 41),
      baseline: 0.5,
    });
  });

  it('never picks a flagged step, so email opens are not the leak', () => {
    expect(
      biggestLeak({ rates: EMAIL, baseline: [0.44, 0.085, 0.2, 0.11], flaggedStages: [1] }),
    ).toBeNull();
  });

  it('finds the leak once the flag is removed', () => {
    expect(
      biggestLeak({ rates: EMAIL, baseline: [0.44, 0.085, 0.2, 0.11], flaggedStages: [] }),
    ).toEqual({
      step: 1,
      score: near(0.8067226890756303),
      rate: near(72 / 1050),
      baseline: 0.085,
    });
  });

  it('finds the leak for the LinkedIn reference funnel', () => {
    expect(
      biggestLeak({ rates: LINKEDIN, baseline: [0.3, 0.36, 0.2, 0.2], flaggedStages: [] }),
    ).toEqual({
      step: 3,
      score: near(0.8333333333333333),
      rate: near(1 / 6),
      baseline: 0.2,
    });
  });

  it('is null without a baseline', () => {
    expect(
      biggestLeak({ rates: REFERRALS, baseline: [null, null, null, null], flaggedStages: [] }),
    ).toBeNull();
  });

  it('is strict about the 0.97 threshold', () => {
    expect(biggestLeak({ rates: [0.97], baseline: [1], flaggedStages: [] })).toBeNull();
  });

  it('picks a score just below the threshold', () => {
    expect(biggestLeak({ rates: [0.969], baseline: [1], flaggedStages: [] })).toEqual({
      step: 0,
      score: near(0.969),
      rate: 0.969,
      baseline: 1,
    });
  });

  it('breaks a tie in favour of the earlier step', () => {
    expect(biggestLeak({ rates: [0.5, 0.5], baseline: [1, 1], flaggedStages: [] })).toEqual({
      step: 0,
      score: 0.5,
      rate: 0.5,
      baseline: 1,
    });
  });

  it('skips a step with a zero baseline', () => {
    expect(biggestLeak({ rates: [0.1, 0.5], baseline: [0, 1], flaggedStages: [] })).toEqual({
      step: 1,
      score: 0.5,
      rate: 0.5,
      baseline: 1,
    });
  });

  it('skips a step with a null rate', () => {
    expect(biggestLeak({ rates: [null, 0.5], baseline: [1, 1], flaggedStages: [] })).toEqual({
      step: 1,
      score: 0.5,
      rate: 0.5,
      baseline: 1,
    });
  });

  it('excludes both steps a flag touches', () => {
    expect(biggestLeak({ rates: [0.1, 0.9], baseline: [1, 1], flaggedStages: [1] })).toBeNull();
  });

  it('leaves an earlier step available when the flag is on a later stage', () => {
    expect(biggestLeak({ rates: [0.1, 0.9], baseline: [1, 1], flaggedStages: [2] })).toEqual({
      step: 0,
      score: near(0.1),
      rate: 0.1,
      baseline: 1,
    });
  });
});
