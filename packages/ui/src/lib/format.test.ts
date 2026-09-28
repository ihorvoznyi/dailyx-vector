import { describe, expect, it } from 'vitest';

import { format } from './format';

describe('format', () => {
  it('groups thousands and prefixes', () => {
    expect(format(48210, { prefix: '$' })).toBe('$48,210');
    expect(format(64, { suffix: '%' })).toBe('64%');
    expect(format(3.14159, { decimals: 1 })).toBe('3.1');
  });

  it('puts a true minus before the prefix', () => {
    expect(format(-1234.5, { prefix: '$', decimals: 2 })).toBe('−$1,234.50');
  });

  it('compacts from ten thousand with one decimal', () => {
    expect(format(9999, { compact: true })).toBe('9,999');
    expect(format(12480, { compact: true })).toBe('12.5K');
    expect(format(-15000, { compact: true })).toBe('−15.0K');
    expect(format(2500000, { prefix: '$', compact: true })).toBe('$2.5M');
    expect(format(1.2e9, { compact: true })).toBe('1.2B');
  });

  it('renders missing values as an em dash', () => {
    expect(format(null)).toBe('—');
    expect(format(undefined)).toBe('—');
    expect(format(Number.NaN)).toBe('—');
  });
});
