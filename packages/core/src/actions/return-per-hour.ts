/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T24 */
import type { Money } from '../money/money';
import type { Metric } from '../result';

export interface Action {
  readonly id: string;
  /** Per month when `isRecurring`. */
  readonly amount: Money;
  /** 0–1. Null means certain. */
  readonly probability: number | null;
  readonly isRecurring: boolean;
  readonly hours: number;
  readonly done: boolean;
}

/**
 * numerator: expected value, amount × p × (recurring ? horizonMonths : 1), rounded to a minor unit.
 * denominator: hours. value: numerator ÷ hours, rounded to a minor unit; null when hours are zero.
 * recordIds: the action's id.
 */
export type ActionReturn = Metric<Money | null, Money, number>;

export function actionReturnPerHour(action: Action, horizonMonths: number): ActionReturn {
  throw new Error('not implemented: actionReturnPerHour');
}

export interface RankOptions {
  /** `horizon_months`, default 12. */
  readonly horizonMonths: number;
  readonly baselineRate: Money;
}

export interface RankedAction {
  readonly action: Action;
  readonly metric: ActionReturn;
  /** Return per hour strictly below the baseline rate. False when the return is null. */
  readonly belowBaseline: boolean;
}

/**
 * Open actions first, then done ones. Within each group, highest return per hour first, null
 * returns last, ties in input order.
 */
export function rankActions(actions: readonly Action[], options: RankOptions): RankedAction[] {
  throw new Error('not implemented: rankActions');
}
