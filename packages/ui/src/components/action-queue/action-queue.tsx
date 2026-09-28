'use client';

import { useState } from 'react';

import { CheckBox } from '../../atoms/check-box';
import { Num } from '../../atoms/num';
import { RoiBar } from '../../atoms/roi-bar';
import { cn } from '../../lib/cn';
import { format } from '../../lib/format';
import { money, perHour } from '../../lib/money';
import { Badge } from '../badge';

/** Something I could do this week, valued as amount × odds (× horizon if recurring). */
export interface Action {
  id: string;
  title: string;
  context?: string;
  kind?: string;
  amount: number;
  probability?: number;
  recurring?: boolean;
  hours: number;
  done?: boolean;
}

export interface ActionQueueProps {
  actions: Action[];
  onChange?: (a: Action[]) => void;
  baselineRate?: number;
  horizonMonths?: number;
}

function actionValue(a: Action, horizon: number): number {
  return (
    (a.amount || 0) * (a.probability == null ? 1 : a.probability) * (a.recurring ? horizon : 1)
  );
}

function fmtHours(x: number): string {
  return x < 1 ? `${Math.round(x * 60)} min` : `${format(x, { decimals: x % 1 ? 1 : 0 })}h`;
}

/**
 * ActionQueue ranks what to do next by expected money per hour of effort, against the hourly
 * rate I could earn by simply billing.
 */
export function ActionQueue({
  actions,
  onChange,
  baselineRate = 0,
  horizonMonths = 12,
}: ActionQueueProps) {
  const [inner, setInner] = useState(actions);
  const list = onChange ? actions : inner;
  const set = (next: Action[]) => {
    setInner(next);
    onChange?.(next);
  };
  const horizon = horizonMonths;
  const base = baselineRate;
  const rows = list
    .map((a) => {
      const value = actionValue(a, horizon);
      return { ...a, value, roi: value / Math.max(0.05, a.hours || 0.05) };
    })
    .sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || b.roi - a.roi);
  const maxLog = Math.log10(Math.max(...rows.map((r) => r.roi), base * 4, 10));
  const W = (r: number) => Math.max(3, Math.min(100, (Math.log10(Math.max(1, r)) / maxLog) * 100));

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-queue items-center gap-14px border-b border-line px-2 pb-2 font-mono text-eyebrow text-ink-faint uppercase max-720:hidden">
        <span>Action</span>
        <span className="text-right">Expected</span>
        <span className="text-right">Effort</span>
        <span>Return per hour</span>
      </div>
      {rows.map((a, i) => {
        const below = base > 0 && a.roi < base;
        return (
          <div
            key={a.id}
            className={cn(
              'grid grid-cols-queue items-center gap-14px rounded-sm border-b border-line px-2 py-3 transition duration-fast ease-out hover:bg-bg-200 max-720:grid-cols-main-auto max-720:gap-y-2',
              a.done && 'opacity-45',
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={a.done ? 'true' : 'false'}
                aria-label={`Done: ${a.title}`}
                className="mt-2px flex-none cursor-pointer"
                onClick={() => set(list.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)))}
              >
                <CheckBox checked={!!a.done} className="mt-0" />
              </button>
              <div className="min-w-0">
                <div className={cn('font-semibold text-ink', a.done && 'line-through')}>
                  {a.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-6px">
                  {a.context ? (
                    <span className="rounded-sm bg-bg-300 px-7px py-1px text-caption text-ink-muted">
                      {a.context}
                    </span>
                  ) : null}
                  {a.recurring ? <Badge tone="up">↻ Recurring</Badge> : null}
                  {a.kind ? <span className="text-12px text-ink-faint">{a.kind}</span> : null}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Num>{money(a.value)}</Num>
              {a.recurring || (a.probability != null && a.probability < 1) ? (
                <div className="text-11px text-ink-faint">
                  {a.recurring ? `${money(a.amount)}/mo × ${horizon}` : money(a.amount)}
                  {a.probability != null && a.probability < 1
                    ? ` × ${Math.round(a.probability * 100)}%`
                    : ''}
                </div>
              ) : null}
            </div>
            <div className="text-right font-mono tabular-nums text-ink-muted max-720:hidden">
              {fmtHours(a.hours || 0)}
            </div>
            <RoiBar
              width={W(a.roi)}
              base={base ? W(base) : null}
              barColor={below ? 'var(--color-ink-faint)' : undefined}
              delay={i * 50}
            >
              <Num
                className="min-w-64px text-right text-13px"
                style={{ color: below ? 'var(--color-ink-faint)' : 'var(--color-ink)' }}
              >
                {perHour(Math.round(a.roi))}
              </Num>
            </RoiBar>
          </div>
        );
      })}
      {base ? (
        <div className="px-2 pt-3 text-12px text-ink-faint">
          <span className="relative top-2px mr-2 inline-block h-14px w-0 border-l-2 border-warn" />
          Baseline {perHour(base)} — what an hour of billable work pays. Below it, bill hours
          instead.
        </div>
      ) : null}
    </div>
  );
}
