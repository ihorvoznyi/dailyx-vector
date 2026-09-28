/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T26 */

export type Direction = 'up' | 'down';

export type ExperimentVerdict = 'supported' | 'refuted' | 'inconclusive';

/**
 * supported: the 90% interval clears zero in the predicted direction; refuted: it clears zero the
 * other way; otherwise inconclusive. An interval touching zero does not clear it.
 */
export function experimentVerdict(
  interval: readonly [number, number],
  direction: Direction,
): ExperimentVerdict {
  throw new Error('not implemented: experimentVerdict');
}
