import { addDays, daysBetween, type DateWindow } from '../dates';
import { stageRates, type StageRate, type StageRatesInput } from './stage-rates';

/** The window of the same length that ends the day before `window.start`. */
export function previousWindow(window: DateWindow): DateWindow {
  const length = daysBetween(window.start, window.end) + 1;
  return { start: addDays(window.start, -length), end: addDays(window.start, -1) };
}

/** `stageRates` over `previousWindow(input.window)`, with the same `asOf` and maturities. */
export function baselineRates(input: StageRatesInput): StageRate[] {
  return stageRates({ ...input, window: previousWindow(input.window) });
}
