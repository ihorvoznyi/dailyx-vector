import type { ReactNode } from 'react';

import { Eyebrow } from '../../atoms/eyebrow';
import { Meter } from '../../atoms/meter';
import { Num } from '../../atoms/num';
import type { Payout } from '../../lib/certainty';
import { KIND } from '../../lib/kind';
import { money, perHour } from '../../lib/money';
import { Badge } from '../badge';
import { Card } from '../card';
import { PayoutBar } from '../payout-bar';

export interface ProjectCardProps {
  project: {
    title: string;
    client: string;
    kind?: string;
    summary?: string;
    due?: string;
    payout: Payout;
    milestones: {
      title: string;
      amount: number;
      status?: 'paid' | 'done' | 'active' | 'next' | 'blocked';
    }[];
    progress?: number;
    hoursLogged?: number;
    hoursEstimate?: number;
  };
  footer?: ReactNode;
}

const MS = {
  paid: ['up', '✓ Paid'],
  done: ['info', 'Delivered'],
  active: ['info', 'In progress'],
  next: ['neutral', 'Next'],
  blocked: ['warn', 'Blocked'],
} as const;

const DOT = {
  paid: 'border-up bg-up',
  done: 'border-info',
  active: 'border-info bg-info-soft ring-4 ring-info/15',
  next: '',
  blocked: 'border-warn',
} as const;

/**
 * ProjectCard is the inside of one engagement: what's being built, milestones with their money,
 * and whether the hours are eating the rate.
 */
export function ProjectCard({ project: pr, footer }: ProjectCardProps) {
  const total = pr.milestones.reduce((a, m) => a + (m.amount || 0), 0);
  const plannedRate = pr.hoursEstimate ? total / pr.hoursEstimate : null;
  const over =
    pr.hoursLogged && pr.progress != null && pr.hoursEstimate
      ? pr.hoursLogged / Math.max(0.01, pr.progress) - pr.hoursEstimate
      : 0;
  const forecastRate = over > 0 ? total / (pr.hoursEstimate! + over) : plannedRate;

  return (
    <Card
      eyebrow={pr.client + (pr.kind ? ' · ' + (KIND[pr.kind] ?? pr.kind) : '')}
      title={pr.title}
      meta={pr.summary}
      action={pr.due ? <Badge>Due {pr.due}</Badge> : null}
    >
      <div className="flex flex-col gap-18px">
        <PayoutBar parts={pr.payout} />
        <div>
          <div className="mb-6px flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>Milestones</Eyebrow>
            <Num className="text-12px text-ink-faint">
              {Math.round((pr.progress ?? 0) * 100)}% done
            </Num>
          </div>
          <ol className="flex flex-col">
            {pr.milestones.map((m, i) => {
              const status = m.status ?? 'next';
              const [tone, label] = MS[status];
              return (
                <li
                  key={i}
                  className="relative grid grid-cols-milestones items-center gap-10px py-2 not-last:after:absolute not-last:after:top-26px not-last:after:-bottom-10px not-last:after:left-6px not-last:after:w-2px not-last:after:bg-line-strong"
                >
                  <span
                    className={`z-1 size-14px rounded-pill border-2 border-line-control bg-bg-100 ${DOT[status]}`}
                  />
                  <span
                    className={`text-14px ${status === 'next' ? 'text-ink-muted' : 'text-ink'}`}
                  >
                    {m.title}
                  </span>
                  <Badge tone={tone}>{label}</Badge>
                  <Num className="text-right text-13px">{money(m.amount)}</Num>
                </li>
              );
            })}
          </ol>
        </div>
        {pr.hoursEstimate ? (
          <div className="flex flex-col gap-6px">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow>Hours</Eyebrow>
              <Num className="text-12px">
                {pr.hoursLogged ?? 0} logged / {pr.hoursEstimate} planned
              </Num>
            </div>
            <Meter
              value={(pr.hoursLogged ?? 0) / pr.hoursEstimate}
              color={over > 0 ? 'var(--color-warn)' : undefined}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-12px">
              <span className="text-ink-faint">Planned {perHour(Math.round(plannedRate!))}</span>
              {over > 0 ? (
                <span className="text-warn">
                  ▼ Heading for {perHour(Math.round(forecastRate!))} · ~{Math.round(over)}h over
                </span>
              ) : (
                <span className="text-up">On estimate</span>
              )}
            </div>
          </div>
        ) : null}
        {footer ?? null}
      </div>
    </Card>
  );
}
