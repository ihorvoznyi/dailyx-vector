/* eslint-disable @typescript-eslint/no-unused-vars -- stub until stage 11 (T22a) */
import type { DateWindow } from '../dates';
import type { StageRate, StageRatesInput } from './stage-rates';

/** The window of the same length that ends the day before `window.start`. */
export function previousWindow(window: DateWindow): DateWindow {
  throw new Error('not implemented: previousWindow');
}

/** `stageRates` over `previousWindow(input.window)`, with the same `asOf` and maturities. */
export function baselineRates(input: StageRatesInput): StageRate[] {
  throw new Error('not implemented: baselineRates');
}
