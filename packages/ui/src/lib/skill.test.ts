import { describe, expect, it } from 'vitest';

import {
  HEX_D,
  HEX_GAP,
  HEX_H,
  HEX_W,
  PITCH_X,
  PITCH_Y,
  SLANT,
  cellXY,
  hexPath,
  nearestCell,
  nodeState,
  skillProgress,
  tierOf,
} from './skill';
import type { SkillDef } from './skill';

describe('skillProgress', () => {
  it('reads a metric as current / target, clamped', () => {
    expect(skillProgress({ metric: { current: 6935, target: 10000 } } as SkillDef)).toBe(0.6935);
  });

  it('reads steps as done / total', () => {
    expect(
      skillProgress({
        steps: [
          { label: 'a', done: true },
          { label: 'b', done: false },
        ],
      } as SkillDef),
    ).toBe(0.5);
  });

  it('reads a level as level / maxLevel', () => {
    expect(skillProgress({ maxLevel: 3, level: 1 } as SkillDef)).toBeCloseTo(1 / 3);
  });

  it('clamps a raw progress to 1', () => {
    expect(skillProgress({ progress: 1.4 } as SkillDef)).toBe(1);
  });

  it('is 0 for a goal without a title', () => {
    expect(skillProgress({ goal: true } as SkillDef)).toBe(0);
  });
});

describe('nodeState', () => {
  it('is goal for an unnamed goal slot', () => {
    expect(nodeState({ goal: true } as SkillDef, {})).toBe('goal');
  });

  it('is mastered at full progress', () => {
    expect(nodeState({ progress: 1 } as SkillDef, {})).toBe('mastered');
  });

  it('is available when every requirement is mastered', () => {
    const byId: Record<string, SkillDef> = {
      a: { id: 'a', progress: 1 } as SkillDef,
    };
    expect(nodeState({ id: 'b', requires: ['a'] } as SkillDef, byId)).toBe('available');
  });

  it('is locked otherwise', () => {
    const byId: Record<string, SkillDef> = {
      a: { id: 'a', progress: 0 } as SkillDef,
    };
    expect(nodeState({ id: 'b', requires: ['a'] } as SkillDef, byId)).toBe('locked');
  });
});

describe('hex geometry', () => {
  it('places a cell at its pitch, offsetting odd columns by half a row', () => {
    const [x, y] = cellXY(1, 0);
    expect(x).toBeCloseTo(129.68);
    expect(y).toBe(60);
    const [x2, y2] = cellXY(2, 3);
    expect(x2).toBeCloseTo(259.36);
    expect(y2).toBe(360);
  });

  it('snaps a pixel point back to its cell', () => {
    expect(nearestCell(129.68, 60)).toEqual([1, 0]);
  });

  it('derives the pitch from the tile size, gap and slant', () => {
    expect(HEX_GAP).toBe(8);
    expect(SLANT).toBe(0.22);
    expect(PITCH_X).toBeCloseTo(129.68);
    expect(PITCH_Y).toBe(120);
  });

  it('traces the same rounded hexagon HEX_D uses', () => {
    expect(hexPath(HEX_W, HEX_H, 7)).toBe(HEX_D);
  });
});

describe('tierOf', () => {
  it('is Advanced at the top row', () => {
    expect(tierOf(0, 6)).toBe('Advanced');
  });

  it('is Intermediate mid-grid', () => {
    expect(tierOf(3, 6)).toBe('Intermediate');
  });

  it('is Basics at the bottom row', () => {
    expect(tierOf(5, 6)).toBe('Basics');
  });
});
