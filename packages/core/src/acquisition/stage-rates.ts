import { daysBetween, type DateWindow, type IsoDate } from '../dates';
import type { Metric } from '../result';
import {
  furthestStage,
  type MaturityDays,
  type OutreachItem,
  type TimedStage,
  type UniversalStage,
} from './stages';

export interface StageRatesInput {
  /** One channel's items. The function does not filter by channel. */
  readonly items: readonly OutreachItem[];
  /** Items whose `sentOn` falls in this window count. */
  readonly window: DateWindow;
  /** Item age is measured in days from `sentOn` to this date. */
  readonly asOf: IsoDate;
  readonly maturityDays: MaturityDays;
}

/**
 * The step from `from` to `to`. Among items at least `maturityDays[to]` days old:
 * numerator reached `to`, denominator reached `from`. value is null when the denominator is 0.
 * recordIds: the denominator's items, in input order.
 */
export interface StageRate extends Metric<number | null, number, number> {
  readonly from: UniversalStage;
  readonly to: TimedStage;
}

/** Step i runs from stage i to stage i + 1. */
const STEPS: readonly (readonly [UniversalStage, TimedStage])[] = [
  ['reach', 'attention'],
  ['attention', 'conversation'],
  ['conversation', 'meeting'],
  ['meeting', 'win'],
];

/** Four steps, Reach → Attention through Meeting → Win. */
export function stageRates(input: StageRatesInput): StageRate[] {
  const { window, asOf, maturityDays } = input;
  const inWindow = input.items.filter((i) => window.start <= i.sentOn && i.sentOn <= window.end);
  return STEPS.map(([from, to], step) => {
    const reachedFrom = inWindow.filter(
      (i) => daysBetween(i.sentOn, asOf) >= maturityDays[to] && furthestStage(i) >= step,
    );
    const numerator = reachedFrom.filter((i) => furthestStage(i) > step).length;
    const denominator = reachedFrom.length;
    return {
      from,
      to,
      value: denominator === 0 ? null : numerator / denominator,
      numerator,
      denominator,
      recordIds: reachedFrom.map((i) => i.id),
    };
  });
}
