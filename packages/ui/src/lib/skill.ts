import type { IconName } from '../components/icon';
import type { NumberFormat } from './format';

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
