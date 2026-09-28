'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '../button';
import { SegmentedControl } from '../segmented-control';
import { Eyebrow } from '../../atoms/eyebrow';
import { Input, Select, Textarea } from '../../atoms/input';
import { Panel, PanelBody, PanelDesc, PanelFoot, panelMode } from '../../atoms/panel';
import { cn } from '../../lib/cn';
import { METHODS } from '../../lib/hypothesis';
import type { Hypothesis, MetricDef } from '../../lib/hypothesis';
import { HypothesisHead } from './hypothesis-head';

export interface HypothesisDraftProps {
  hypothesis: Hypothesis;
  metrics: MetricDef[];
  today: string;
  onChange?: (h: Hypothesis) => void;
  onClose?: () => void;
  className?: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-6px">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </label>
  );
}

/**
 * The pre-registration form for a draft or idea: the statement fields, method, stop and kill
 * rules and confidence. Its draft state is local to one hypothesis id — the caller keys it by
 * `hypothesis.id` so switching hypotheses starts a fresh draft instead of resetting in an effect.
 */
export function HypothesisDraft({
  hypothesis,
  metrics,
  today,
  onChange,
  onClose,
  className,
}: HypothesisDraftProps) {
  const [draft, setDraft] = useState<Hypothesis>(hypothesis);
  const metric = metrics.find(
    (m) => m.id === (hypothesis.status === 'draft' ? draft.metric : hypothesis.metric),
  );

  return (
    <Panel
      mode={panelMode(className)}
      className={cn('box-content', className)}
      aria-label={`${hypothesis.code || 'Hypothesis'} details`}
    >
      <HypothesisHead hypothesis={hypothesis} metric={metric} onClose={onClose} />
      <PanelBody>
        <PanelDesc className="text-12px">
          Write it down before you start. Once running, these fields lock so the goalposts can’t
          move.
        </PanelDesc>
        <Field label="If I…">
          <Input
            value={draft.change ?? ''}
            placeholder="add a 60-second Loom to every proposal"
            onChange={(e) => setDraft({ ...draft, change: e.target.value })}
          />
        </Field>
        <Field label="then this metric">
          <Select
            value={draft.metric ?? ''}
            onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
          >
            <option value="" disabled>
              Choose a metric
            </option>
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-hyp-form items-end gap-2">
          <Field label="will">
            <SegmentedControl
              label="Direction"
              options={[
                { value: 'up', label: '▲ RISE' },
                { value: 'down', label: '▼ FALL' },
              ]}
              value={draft.direction ?? 'up'}
              onChange={(v) => setDraft({ ...draft, direction: v as 'up' | 'down' })}
            />
          </Field>
          <Field label="by">
            <Input
              value={draft.amount ?? ''}
              placeholder="5pp"
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            />
          </Field>
          <Field label="within">
            <Input
              type="number"
              value={draft.windowDays ?? ''}
              placeholder="21"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  windowDays: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
        <Field label="because">
          <Textarea
            rows={2}
            value={draft.because ?? ''}
            placeholder="clients see my face and trust a person, not a template"
            onChange={(e) => setDraft({ ...draft, because: e.target.value })}
          />
        </Field>
        <Field label="Method">
          <SegmentedControl
            label="Method"
            options={METHODS}
            value={draft.method ?? 'alternate'}
            onChange={(v) => setDraft({ ...draft, method: v as Hypothesis['method'] })}
          />
        </Field>
        <Field label="Stop rule">
          <Input
            value={draft.stopRule ?? ''}
            placeholder="30 proposals or 21 days"
            onChange={(e) => setDraft({ ...draft, stopRule: e.target.value })}
          />
        </Field>
        <Field label="Kill rule">
          <Input
            value={draft.killRule ?? ''}
            placeholder="reply rate < 20% after 15"
            onChange={(e) => setDraft({ ...draft, killRule: e.target.value })}
          />
        </Field>
        <Field label={`How sure am I? ${Math.round((draft.confidence ?? 0.6) * 100)}%`}>
          <input
            type="range"
            className="m-0 h-5 w-full cursor-pointer accent-up"
            min={50}
            max={99}
            value={Math.round((draft.confidence ?? 0.6) * 100)}
            onChange={(e) => setDraft({ ...draft, confidence: Number(e.target.value) / 100 })}
          />
        </Field>
      </PanelBody>
      <PanelFoot>
        <Button
          variant="primary"
          size="sm"
          disabled={!(draft.change && draft.metric)}
          onClick={() =>
            onChange?.({
              ...hypothesis,
              ...draft,
              status: 'running',
              startedAt: today,
              n: 0,
              pBetter: null,
              nTarget: hypothesis.nTarget || parseInt(draft.stopRule ?? '', 10) || 30,
            })
          }
        >
          Start experiment
        </Button>
      </PanelFoot>
    </Panel>
  );
}
