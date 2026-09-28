/** B against A: the output of both the binary and the continuous comparison. */
export interface Comparison {
  /** Point estimate of B − A. */
  readonly estimate: number;
  /** Share of draws in which B − A is above zero. */
  readonly pBBeatsA: number;
  /** 90% interval of B − A: the 5th and 95th percentiles of the draws (ADR 0003). */
  readonly interval: readonly [number, number];
  readonly draws: number;
  readonly seed: number;
}
