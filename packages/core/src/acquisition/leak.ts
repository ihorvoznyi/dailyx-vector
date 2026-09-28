/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 11 (T22a) */

export interface LeakInput {
  /** Step rates; step i runs from stage i to stage i + 1. */
  readonly rates: readonly (number | null)[];
  readonly baseline: readonly (number | null)[];
  /** Stage indices (0 = Reach) whose counts are unreliable, such as email opens (1). */
  readonly flaggedStages: readonly number[];
}

export interface Leak {
  readonly step: number;
  /** rate ÷ baseline. */
  readonly score: number;
  readonly rate: number;
  readonly baseline: number;
}

/**
 * The step with the lowest rate ÷ baseline, if below 0.97. Steps touching a flagged stage, and
 * steps with a null rate or a null or zero baseline, are never the leak. Ties go to the earlier step.
 */
export function biggestLeak(input: LeakInput): Leak | null {
  throw new Error('not implemented: biggestLeak');
}
