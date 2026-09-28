import type { IconName } from '../components/icon';
import type { NumberFormat } from './format';
import type { Tone } from './tone';

/** Where a skill tile stands. */
export type SkillState = 'locked' | 'available' | 'active' | 'mastered' | 'goal';

/** One tile of a skill tree (Vector index.d.ts `SkillDef`). */
export interface SkillDef {
  id: string;
  title?: string;
  icon?: IconName;
  col: number;
  row: number;
  requires?: string[];
  description?: string;
  notes?: string;
  tier?: string;
  goal?: boolean;
  startedAt?: string;
  doneAt?: string | null;
  metric?: {
    label: string;
    source?: string;
    current: number;
    target: number;
    format?: NumberFormat;
  };
  steps?: { id?: string; label: string; done: boolean }[];
  maxLevel?: number;
  level?: number;
  progress?: number;
}

/**
 * A tile's completion, 0–1: metric current/target, steps done/total, level/maxLevel, or the
 * raw `progress`. A goal tile without a title (not yet named) is 0.
 */
export function skillProgress(n: SkillDef | null | undefined): number {
  if (!n || (n.goal && !n.title)) return 0;
  if (n.metric) return Math.max(0, Math.min(1, (n.metric.current || 0) / (n.metric.target || 1)));
  if (n.steps && n.steps.length) {
    return n.steps.filter((s) => s.done).length / n.steps.length;
  }
  if (n.maxLevel) return Math.max(0, Math.min(1, (n.level || 0) / n.maxLevel));
  return Math.max(0, Math.min(1, n.progress || 0));
}

/**
 * A tile's state: `goal` when it's an unnamed goal slot, `mastered`/`active` from its
 * progress, otherwise `available` when every requirement is mastered, else `locked`.
 */
export function nodeState(n: SkillDef, byId: Record<string, SkillDef>): SkillState {
  if (n.goal && !n.title) return 'goal';
  const p = skillProgress(n);
  if (p >= 1) return 'mastered';
  if (p > 0) return 'active';
  const ok = (n.requires || []).every((id) => {
    const r = byId[id];
    return r != null && skillProgress(r) >= 1;
  });
  return ok ? 'available' : 'locked';
}

/** Human word for each tile state. */
export const STATE_LABEL: Record<SkillState, string> = {
  locked: 'Locked',
  available: 'Ready to start',
  active: 'In progress',
  mastered: 'Mastered',
  goal: 'Set your own goal',
};

/** Badge tone for each tile state. */
export const STATE_TONE: Record<SkillState, Tone> = {
  locked: 'neutral',
  available: 'warn',
  active: 'up',
  mastered: 'up',
  goal: 'neutral',
};

/** The tier label for a row, from its depth in the grid (row 0 is most advanced). */
export function tierOf(row: number, rows: number): string {
  const t = rows <= 1 ? 1 : 1 - row / (rows - 1);
  return t > 0.66 ? 'Advanced' : t > 0.33 ? 'Intermediate' : 'Basics';
}

/* Hex geometry: flat-top, stretched; slant = 22% of width. */
export const HEX_W = 156;
export const HEX_H = 112;
export const HEX_GAP = 8;
export const SLANT = 0.22;
export const PITCH_X = HEX_W * (1 - SLANT) + HEX_GAP;
export const PITCH_Y = HEX_H + HEX_GAP;

/** The pixel centre column/row `col`/`row` map to (alternating columns drop half a row). */
export function cellXY(col: number, row: number): [number, number] {
  return [col * PITCH_X, row * PITCH_Y + (col % 2 ? PITCH_Y / 2 : 0)];
}

/** The nearest grid cell to a pixel point (drag snapping). */
export function nearestCell(x: number, y: number): [number, number] {
  const col = Math.round(x / PITCH_X);
  const row = Math.round((y - (Math.abs(col) % 2 ? PITCH_Y / 2 : 0)) / PITCH_Y);
  return [col, row];
}

/** An SVG path `d` for a `w` × `h` flat-top hexagon with corners rounded by radius `r`. */
export function hexPath(w: number, h: number, r: number): string {
  const s = w * SLANT;
  const pts: [number, number][] = [
    [s, 0],
    [w - s, 0],
    [w, h / 2],
    [w - s, h],
    [s, h],
    [0, h / 2],
  ];
  let d = '';
  for (let i = 0; i < 6; i++) {
    const p0 = pts[(i + 5) % 6]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % 6]!;
    const v1: [number, number] = [p0[0] - p1[0], p0[1] - p1[1]];
    const v2: [number, number] = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    const a: [number, number] = [p1[0] + (v1[0] / l1) * r, p1[1] + (v1[1] / l1) * r];
    const b: [number, number] = [p1[0] + (v2[0] / l2) * r, p1[1] + (v2[1] / l2) * r];
    d += (i ? 'L' : 'M') + a[0].toFixed(2) + ' ' + a[1].toFixed(2);
    d += 'Q' + p1[0] + ' ' + p1[1] + ' ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
  }
  return d + 'Z';
}

/** The hex outline every SkillNode and its clip-path share, radius 7. */
export const HEX_D = hexPath(HEX_W, HEX_H, 7);
