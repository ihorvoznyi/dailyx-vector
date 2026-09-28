import type { IsoDate } from '../dates';

/** Every channel's funnel maps onto these five, in order. Index 0 is Reach. */
export const UNIVERSAL_STAGES = ['reach', 'attention', 'conversation', 'meeting', 'win'] as const;

export type UniversalStage = (typeof UNIVERSAL_STAGES)[number];

/** The stages after Reach; each has a date and a maturity. */
export type TimedStage = Exclude<UniversalStage, 'reach'>;

/** Days an item must have been out before it counts toward a stage. Editable per channel. */
export type MaturityDays = Readonly<Record<TimedStage, number>>;

export const DEFAULT_MATURITY_DAYS: MaturityDays = {
  attention: 7,
  conversation: 7,
  meeting: 21,
  win: 45,
};

/** One proposal, email thread, invite or ask. */
export interface OutreachItem {
  readonly id: string;
  readonly channelId: string;
  /** The Reach date. */
  readonly sentOn: IsoDate;
  /** The day each later stage was reached. A missing key means not reached. */
  readonly stageDates: Readonly<Partial<Record<TimedStage, IsoDate>>>;
}
