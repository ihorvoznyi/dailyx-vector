import { describe, expect, it } from 'vitest';

import { LEAD_LIST_MAX, parseLeadList } from './lead-list';

describe('parseLeadList', () => {
  it('splits comma-separated lines, skipping blank ones', () => {
    const result = parseLeadList('Ann Lee, Acme, https://acme.io\nBob, , \n\n  Cara,Kite  ');
    expect(result).toEqual({
      ok: true,
      leads: [
        { contactName: 'Ann Lee', company: 'Acme', url: 'https://acme.io' },
        { contactName: 'Bob', company: null, url: null },
        { contactName: 'Cara', company: 'Kite', url: null },
      ],
    });
  });

  it('splits on tab when the line has one, keeping commas in the link', () => {
    const result = parseLeadList('Dan\tNorthwind\thttps://nw.com/jobs?a=1,2');
    expect(result).toEqual({
      ok: true,
      leads: [{ contactName: 'Dan', company: 'Northwind', url: 'https://nw.com/jobs?a=1,2' }],
    });
  });

  it('joins every field after the second back into the url', () => {
    const result = parseLeadList('Eve, Orbit, https://x.io/a,b');
    expect(result).toEqual({
      ok: true,
      leads: [{ contactName: 'Eve', company: 'Orbit', url: 'https://x.io/a,b' }],
    });
  });

  it('rejects a link missing http(s), naming the 1-based line', () => {
    const result = parseLeadList('ok, co\nFay, Lumen, lumen.com');
    expect(result).toEqual({
      ok: false,
      error: 'Line 2: the link must start with http:// or https://',
    });
  });

  it('rejects empty or all-blank input', () => {
    expect(parseLeadList('')).toEqual({ ok: false, error: 'Paste at least one line' });
    expect(parseLeadList('\n  \n')).toEqual({ ok: false, error: 'Paste at least one line' });
  });

  it('skips a line whose three fields are all empty', () => {
    const result = parseLeadList(',,\nGil');
    expect(result).toEqual({
      ok: true,
      leads: [{ contactName: 'Gil', company: null, url: null }],
    });
  });

  it('rejects more than 200 lines', () => {
    const text = Array.from({ length: LEAD_LIST_MAX + 1 }, () => 'x').join('\n');
    expect(parseLeadList(text)).toEqual({ ok: false, error: 'Paste at most 200 lines at a time' });
  });
});
