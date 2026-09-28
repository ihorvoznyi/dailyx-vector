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
