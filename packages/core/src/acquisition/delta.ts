/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 11 (T22a) */

/**
 * (rate − baseline) × 100 per step, in percentage points. Null where either side is null.
 * Throws RangeError when the arrays differ in length.
 */
export function deltasPp(
  rates: readonly (number | null)[],
  baseline: readonly (number | null)[],
): (number | null)[] {
  throw new Error('not implemented: deltasPp');
}
