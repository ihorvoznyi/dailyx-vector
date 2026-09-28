/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T26 */
import type { Metric } from '../result';
import type { ExperimentVerdict } from './verdict';

export interface ScoredHypothesis {
  readonly id: string;
  /** 0.5–1: how sure I said I was that it would be supported. */
  readonly confidence: number;
  readonly verdict: ExperimentVerdict;
}

/**
 * Mean of (confidence − outcome)², outcome 1 when supported and 0 when refuted. Inconclusive
 * hypotheses are excluded. value is null when none remain. numerator: the sum of squares;
 * denominator: the count.
 */
export function brierScore(
  hypotheses: readonly ScoredHypothesis[],
): Metric<number | null, number, number> {
  throw new Error('not implemented: brierScore');
}

export interface CalibrationBin {
  /** 0.5, 0.6, 0.7, 0.8 or 0.9. */
  readonly lower: number;
  readonly upper: number;
  readonly n: number;
  /** Null when the bin is empty. */
  readonly meanConfidence: number | null;
  /** Share supported. Null when the bin is empty. */
  readonly hitRate: number | null;
  readonly recordIds: readonly string[];
}

/**
 * Five bins 10 points wide from 50% to 100%; the last includes 100%. Confidence below 0.5 counts
 * as 0.5. Inconclusive hypotheses are excluded.
 */
export function calibrationBins(hypotheses: readonly ScoredHypothesis[]): CalibrationBin[] {
  throw new Error('not implemented: calibrationBins');
}
