export interface Lead {
  contactName: string | null;
  company: string | null;
  url: string | null;
}

export const LEAD_LIST_MAX = 200;

const URL_RE = /^https?:\/\/\S+$/i;

function toLead(line: string): Lead {
  const sep = line.includes('\t') ? '\t' : ',';
  const fields = line.split(sep).map((f) => f.trim());
  const contactName = fields[0] || null;
  const company = fields[1] || null;
  const url = fields.slice(2).join(sep).trim() || null;
  return { contactName, company, url };
}

/**
 * Parses a pasted lead list: one lead per line, `name, company, link` (or tab-separated). Blank
 * lines and lines with all three fields empty are skipped. A non-empty link must start with
 * `http://` or `https://`.
 */
export function parseLeadList(
  text: string,
): { ok: true; leads: Lead[] } | { ok: false; error: string } {
  const lines = text.split(/\r?\n/);
  const leads: Lead[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const lead = toLead(line);
    if (!lead.contactName && !lead.company && !lead.url) continue;
    if (lead.url && !URL_RE.test(lead.url)) {
      return { ok: false, error: `Line ${i + 1}: the link must start with http:// or https://` };
    }
    leads.push(lead);
  }

  if (leads.length === 0) return { ok: false, error: 'Paste at least one line' };
  if (leads.length > LEAD_LIST_MAX)
    return { ok: false, error: 'Paste at most 200 lines at a time' };

  return { ok: true, leads };
}
