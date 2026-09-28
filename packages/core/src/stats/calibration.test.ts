import { describe, expect, it } from 'vitest';

import { brierScore, calibrationBins, type ScoredHypothesis } from './calibration';

/** Float matcher usable inside toEqual (the cast keeps no-unsafe-assignment quiet). */
const near = (x: number, digits = 9) => expect.closeTo(x, digits) as number;

const PRED: [number, boolean][] = [
  [0.6, true],
  [0.65, false],
  [0.55, true],
  [0.58, false],
  [0.62, true],
  [0.7, false],
  [0.72, true],
  [0.75, false],
  [0.7, true],
  [0.78, false],
  [0.8, true],
  [0.85, false],
  [0.82, true],
  [0.88, true],
  [0.9, false],
  [0.92, true],
  [0.95, true],
  [0.9, true],
];
const H: ScoredHypothesis[] = PRED.map(([confidence, ok], i) => ({
  id: `c${i + 1}`,
  confidence,
  verdict: ok ? 'supported' : 'refuted',
}));

// Unskipped by T26.
describe.skip('brierScore', () => {
  it('scores the CalibrationChart preview predictions', () => {
    expect(brierScore(H)).toEqual({
      value: near(0.2629611111111111),
      numerator: near(4.7333),
      denominator: 18,
      recordIds: [
        'c1',
        'c2',
        'c3',
        'c4',
        'c5',
        'c6',
        'c7',
        'c8',
        'c9',
        'c10',
        'c11',
        'c12',
        'c13',
        'c14',
        'c15',
        'c16',
        'c17',
        'c18',
      ],
    });
  });

  it('excludes inconclusive rows', () => {
    const withInconclusive: ScoredHypothesis[] = [
      ...H,
      { id: 'c19', confidence: 0.9, verdict: 'inconclusive' },
    ];
    expect(brierScore(withInconclusive)).toEqual(brierScore(H));
  });

  it('scores a single supported hypothesis', () => {
    expect(brierScore([{ id: 'x', confidence: 0.8, verdict: 'supported' }])).toEqual({
      value: near(0.04),
      numerator: near(0.04),
      denominator: 1,
      recordIds: ['x'],
    });
  });

  it('scores a single refuted hypothesis', () => {
    expect(brierScore([{ id: 'x', confidence: 0.8, verdict: 'refuted' }])).toEqual({
      value: near(0.64),
      numerator: near(0.64),
      denominator: 1,
      recordIds: ['x'],
    });
  });

  it('is null when nothing scored (empty list)', () => {
    expect(brierScore([])).toEqual({ value: null, numerator: 0, denominator: 0, recordIds: [] });
  });

  it('is null when only inconclusive rows remain', () => {
    expect(brierScore([{ id: 'x', confidence: 0.8, verdict: 'inconclusive' }])).toEqual({
      value: null,
      numerator: 0,
      denominator: 0,
      recordIds: [],
    });
  });
});

// Unskipped by T26.
describe.skip('calibrationBins', () => {
  it('bins the CalibrationChart preview predictions', () => {
    expect(calibrationBins(H)).toEqual([
      {
        lower: 0.5,
        upper: 0.6,
        n: 2,
        meanConfidence: near(0.565),
        hitRate: 0.5,
        recordIds: ['c3', 'c4'],
      },
      {
        lower: 0.6,
        upper: 0.7,
        n: 3,
        meanConfidence: near(0.6233333333333334),
        hitRate: near(2 / 3),
        recordIds: ['c1', 'c2', 'c5'],
      },
      {
        lower: 0.7,
        upper: 0.8,
        n: 5,
        meanConfidence: near(0.73),
        hitRate: 0.4,
        recordIds: ['c6', 'c7', 'c8', 'c9', 'c10'],
      },
      {
        lower: 0.8,
        upper: 0.9,
        n: 4,
        meanConfidence: near(0.8375),
        hitRate: 0.75,
        recordIds: ['c11', 'c12', 'c13', 'c14'],
      },
      {
        lower: 0.9,
        upper: 1,
        n: 4,
        meanConfidence: near(0.9175),
        hitRate: 0.75,
        recordIds: ['c15', 'c16', 'c17', 'c18'],
      },
    ]);
  });

  it('assigns each bin boundary value to the upper bin', () => {
    const boundaries: ScoredHypothesis[] = [
      { id: 'b60', confidence: 0.6, verdict: 'supported' },
      { id: 'b70', confidence: 0.7, verdict: 'supported' },
      { id: 'b80', confidence: 0.8, verdict: 'supported' },
      { id: 'b90', confidence: 0.9, verdict: 'supported' },
    ];
    const bins = calibrationBins(boundaries);
    expect(bins[0]?.recordIds).toEqual([]);
    expect(bins[1]?.recordIds).toEqual(['b60']);
    expect(bins[2]?.recordIds).toEqual(['b70']);
    expect(bins[3]?.recordIds).toEqual(['b80']);
    expect(bins[4]?.recordIds).toEqual(['b90']);
  });

  it('always returns five bins, empty ones with n: 0 and nulls', () => {
    expect(calibrationBins([])).toEqual([
      { lower: 0.5, upper: 0.6, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.6, upper: 0.7, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.7, upper: 0.8, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.8, upper: 0.9, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.9, upper: 1, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
    ]);
  });

  it('clamps confidence below 0.5 into the lowest bin, and includes 1 in the top bin', () => {
    const clamped: ScoredHypothesis[] = [
      { id: 'lo', confidence: 0.4, verdict: 'supported' },
      { id: 'top', confidence: 1, verdict: 'refuted' },
    ];
    const bins = calibrationBins(clamped);
    expect(bins).toEqual([
      { lower: 0.5, upper: 0.6, n: 1, meanConfidence: 0.5, hitRate: 1, recordIds: ['lo'] },
      { lower: 0.6, upper: 0.7, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.7, upper: 0.8, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.8, upper: 0.9, n: 0, meanConfidence: null, hitRate: null, recordIds: [] },
      { lower: 0.9, upper: 1, n: 1, meanConfidence: 1, hitRate: 0, recordIds: ['top'] },
    ]);
  });

  it('excludes inconclusive rows from bins', () => {
    const withInconclusive: ScoredHypothesis[] = [
      ...H,
      { id: 'c19', confidence: 0.9, verdict: 'inconclusive' },
    ];
    expect(calibrationBins(withInconclusive)).toEqual(calibrationBins(H));
  });
});
