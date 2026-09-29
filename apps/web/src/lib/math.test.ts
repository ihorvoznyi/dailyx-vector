import { describe, expect, it } from 'vitest';

import { buildMath, MATH_SOURCE_LIMIT, type MathRow, type MathSource } from './math';

function baseInput(overrides: Partial<Parameters<typeof buildMath>[0]> = {}) {
  return {
    title: 'Net worth',
    value: '$48,218.09',
    formula: 'Liquid balances + position values, converted to USD',
    window: 'As of Sep 29, 2026',
    counts: [],
    sources: [],
    editedAt: [],
    ...overrides,
  };
}

describe('buildMath', () => {
  it('caps sources at MATH_SOURCE_LIMIT and reports the real total', () => {
    const sources: MathSource[] = Array.from({ length: 60 }, (_, i) => ({
      id: String(i),
      label: `Row ${i}`,
    }));
    const spec = buildMath(baseInput({ sources }));
    expect(spec.sources).toHaveLength(50);
    expect(spec.sourcesTotal).toBe(60);
    expect(spec.sources).toEqual(sources.slice(0, MATH_SOURCE_LIMIT));
  });

  it('finds the newest edit among Date and ISO string values, ignoring nulls', () => {
    const spec = buildMath(
      baseInput({
        editedAt: [new Date('2026-09-20T10:00:00Z'), '2026-09-28T09:00:00.000Z', null],
      }),
    );
    expect(spec.lastEdit).toBe('2026-09-28T09:00:00.000Z');
  });

  it('returns null lastEdit when there are no sources', () => {
    const spec = buildMath(baseInput({ editedAt: [] }));
    expect(spec.lastEdit).toBeNull();
  });

  it('passes counts through unchanged', () => {
    const counts: MathRow[] = [{ label: 'Sent', value: '12' }];
    const spec = buildMath(baseInput({ counts }));
    expect(spec.counts).toEqual(counts);
  });
});
