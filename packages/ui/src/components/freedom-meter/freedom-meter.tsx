import type { ReactNode } from 'react';

import { CountUp } from '../../atoms/count-up';
import { Eyebrow } from '../../atoms/eyebrow';
import { Num } from '../../atoms/num';
import { Swatch } from '../../atoms/swatch';
import { format } from '../../lib/format';
import { money, perHour } from '../../lib/money';
import { Badge } from '../badge';

export interface FreedomMeterProps {
  monthlyCost: number;
  recurring: number;
  active?: number;
  runwayMonths?: number;
  hoursPerWeek?: number;
  targetHours?: number;
  effectiveRate?: number;
  recurringGrowth?: number;
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Eyebrow>{label}</Eyebrow>
      <Num
        className="text-20px leading-24px"
        style={{ color: tone ? `var(--color-${tone})` : 'var(--color-ink)' }}
      >
        {value}
      </Num>
      {sub ? <span className="text-12px text-ink-faint">{sub}</span> : null}
    </div>
  );
}

/**
 * FreedomMeter is the north star: how much of my monthly cost is covered by income that doesn't
 * need my hours, plus the numbers that decide how soon that reaches 100%.
 *
 * The bar shows recurring (solid `up`) and active (`sure-committed`) income against a dashed
 * `warn` cost line. The badge reads "✓ Free" at 100% or more, otherwise "≈ N mo to freedom", or
 * "Recurring income is flat" when there's no growth. Runway turns `warn` under 6 months and
 * `down` under 3. Hours turn `warn` at 30% over target.
 *
 * Once per screen, at the top of the money view. It is the reason every other number exists.
 */
export function FreedomMeter({
  monthlyCost,
  recurring,
  active = 0,
  runwayMonths,
  hoursPerWeek,
  targetHours,
  effectiveRate,
  recurringGrowth,
}: FreedomMeterProps) {
  const cost = monthlyCost || 1;
  const rec = recurring || 0;
  const act = active || 0;
  const ratio = rec / cost;
  const scale = Math.max(1.3, ((rec + act) / cost) * 1.05);
  const X = (v: number) => Math.min(100, (v / cost / scale) * 100);
  const gap = Math.max(0, cost - rec);
  const months =
    recurringGrowth != null && recurringGrowth > 0 && gap > 0
      ? Math.ceil(gap / recurringGrowth)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-6px font-mono text-56px leading-56px tracking-hero text-up tabular-nums max-sm:text-44px max-sm:leading-44px">
            <CountUp value={Math.round(ratio * 100)} format={{ suffix: '%' }} />
          </div>
          <p className="max-w-360px text-ink-muted">
            of my monthly costs are covered by income that arrives without me trading hours for it
          </p>
        </div>
        {ratio >= 1 ? (
          <Badge tone="up">✓ Free: recurring covers costs</Badge>
        ) : months ? (
          <Badge tone="info">
            ≈ {months} mo to freedom at +{money(recurringGrowth)}/mo
          </Badge>
        ) : (
          <Badge tone="warn">Recurring income is flat</Badge>
        )}
      </div>

      <div
        className="relative mt-22px h-28px rounded-8px bg-bg-300"
        role="img"
        aria-label={`Recurring ${money(rec)}, active ${money(act)}, monthly cost ${money(cost)}`}
      >
        <div
          className="absolute inset-y-0 left-0 origin-left animate-grow-meter rounded-l-8px bg-up"
          style={{ width: `${X(rec)}%` }}
        />
        <div
          className="absolute inset-y-0 ml-2px origin-left animate-grow-meter rounded-r-8px bg-sure-committed"
          style={{ left: `${X(rec)}%`, width: `${X(rec + act) - X(rec)}%` }}
        />
        <div
          className="absolute -top-22px -bottom-6px w-0 border-l-2 border-dashed border-warn"
          style={{ left: `${X(cost)}%` }}
        >
          <span className="absolute top-0 left-6px font-mono text-11px leading-14px font-medium whitespace-nowrap text-warn">
            Costs {money(cost)}/mo
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-6px text-12px text-ink-muted">
        <span className="flex flex-wrap items-center gap-6px">
          <Swatch color="var(--color-up)" />
          Recurring {money(rec)}/mo
          <span className="text-ink-faint">retainers, products, subscriptions</span>
        </span>
        <span className="flex flex-wrap items-center gap-6px">
          <Swatch className="bg-sure-committed" />
          Active {money(act)}/mo
          <span className="text-ink-faint">projects, hourly</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 border-t border-line pt-4 max-sm:grid-cols-2">
        <Stat
          label="Runway"
          value={`${format(runwayMonths, { decimals: 1 })} mo`}
          sub="liquid cash ÷ costs"
          tone={
            runwayMonths != null && runwayMonths < 3
              ? 'down'
              : runwayMonths != null && runwayMonths < 6
                ? 'warn'
                : null
          }
        />
        <Stat
          label="Hours / week"
          value={`${hoursPerWeek || 0}h`}
          sub={`target ${targetHours || '—'}h`}
          tone={
            targetHours && hoursPerWeek != null && hoursPerWeek > targetHours * 1.3 ? 'warn' : null
          }
        />
        <Stat label="Effective rate" value={perHour(effectiveRate)} sub="all income ÷ all hours" />
        <Stat
          label="Freedom gap"
          value={gap ? `${money(gap)}/mo` : '—'}
          sub={gap ? 'recurring still needed' : 'covered'}
          tone={gap ? null : 'up'}
        />
      </div>
    </div>
  );
}
