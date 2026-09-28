import type {
  CSSProperties,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
} from 'react';
import type { SkillDef, SkillState } from '../../lib/skill';

export interface SkillNodeProps {
  node: SkillDef;
  state?: SkillState;
  progress?: number;
  selected?: boolean;
  dragging?: boolean;
  style?: CSSProperties;
  onPointerDown?: PointerEventHandler;
  onClick?: MouseEventHandler;
  onKeyDown?: KeyboardEventHandler;
}

/** Stub until stage 3-6 task W2-skill builds it. The props above are the contract. */
export function SkillNode(props: SkillNodeProps) {
  void props;
  return null;
}
