/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 11 (T22a) */
import type { DateWindow, IsoDate } from '../dates';
import type { Metric } from '../result';
import type { MaturityDays, OutreachItem, TimedStage, UniversalStage } from './stages';

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

/** Four steps, Reach → Attention through Meeting → Win. */
export function stageRates(input: StageRatesInput): StageRate[] {
  throw new Error('not implemented: stageRates');
}
