import type { SkillDef } from '../../lib/skill';

export interface SkillPanelProps {
  node: SkillDef;
  byId: Record<string, SkillDef>;
  nodes: SkillDef[];
  onChange?: (n: SkillDef) => void;
  onSelect?: (id: string) => void;
  onClose?: () => void;
  /** `is-static` renders in flow, `is-sheet` as a bottom sheet; otherwise it floats right. */
  className?: string;
}

/** Stub until stage 3-6 task W2-skill builds it. The props above are the contract. */
export function SkillPanel(props: SkillPanelProps) {
  void props;
  return null;
}
