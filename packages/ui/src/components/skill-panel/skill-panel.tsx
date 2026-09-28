'use client';

import { Badge } from '../badge';
import { Button } from '../button';
import { Icon, type IconName } from '../icon';
import { ProgressRing } from '../progress-ring';
import { Chip } from '../../atoms/chip';
import { CheckBox } from '../../atoms/check-box';
import { Eyebrow } from '../../atoms/eyebrow';
import { IconButton } from '../../atoms/icon-button';
import { Meter } from '../../atoms/meter';
import { Num } from '../../atoms/num';
import {
  Panel,
  PanelBody,
  PanelDesc,
  PanelFoot,
  PanelHead,
  PanelSection,
  panelMode,
} from '../../atoms/panel';
import { cn } from '../../lib/cn';
import { format } from '../../lib/format';
import { STATE_LABEL, STATE_TONE, nodeState, skillProgress } from '../../lib/skill';
import type { SkillDef, SkillState } from '../../lib/skill';
import { GoalForm } from './goal-form';

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

const HEAD_ICON: Record<SkillState, string> = {
  locked: 'bg-bg-300 text-ink-muted',
  goal: 'bg-bg-300 text-ink-muted',
  mastered: 'bg-up text-on-up',
  active: 'bg-up-soft text-up',
  available: 'bg-warn-soft text-warn',
};

function chipIcon(state: SkillState, icon: IconName | undefined): IconName {
  if (state === 'mastered') return 'check';
  if (state === 'locked') return 'lock';
  return icon ?? 'target';
}

/** The detail view of one skill tile, where its progress is tracked. */
export function SkillPanel({
  node,
  byId,
  nodes,
  onChange,
  onSelect,
  onClose,
  className,
}: SkillPanelProps) {
  const state = nodeState(node, byId);
  const prog = skillProgress(node);
  const upd = (patch: Partial<SkillDef>) => onChange?.({ ...node, ...patch });
  const unlocks = nodes.filter((m) => (m.requires ?? []).includes(node.id));
  const steps = node.steps ?? [];
  const requires = node.requires ?? [];
  const maxLevel = node.maxLevel;

  const chip = (m: SkillDef) => {
    const ms = nodeState(m, byId);
    return (
      <Chip
        key={m.id}
        tone={ms === 'mastered' ? 'up' : ms === 'available' ? 'warn' : 'neutral'}
        onClick={() => onSelect?.(m.id)}
      >
        <Icon name={chipIcon(ms, m.icon)} size={13} stroke={2} />
        {m.title || 'Goal'}
      </Chip>
    );
  };

  const eyebrowLine = `${node.tier ? `${node.tier} · ` : ''}${state === 'mastered' ? '1 pt earned' : '0 / 1 pt'}`;
  const dateLine = node.doneAt
    ? `Mastered ${node.doneAt}`
    : node.startedAt
      ? `Started ${node.startedAt}`
      : state === 'locked'
        ? 'Master what it requires first'
        : 'Not started';

  return (
    <Panel
      mode={panelMode(className)}
      className={className}
      aria-label={`${node.title || 'Goal'} details`}
    >
      <PanelHead>
        <span
          className={cn(
            'grid h-36px w-40px flex-none place-items-center clip-hex',
            HEAD_ICON[state],
          )}
        >
          <Icon name={state === 'goal' ? 'plus' : (node.icon ?? 'target')} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <Eyebrow className="block">{eyebrowLine}</Eyebrow>
          <h3 className="mt-2px text-title text-ink">{node.title || 'Set your own goal'}</h3>
        </div>
        {onClose ? (
          <IconButton aria-label="Close" onClick={onClose}>
            <Icon name="close" size={16} />
          </IconButton>
        ) : null}
      </PanelHead>

      {state === 'goal' ? null : (
        <div className="mx-5 flex items-center gap-4 rounded-md bg-bg-200 px-4 py-3">
          <ProgressRing
            value={prog}
            size={56}
            tone={state === 'available' ? 'warn' : 'up'}
            label={node.title}
          />
          <div>
            <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge>
            <p className="mt-6px text-12px text-ink-faint">{dateLine}</p>
          </div>
        </div>
      )}

      <PanelBody>
        {state === 'goal' ? (
          <PanelSection>
            <GoalForm key={node.id} onSave={upd} />
          </PanelSection>
        ) : (
          <>
            {node.description ? <PanelDesc>{node.description}</PanelDesc> : null}

            {node.metric ? (
              <PanelSection>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Eyebrow>Tracked automatically</Eyebrow>
                  <Badge tone="info">{node.metric.source || 'Source'}</Badge>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-ink-muted">{node.metric.label}</span>
                  <Num className="text-16px">
                    {format(node.metric.current, node.metric.format)}
                    <span className="text-ink-faint">
                      {' '}
                      / {format(node.metric.target, node.metric.format)}
                    </span>
                  </Num>
                </div>
                <Meter value={prog} />
                <span className="text-12px text-ink-faint">Read-only · updates on every sync</span>
              </PanelSection>
            ) : null}

            {!node.metric && steps.length ? (
              <PanelSection>
                <Eyebrow>
                  Steps · {steps.filter((s) => s.done).length} of {steps.length}
                </Eyebrow>
                <ul className="flex flex-col gap-2px">
                  {steps.map((s, i) => (
                    <li key={s.id ?? i}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={s.done}
                        className={cn(
                          'flex w-full cursor-pointer items-start gap-10px rounded-sm bg-transparent p-2 text-left font-sans text-body text-ink transition-colors duration-fast ease-out hover:bg-bg-200',
                          s.done && 'text-ink-muted',
                        )}
                        onClick={() => {
                          const next = steps.map((x, j) => (j === i ? { ...x, done: !x.done } : x));
                          upd({
                            steps: next,
                            doneAt: next.every((x) => x.done)
                              ? (node.doneAt ?? new Date().toISOString().slice(0, 10))
                              : null,
                          });
                        }}
                      >
                        <CheckBox checked={s.done} />
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </PanelSection>
            ) : null}

            {!node.metric && !steps.length && maxLevel ? (
              <PanelSection>
                <Eyebrow>Level</Eyebrow>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Level down"
                    disabled={!((node.level ?? 0) > 0)}
                    onClick={() => upd({ level: Math.max(0, (node.level ?? 0) - 1) })}
                  >
                    <Icon name="minus" size={14} />
                  </Button>
                  <Num className="min-w-12 text-center text-16px">
                    {node.level ?? 0} / {maxLevel}
                  </Num>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Level up"
                    disabled={(node.level ?? 0) >= maxLevel}
                    onClick={() => upd({ level: Math.min(maxLevel, (node.level ?? 0) + 1) })}
                  >
                    <Icon name="plus" size={14} />
                  </Button>
                </div>
              </PanelSection>
            ) : null}

            {requires.length ? (
              <PanelSection>
                <Eyebrow>Requires</Eyebrow>
                <div className="flex flex-wrap items-center gap-2">
                  {requires.map((id) => {
                    const r = byId[id];
                    return r ? chip(r) : null;
                  })}
                </div>
              </PanelSection>
            ) : null}

            {unlocks.length ? (
              <PanelSection>
                <Eyebrow>Unlocks</Eyebrow>
                <div className="flex flex-wrap items-center gap-2">{unlocks.map(chip)}</div>
              </PanelSection>
            ) : null}

            {node.notes ? (
              <PanelSection>
                <Eyebrow>Notes</Eyebrow>
                <PanelDesc className="m-0">{node.notes}</PanelDesc>
              </PanelSection>
            ) : null}
          </>
        )}
      </PanelBody>

      {state !== 'goal' && !node.metric && state !== 'locked' ? (
        <PanelFoot>
          {state === 'mastered' ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() =>
                upd({
                  doneAt: null,
                  level: node.maxLevel ? 0 : node.level,
                  progress: 0,
                  steps: node.steps?.map((s) => ({ ...s, done: false })),
                })
              }
            >
              Reset progress
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Icon name="check" size={14} stroke={2.25} />}
              onClick={() =>
                upd({
                  doneAt: new Date().toISOString().slice(0, 10),
                  level: node.maxLevel ?? node.level,
                  progress: 1,
                  steps: node.steps?.map((s) => ({ ...s, done: true })),
                })
              }
            >
              Mark mastered
            </Button>
          )}
        </PanelFoot>
      ) : null}
    </Panel>
  );
}
