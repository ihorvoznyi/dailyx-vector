'use client';

import { useId, useState, type MouseEvent } from 'react';

import { GridLine, Tick } from '../../atoms/chart';
import { Legend, LegendItem } from '../../atoms/legend';
import { Num } from '../../atoms/num';
import { Swatch } from '../../atoms/swatch';
import { Tooltip, TooltipRow } from '../../atoms/tooltip';
import { format, type NumberFormat } from '../../lib/format';
import { seriesColor } from '../../lib/series';
import { niceTicks } from '../../lib/ticks';
import { useWidth } from '../../lib/use-width';

/** One point of a TrendChart series. */
export interface Point {
  x: string;
  y: number;
  label?: string;
}

export interface TrendChartProps {
  series: { name: string; data: Point[]; color?: string; dashed?: boolean; area?: boolean }[];
  format?: NumberFormat;
  height?: number;
  zero?: boolean;
  legend?: boolean;
  label?: string;
  markers?: {
    at: number | string;
    label: string;
    tone?: 'info' | 'up' | 'down' | 'warn' | 'neutral';
    row?: number;
  }[];
}

const PAD = { t: 12, r: 8, b: 26, l: 52 };

const MARKER_COLOR: Record<'info' | 'up' | 'down' | 'warn' | 'neutral', string> = {
  info: 'var(--color-info)',
  up: 'var(--color-up)',
  down: 'var(--color-down)',
  warn: 'var(--color-warn)',
  neutral: 'var(--color-ink-faint)',
};

/**
 * TrendChart is the time-series chart: animated line draw, soft area fill, crosshair tooltip.
 * Series 1 is the metric; a dashed series 2 is the comparison period. The line redraws when data
 * changes (range switch), over `dur-chart` with `ease-out`.
 */
export function TrendChart({
  series,
  format: f = {},
  height = 220,
  zero,
  legend,
  label,
  markers = [],
}: TrendChartProps) {
  const [ref, W] = useWidth<HTMLDivElement>(640);
  const H = height;
  const [hi, setHi] = useState<number | null>(null);
  const gid = useId();
  const n = series[0]?.data.length ?? 0;

  const all = series.flatMap((s) => s.data.map((d) => d.y));
  let lo = Math.min(...all);
  const top = Math.max(...all);
  if (zero) lo = Math.min(0, lo);
  const ticks = niceTicks(lo, top, 4);
  const y0 = ticks[0]!;
  const y1 = ticks[ticks.length - 1]!;
  const iw = Math.max(10, W - PAD.l - PAD.r);
  const ih = H - PAD.t - PAD.b;
  const X = (i: number) => PAD.l + (n > 1 ? (i / (n - 1)) * iw : iw / 2);
  const Y = (v: number) => PAD.t + ih - ((v - y0) / (y1 - y0 || 1)) * ih;
  const colorOf = (s: TrendChartProps['series'][number], i: number) => s.color ?? seriesColor(i);
  const sig = series
    .map((s) => `${s.name}${s.data.length}${s.data[0]?.y}${s.data[n - 1]?.y}`)
    .join('|');
  const xEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 90))));

  const move = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const i = Math.round(((x - PAD.l) / iw) * (n - 1));
    setHi(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full">
      <svg
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={move}
        onMouseLeave={() => setHi(null)}
        role="img"
        aria-label={label ?? series[0]?.name ?? 'trend chart'}
        className="block w-full overflow-visible"
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${gid}${i}`} x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0%" stopColor={colorOf(s, i)} stopOpacity={i === 0 ? 0.26 : 0.1} />
              <stop offset="100%" stopColor={colorOf(s, i)} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <GridLine
              x1={PAD.l}
              x2={W - PAD.r}
              y1={Y(t)}
              y2={Y(t)}
              strokeOpacity={t === y0 ? 1 : 0.55}
            />
            <Tick x={PAD.l - 10} y={Y(t) + 4} textAnchor="end">
              {format(t, { prefix: f.prefix, suffix: f.suffix, compact: true })}
            </Tick>
          </g>
        ))}
        {series[0]?.data.map((d, i) => {
          if (i % xEvery !== 0 && i !== n - 1) return null;
          if (i !== n - 1 && n - 1 - i < xEvery * 0.6) return null;
          return (
            <Tick
              key={i}
              x={X(i)}
              y={H - 6}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            >
              {d.x}
            </Tick>
          );
        })}
        {series.map((s, i) => {
          const line = s.data
            .map((d, j) => `${j ? 'L' : 'M'}${X(j).toFixed(1)} ${Y(d.y).toFixed(1)}`)
            .join(' ');
          const area = `${line} L${X(n - 1)} ${Y(y0)} L${X(0)} ${Y(y0)} Z`;
          const col = colorOf(s, i);
          return (
            <g key={sig + i}>
              {s.area === false ? null : (
                <path className="animate-fade" d={area} fill={`url(#${gid}${i})`} />
              )}
              {s.dashed ? (
                <path
                  className="animate-fade"
                  d={line}
                  fill="none"
                  stroke={col}
                  strokeWidth={i === 0 ? 2 : 1.5}
                  strokeDasharray="4 4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  className="animate-draw"
                  d={line}
                  fill="none"
                  stroke={col}
                  strokeWidth={i === 0 ? 2 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                />
              )}
            </g>
          );
        })}
        {markers.map((m, j) => {
          const i =
            typeof m.at === 'number'
              ? m.at
              : (series[0]?.data.findIndex((d) => d.x === m.at) ?? -1);
          if (i < 0 || i >= n) return null;
          const col = MARKER_COLOR[m.tone ?? 'neutral'];
          const right = X(i) > W - 90;
          return (
            <g key={`mk${j}`}>
              <line
                x1={X(i)}
                x2={X(i)}
                y1={PAD.t}
                y2={PAD.t + ih}
                stroke={col}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <Tick
                x={right ? X(i) - 5 : X(i) + 5}
                y={PAD.t + 9 + (m.row ?? 0) * 13}
                textAnchor={right ? 'end' : 'start'}
                style={{ fill: col }}
              >
                {m.label}
              </Tick>
            </g>
          );
        })}
        {hi != null ? (
          <g>
            <line
              className="stroke-line-control"
              strokeDasharray="3 3"
              x1={X(hi)}
              x2={X(hi)}
              y1={PAD.t}
              y2={PAD.t + ih}
            />
            {series.map((s, i) => (
              <circle
                key={i}
                cx={X(hi)}
                cy={Y(s.data[hi]!.y)}
                r={4}
                fill="var(--color-bg-100)"
                stroke={colorOf(s, i)}
                strokeWidth={2}
              />
            ))}
          </g>
        ) : null}
      </svg>
      {hi != null && series[0] ? (
        <Tooltip x={Math.min(Math.max(X(hi), 70), W - 70)} y={Y(series[0].data[hi]!.y)}>
          <div className="mb-1 text-ink-faint">
            {series[0].data[hi]!.label || series[0].data[hi]!.x}
          </div>
          {series.map((s, i) => (
            <TooltipRow key={i}>
              <Swatch color={colorOf(s, i)} />
              <span className="text-ink-muted">{s.name}</span>
              <Num className="ml-auto pl-3 text-ink">{format(s.data[hi]!.y, f)}</Num>
            </TooltipRow>
          ))}
        </Tooltip>
      ) : null}
      {series.length > 1 && legend !== false ? (
        <Legend>
          {series.map((s, i) => (
            <LegendItem key={i} color={colorOf(s, i)}>
              {s.name}
            </LegendItem>
          ))}
        </Legend>
      ) : null}
    </div>
  );
}
