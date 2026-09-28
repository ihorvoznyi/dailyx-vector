'use client';

import { GridLine, Tick } from '../../atoms/chart';
import { Legend, LegendItem } from '../../atoms/legend';
import { cn } from '../../lib/cn';
import { signed } from '../../lib/hypothesis';
import type { HypStatus } from '../../lib/hypothesis';
import { niceTicks } from '../../lib/ticks';
import { useWidth } from '../../lib/use-width';

/** One effect row: estimate with its 90% interval. */
export interface ForestRow {
  code?: string;
  label: string;
  est: number;
  lo: number;
  hi: number;
  status?: HypStatus;
}

export interface ForestPlotProps {
  rows: ForestRow[];
  unit?: string;
  domain?: [number, number];
  onSelect?: (row: ForestRow) => void;
  legend?: boolean;
  compact?: boolean;
  label?: string;
}

const TONE_COLOR = {
  info: 'var(--color-info)',
  up: 'var(--color-up)',
  down: 'var(--color-down)',
  flat: 'var(--color-ink-faint)',
};

function toneOf(row: ForestRow): keyof typeof TONE_COLOR {
  if (row.status === 'running') return 'info';
  if (row.lo > 0) return 'up';
  if (row.hi < 0) return 'down';
  return 'flat';
}

/**
 * ForestPlot compares all experiments at once: each row is a hypothesis's effect on its target
 * metric with its 90% interval, against a zero line. Sort rows by code, or by effect when
 * reviewing what to adopt.
 */
export function ForestPlot({
  rows,
  unit = 'pp',
  domain,
  onSelect,
  legend,
  compact,
  label,
}: ForestPlotProps) {
  const [ref, W] = useWidth(640);
  const RH = 36;
  const labelW = compact ? 0 : W < 520 ? 120 : 220;
  const valW = compact ? 118 : 104;
  const top = 6;
  const H = rows.length * RH + 34;
  let lo = domain ? domain[0] : Math.min(-5, ...rows.map((r) => r.lo));
  let hi = domain ? domain[1] : Math.max(5, ...rows.map((r) => r.hi));
  const m = Math.max(Math.abs(lo), Math.abs(hi));
  lo = -m;
  hi = m;
  const ticks = compact
    ? [lo, 0, hi]
    : niceTicks(lo, hi, 4).filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);
  const x0 = labelW + (compact ? 4 : 8);
  const x1 = W - valW - 8;
  const X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  const maxChars = W < 520 ? 12 : 26;

  return (
    <div className="relative w-full" ref={ref}>
      <svg
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full overflow-visible"
        role="img"
        aria-label={label || 'Effect sizes with 90% intervals'}
      >
        {ticks.map((t) => (
          <g key={t}>
            <GridLine x1={X(t)} x2={X(t)} y1={top} y2={H - 24} strokeOpacity={t === 0 ? 0 : 0.5} />
            <Tick x={X(t)} y={H - 6} textAnchor="middle">
              {signed(t, unit)}
            </Tick>
          </g>
        ))}
        <line
          x1={X(0)}
          x2={X(0)}
          y1={top - 2}
          y2={H - 22}
          stroke="var(--color-line-control)"
          strokeDasharray="3 3"
        />
        {rows.map((r, i) => {
          const y = top + i * RH + RH / 2;
          const tn = toneOf(r);
          const c = TONE_COLOR[tn];
          const truncated =
            r.label.length > maxChars ? `${r.label.slice(0, maxChars - 1)}…` : r.label;
          return (
            <g
              key={r.code || i}
              className={cn('group', onSelect && 'cursor-pointer')}
              onClick={onSelect ? () => onSelect(r) : undefined}
            >
              <rect
                x={0}
                y={y - RH / 2}
                width={W}
                height={RH}
                fill="transparent"
                className="group-hover:fill-bg-200"
              />
              {compact ? null : (
                <text
                  x={0}
                  y={y + 4}
                  className="fill-ink-faint font-mono text-11px leading-none font-medium"
                >
                  {r.code || ''}
                </text>
              )}
              {compact ? null : (
                <text
                  x={r.code ? 44 : 0}
                  y={y + 4}
                  className="fill-ink font-sans text-13px leading-none font-medium"
                >
                  {truncated}
                </text>
              )}
              <path
                className="animate-draw"
                d={`M${X(r.lo)} ${y} L${X(r.hi)} ${y}`}
                stroke={c}
                strokeWidth={2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                style={{ animationDelay: `${i * 70}ms` }}
              />
              <rect
                className="animate-fade"
                x={X(r.est) - 5}
                y={y - 5}
                width={10}
                height={10}
                rx={2}
                fill={tn === 'info' ? 'var(--color-bg-100)' : c}
                stroke={c}
                strokeWidth={2}
                transform={`rotate(45 ${X(r.est)} ${y})`}
              />
              <text
                x={W}
                y={y + 4}
                textAnchor="end"
                className="font-mono text-11px leading-none font-medium tabular-nums whitespace-pre"
                fill={tn === 'flat' ? 'var(--color-ink-muted)' : c}
              >
                {`${signed(r.est, unit)}  [${signed(r.lo, '')}, ${signed(r.hi, '')}]`}
              </text>
            </g>
          );
        })}
      </svg>
      {legend === false ? null : (
        <Legend>
          <LegendItem color="var(--color-up)">Helps (interval above 0)</LegendItem>
          <LegendItem color="var(--color-down)">Hurts</LegendItem>
          <LegendItem color="var(--color-ink-faint)">Can’t tell</LegendItem>
          <LegendItem color="var(--color-info)">Still running</LegendItem>
        </Legend>
      )}
    </div>
  );
}
