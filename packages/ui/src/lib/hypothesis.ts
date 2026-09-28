import type { IconName } from '../components/icon';
import { format } from './format';
import type { NumberFormat } from './format';
import type { Tone } from './tone';

/** Lifecycle of a hypothesis. */
export type HypStatus = 'idea' | 'draft' | 'running' | 'supported' | 'refuted' | 'inconclusive';

/** A pre-registered bet that a lever moves a metric (Vector index.d.ts `Hypothesis`). */
export interface Hypothesis {
  id: string;
  code?: string;
  lever: string;
  metric: string;
  status: HypStatus;
  title?: string;
  change?: string;
  direction?: 'up' | 'down';
  amount?: string;
  windowDays?: number;
  because?: string;
  method?: 'alternate' | 'before-after' | 'tagged';
  stopRule?: string;
  killRule?: string;
  confidence?: number;
  n?: number;
  nTarget?: number;
  pBetter?: number | null;
  effect?: { est: number; lo: number; hi: number; unit?: string };
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
  adoptedTo?: string;
  skill?: string;
  notes?: string;
}

/** Something I do, placed on the hypothesis canvas. */
export interface LeverDef {
  id: string;
  label: string;
  icon?: IconName;
  x: number;
  y: number;
}

/** A metric I already track, with its recent series. */
export interface MetricDef {
  id: string;
  label: string;
  source?: string;
  value: number;
  format?: NumberFormat;
  note?: string;
  spark?: number[];
  series?: { x: string; y: number; date: string }[];
  conversion?: number;
}

/** One status's label, tone and one-character glyph (Vector `HSTATUS`). */
export const HSTATUS: Record<HypStatus, { label: string; tone: Tone; glyph: string }> = {
  idea: { label: 'Idea', tone: 'neutral', glyph: '·' },
  draft: { label: 'Draft', tone: 'neutral', glyph: '○' },
  running: { label: 'Running', tone: 'info', glyph: '◐' },
  supported: { label: 'Supported', tone: 'up', glyph: '✓' },
  refuted: { label: 'Refuted', tone: 'down', glyph: '✕' },
  inconclusive: { label: 'Inconclusive', tone: 'neutral', glyph: '≈' },
};

/** The three ways to test a hypothesis, for the Method segmented control. */
export const METHODS: { value: NonNullable<Hypothesis['method']>; label: string }[] = [
  { value: 'alternate', label: 'Alternate A/B' },
  { value: 'before-after', label: 'Before / after' },
  { value: 'tagged', label: 'Tagged' },
];

/** Whole days since the Unix epoch for an ISO date (UTC); `null` for an empty date. */
export function dayNum(s: string | null | undefined): number | null {
  return s ? Math.floor(Date.parse(`${s}T00:00:00Z`) / 864e5) : null;
}

/** The inverse of `dayNum`: an ISO date string. */
export function dayStr(n: number): string {
  return new Date(n * 864e5).toISOString().slice(0, 10);
}

/** An ISO date as `Sep 7`; an empty string when there's no date. */
export function shortDate(s: string | undefined): string {
  if (!s) return '';
  const d = new Date(`${s}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * Today's ISO date, read once at module load so it's never computed during render (the
 * `react-hooks/purity` rule forbids `new Date()` in a component body). Components default their
 * `today` prop to `today ?? TODAY`.
 */
export const TODAY = new Date().toISOString().slice(0, 10);

/**
 * The one-line verdict for a posterior probability that B beats A, ported from the Vector
 * bundle. `null` means no data yet; otherwise the word pairs with a `Tone` for its colour.
 */
export function evidenceWord(p: number | null, threshold = 0.95): [word: string, tone: Tone] {
  if (p == null) return ['No data yet', 'neutral'];
  if (p >= threshold) return ['Strong evidence it works', 'up'];
  if (p <= 1 - threshold) return ['Strong evidence it hurts', 'down'];
  if (p >= 0.75) return ['Leaning better', 'info'];
  if (p <= 0.25) return ['Leaning worse', 'warn'];
  return ['No clear difference yet', 'neutral'];
}

/**
 * A signed number with a true minus and a leading `±` at zero: `+12pp`, `−14pp`, `±0pp`.
 * `null`/`undefined` render as an em dash.
 */
export function signed(v: number | null | undefined, unit = '', decimals = 0): string {
  if (v == null) return '—';
  const s = format(Math.abs(v), { decimals });
  return (v > 0 ? '+' : v < 0 ? '−' : '±') + s + unit;
}
