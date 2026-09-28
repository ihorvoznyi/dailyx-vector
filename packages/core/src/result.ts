/** Success, or an expected failure the caller must handle. Programmer errors still throw. */
export type Result<T, E> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: E };

/**
 * A computed number plus what it was computed from, so show-the-math needs no second query.
 * `recordIds` lists the source records in the order the function met them.
 */
export interface Metric<V, N = V, D = N> {
  readonly value: V;
  readonly numerator: N;
  readonly denominator: D;
  readonly recordIds: readonly string[];
}
