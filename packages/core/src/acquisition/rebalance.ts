/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T22b */
import type { Money } from '../money/money';

export interface RebalanceChannel {
  readonly id: string;
  readonly hoursPerWeek: number;
  /** Null means no cap. */
  readonly maxHours: number | null;
  readonly returnPerHour: Money | null;
  readonly ageDays: number;
}

export interface RebalanceInput {
  readonly channels: readonly RebalanceChannel[];
  readonly baselineRate: Money;
}

export interface RebalanceMove {
  readonly to: string;
  readonly hours: number;
}

export interface RebalancePlan {
  readonly donor: string;
  readonly moves: readonly RebalanceMove[];
  readonly hoursMoved: number;
  /** Σ hours moved × (recipient rate − donor rate) × 4.33, labelled "if returns hold". */
  readonly expectedMonthlyGain: Money;
}

/**
 * Moves up to half the weakest mature channel's weekly hours (at most 4) into the strongest
 * channels with room, if that donor earns below the baseline rate. Null when nothing moves.
 */
export function rebalance(input: RebalanceInput): RebalancePlan | null {
  throw new Error('not implemented: rebalance');
}
