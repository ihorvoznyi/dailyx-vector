/**
 * (rate − baseline) × 100 per step, in percentage points. Null where either side is null.
 * Throws RangeError when the arrays differ in length.
 */
export function deltasPp(
  rates: readonly (number | null)[],
  baseline: readonly (number | null)[],
): (number | null)[] {
  if (rates.length !== baseline.length) {
    throw new RangeError(`deltasPp: ${rates.length} rates vs ${baseline.length} baseline values`);
  }
  return rates.map((rate, i) => {
    const base = baseline[i] ?? null;
    return rate === null || base === null ? null : (rate - base) * 100;
  });
}
