/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T26 */
import type { Comparison } from './comparison';

export interface BinaryArm {
  readonly successes: number;
  readonly trials: number;
}

export interface BinaryComparisonInput {
  readonly a: BinaryArm;
  readonly b: BinaryArm;
  readonly seed: number;
  /** Default 20,000. */
  readonly draws?: number;
}

/**
 * Beta(1, 1) priors; posterior Beta(1 + successes, 1 + failures) per arm. `estimate` is the
 * difference of posterior means. Throws RangeError on negative counts or successes > trials.
 */
export function compareBinary(input: BinaryComparisonInput): Comparison {
  throw new Error('not implemented: compareBinary');
}
