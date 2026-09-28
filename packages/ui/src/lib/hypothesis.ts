import type { IconName } from '../components/icon';
import type { NumberFormat } from './format';

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
