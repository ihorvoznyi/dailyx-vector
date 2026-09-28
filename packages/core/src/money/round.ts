/** n ÷ d rounded half away from zero, in exact integer arithmetic (ADR 0003). */
export function divRound(n: bigint, d: bigint): bigint {
  if (d === 0n) throw new RangeError('divRound: division by zero');
  const q = n / d;
  const r = n % d;
  const twiceRem = 2n * (r < 0n ? -r : r);
  if (twiceRem < (d < 0n ? -d : d)) return q;
  return n < 0n !== d < 0n ? q - 1n : q + 1n;
}

/** Rounds half away from zero to an integer. Never returns -0. */
export function roundHalfAway(x: number): number {
  return Math.sign(x) * Math.round(Math.abs(x)) + 0;
}
