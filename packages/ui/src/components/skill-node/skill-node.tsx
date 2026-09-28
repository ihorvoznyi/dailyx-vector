import { useId } from 'react';
import type {
  CSSProperties,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
} from 'react';

import { Icon, type IconName } from '../icon';
import { cn } from '../../lib/cn';
import { HEX_D, HEX_H, HEX_W, STATE_LABEL, nodeState, skillProgress } from '../../lib/skill';
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

const EDGE: Record<SkillState, { stroke: string; width: number; dash?: string }> = {
  locked: { stroke: 'var(--color-line-control)', width: 1.5, dash: '2 5' },
  available: { stroke: 'var(--color-warn)', width: 1.5, dash: '6 5' },
  active: { stroke: 'var(--color-up)', width: 2 },
  mastered: { stroke: 'var(--color-up)', width: 1.5 },
  goal: { stroke: 'var(--color-line-control)', width: 1.5, dash: '4 4' },
};

const BODY_FILL: Record<SkillState, string> = {
  locked: 'fill-bg-100',
  available: 'fill-bg-100',
  active: 'fill-bg-100',
  mastered: 'fill-up',
  goal: 'fill-bg-000',
};

const HIT_TEXT: Record<SkillState, string> = {
  locked: 'text-ink-faint',
  available: 'text-ink',
  active: 'text-ink',
  mastered: 'text-on-up',
  goal: 'text-ink-faint',
};

const ICO_TEXT: Record<SkillState, string> = {
  locked: 'text-ink-faint',
  available: 'text-warn',
  active: 'text-up',
  mastered: 'text-on-up',
  goal: 'text-ink-faint',
};

const TITLE: Record<SkillState, string | undefined> = {
  locked: 'font-medium text-ink-faint',
  available: undefined,
  active: undefined,
  mastered: undefined,
  goal: 'font-medium italic',
};

function metaOf(n: SkillDef, state: SkillState, prog: number): string | null {
  if (state === 'goal' || state === 'locked') return null;
  if (state === 'mastered') return '1 pt';
  if (n.metric) return `${Math.round(prog * 100)}%`;
  if (n.steps && n.steps.length) {
    return `${n.steps.filter((s) => s.done).length}/${n.steps.length}`;
  }
  if (n.maxLevel) return `${n.level || 0}/${n.maxLevel}`;
  return prog > 0 ? `${Math.round(prog * 100)}%` : null;
}

/** One hexagon tile of the skill tree: icon, title, and a progress read-out. */
export function SkillNode({
  node,
  state: stateProp,
  progress: progressProp,
  selected,
  dragging,
  style,
  onPointerDown,
  onClick,
  onKeyDown,
}: SkillNodeProps) {
  const cid = useId();
  const state = stateProp ?? nodeState(node, {});
  const prog = progressProp ?? skillProgress(node);
  const fillH = HEX_H * prog;
  const label = state === 'goal' ? 'Set your own goal' : (node.title ?? '');
  const meta = metaOf(node, state, prog);
  const iconName: IconName =
    state === 'goal'
      ? 'plus'
      : state === 'mastered'
        ? (node.icon ?? 'check')
        : (node.icon ?? 'target');
  const edge = selected ? { stroke: 'var(--color-focus)', width: 2.5 } : EDGE[state];

  return (
    <div
      className={cn(
        'group absolute h-112px w-156px transition duration-base ease-out',
        dragging && 'z-5 transition-none',
      )}
      style={style}
    >
      <svg
        className={cn(
          'absolute inset-0 overflow-visible transition-transform duration-fast ease-out group-hover:-translate-y-2px',
          state === 'mastered' && 'drop-shadow-mastered',
          dragging && 'scale-106 drop-shadow-lift',
        )}
        width={HEX_W}
        height={HEX_H}
        viewBox={`0 0 ${HEX_W} ${HEX_H}`}
        aria-hidden
      >
        <defs>
          <clipPath id={cid}>
            <path d={HEX_D} />
          </clipPath>
        </defs>
        <path className={BODY_FILL[state]} d={HEX_D} />
        {state === 'active' ? (
          <g clipPath={`url(#${cid})`}>
            <rect
              className="fill-up"
              fillOpacity={0.2}
              x={0}
              y={HEX_H - fillH}
              width={HEX_W}
              height={fillH}
            />
            <line
              stroke="var(--color-up)"
              strokeWidth={2}
              x1={0}
              x2={HEX_W}
              y1={HEX_H - fillH}
              y2={HEX_H - fillH}
            />
          </g>
        ) : null}
        <path
          className="group-has-focus-visible:stroke-focus"
          fill="none"
          d={HEX_D}
          stroke={edge.stroke}
          strokeWidth={edge.width}
          strokeDasharray={edge.dash}
        />
      </svg>
      <button
        type="button"
        className={cn(
          'absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-transparent px-30px py-10px text-center clip-hex focus-visible:outline-none',
          HIT_TEXT[state],
        )}
        aria-pressed={selected ? 'true' : 'false'}
        aria-label={`${label}, ${STATE_LABEL[state]}${state === 'active' ? `, ${Math.round(prog * 100)}%` : ''}`}
        onPointerDown={onPointerDown}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <span className={cn('grid place-items-center', ICO_TEXT[state])}>
          <Icon name={iconName} size={20} />
        </span>
        <span className={cn('line-clamp-2 text-12px leading-15px font-semibold', TITLE[state])}>
          {label}
        </span>
        {meta ? (
          <span className="font-mono text-11px leading-14px font-medium tabular-nums">{meta}</span>
        ) : null}
        {state === 'locked' ? (
          <span className="absolute bottom-9px left-1/2 grid -translate-x-1/2 text-ink-faint">
            <Icon name="lock" size={11} stroke={2} />
          </span>
        ) : null}
      </button>
    </div>
  );
}
