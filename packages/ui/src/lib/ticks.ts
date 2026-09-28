/**
 * "Nice" axis ticks covering [min, max] with about `n` steps of 1, 2, 5 or 10 × 10^k.
 * Ported from the Vector bundle; values are rounded to 6 decimals to drop float noise.
 */
export function niceTicks(min: number, max: number, n: number): number[] {
  if (min === max) max = min + 1;
  const span = max - min;
  let step = Math.pow(10, Math.floor(Math.log10(span / n)));
  const err = (n * step) / span;
  if (err <= 0.15) step *= 10;
  else if (err <= 0.35) step *= 5;
  else if (err <= 0.75) step *= 2;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}
