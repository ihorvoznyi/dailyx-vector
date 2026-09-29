export interface MathRow {
  readonly label: string;
  readonly value: string;
}

export interface MathSource {
  readonly id: string;
  readonly label: string;
}

/** The show-the-math contract every screen builds and `ShowMath` renders. */
export interface MathSpec {
  readonly title: string;
  readonly value: string;
  readonly formula: string;
  readonly window: string;
  readonly counts: readonly MathRow[];
  readonly sources: readonly MathSource[];
  readonly sourcesTotal: number;
  readonly lastEdit: string | null;
  readonly note?: string;
}

export const MATH_SOURCE_LIMIT = 50;

export interface MathInput {
  title: string;
  value: string;
  formula: string;
  window: string;
  counts: MathRow[];
  sources: MathSource[];
  /** updatedAt of every source row (Date or ISO string); nulls ignored. */
  editedAt: readonly (Date | string | null)[];
  note?: string;
}

function latestEdit(editedAt: readonly (Date | string | null)[]): string | null {
  let latest: number | null = null;
  for (const value of editedAt) {
    if (value === null) continue;
    const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (latest === null || ms > latest) latest = ms;
  }
  return latest === null ? null : new Date(latest).toISOString();
}

export function buildMath(input: MathInput): MathSpec {
  const sources = input.sources.slice(0, MATH_SOURCE_LIMIT);
  return {
    title: input.title,
    value: input.value,
    formula: input.formula,
    window: input.window,
    counts: input.counts,
    sources,
    sourcesTotal: input.sources.length,
    lastEdit: latestEdit(input.editedAt),
    ...(input.note !== undefined ? { note: input.note } : {}),
  };
}
