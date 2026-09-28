/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T26 */
import type { Comparison } from './comparison';

export interface ContinuousComparisonInput {
  readonly a: readonly number[];
  readonly b: readonly number[];
  readonly seed: number;
  /** Default 5,000. */
  readonly resamples?: number;
}

/**
 * Bootstrap of mean(B) − mean(A). `estimate` is the observed difference of means.
 * Throws RangeError when either arm is empty.
 */
export function compareContinuous(input: ContinuousComparisonInput): Comparison {
  throw new Error('not implemented: compareContinuous');
}
