import { describe, expect, it } from 'vitest';

import { fromHundredths, fromMicros, hundredths, rateE6, toHundredths, toMicros } from './amount';

describe('toHundredths', () => {
  it.each([
    ['3800', 380000],
    ['19.99', 1999],
    ['0.5', 50],
    ['5', 500],
    ['0', 0],
    ['7.5', 750],
  ])('%s -> %i', (input, expected) => {
    expect(toHundredths(input)).toBe(expected);
  });
});

describe('fromHundredths', () => {
  it.each([
    [380000, '3800.00'],
    [1999, '19.99'],
    [500, '5.00'],
    [50, '0.50'],
    [0, '0.00'],
  ])('%i -> %s', (input, expected) => {
    expect(fromHundredths(input)).toBe(expected);
  });
});

describe('hundredths schema', () => {
  it('parses a valid amount', () => {
    expect(hundredths.safeParse('3800').data).toBe(380000);
  });
});

describe('toMicros', () => {
  it.each([
    ['41.3', 41_300_000],
    ['41.305', 41_305_000],
    ['0.024213', 24_213],
    ['1', 1_000_000],
  ])('%s -> %i', (input, expected) => {
    expect(toMicros(input)).toBe(expected);
  });
});

describe('fromMicros', () => {
  it.each([
    [41_300_000, '41.3'],
    [1_000_000, '1'],
  ])('%i -> %s', (input, expected) => {
    expect(fromMicros(input)).toBe(expected);
  });
});

describe('rateE6', () => {
  it('rejects zero', () => {
    expect(rateE6.safeParse('0').success).toBe(false);
  });

  it('rejects more than 6 decimals', () => {
    expect(rateE6.safeParse('41.1234567').success).toBe(false);
  });

  it('accepts a valid rate', () => {
    const result = rateE6.safeParse('41.3');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(41_300_000);
  });
});
