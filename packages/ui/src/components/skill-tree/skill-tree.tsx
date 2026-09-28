import type { SkillDef } from '../../lib/skill';

export interface SkillTreeProps {
  nodes?: SkillDef[];
  defaultNodes?: SkillDef[];
  onChange?: (nodes: SkillDef[]) => void;
  selected?: string | null;
  defaultSelected?: string;
  onSelect?: (n: SkillDef | null) => void;
  height?: number;
  editable?: boolean;
  start?: boolean;
  label?: string;
}

/** Stub until stage 3-6 task W3-skill-tree builds it. The props above are the contract. */
export function SkillTree(props: SkillTreeProps) {
  void props;
  return null;
}
