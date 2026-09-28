/** A calendar date in UTC, `YYYY-MM-DD`. */
export type IsoDate = string;

/** A run of calendar days, inclusive at both ends. */
export interface DateWindow {
  readonly start: IsoDate;
  readonly end: IsoDate;
}
