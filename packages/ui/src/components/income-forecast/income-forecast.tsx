'use client';

import { useState } from 'react';

import { Legend, LegendItem } from '../../atoms/legend';
import { Num } from '../../atoms/num';
import { Swatch } from '../../atoms/swatch';
import { Tooltip, TooltipRow } from '../../atoms/tooltip';
import { GridLine, Tick } from '../../atoms/chart';
import { CERTAINTY, type Payout } from '../../lib/certainty';
import { cn } from '../../lib/cn';
import { format } from '../../lib/format';
import { money } from '../../lib/money';
import { niceTicks } from '../../lib/ticks';
import { useWidth } from '../../lib/use-width';

export interface IncomeForecastProps {
  weeks: ({ label: string; items?: string[] } & Payout)[];
  weeklyCost?: number;
  height?: number;
}

const totalOf = (w: Payout) => CERTAINTY.reduce((a, c) => a + (w[c.key] || 0), 0);

/**
 * IncomeForecast shows expected money per week for the coming weeks, stacked by certainty,
 * against what life costs per week.
 *
 * Hovering a week lists the amounts by certainty and the items behind them.
 *
 * Read it for gaps: a week whose solid bars sit under the cost line is where to schedule
 * selling, not building.
 */
export function IncomeForecast({ weeks, weeklyCost, height }: IncomeForecastProps) {
  const [ref, W] = useWidth(640);
  const H = height ?? 220;
  const pad = { t: 16, r: 8, b: 26, l: 52 };
  const top = Math.max(...weeks.map(totalOf), weeklyCost || 0) * 1.1 || 1;
  const ticks = niceTicks(0, top, 4);
  const y1 = ticks[ticks.length - 1]!;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const bw = iw / Math.max(1, weeks.length);
  const Y = (v: number) => pad.t + ih - (v / y1) * ih;
  const [hi, setHi] = useState<number | null>(null);
  const covered = weeks.filter(
    (w) => (w.received || 0) + (w.secured || 0) + (w.committed || 0) >= (weeklyCost || 0),
  ).length;
  const every = Math.ceil(weeks.length / Math.max(2, Math.floor(iw / 70)));

  return (
    <div>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setHi(null)}>
        <svg
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full overflow-visible"
          role="img"
          aria-label={`Expected income by week, ${covered} of ${weeks.length} weeks cover costs without pipeline`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <GridLine
                x1={pad.l}
                x2={W - pad.r}
                y1={Y(t)}
                y2={Y(t)}
                strokeOpacity={t === 0 ? 1 : 0.5}
              />
              <Tick x={pad.l - 10} y={Y(t) + 4} textAnchor="end">
                {format(t, { prefix: '$', compact: true })}
              </Tick>
            </g>
          ))}
          {weeks.map((w, i) => {
            const x = pad.l + i * bw + bw * 0.18;
            const bwi = bw * 0.64;
            let acc = 0;
            return (
              <g key={i} onMouseEnter={() => setHi(i)}>
                <rect
                  x={pad.l + i * bw}
                  y={pad.t}
                  width={bw}
                  height={ih}
                  fill={hi === i ? 'var(--color-bg-200)' : 'transparent'}
                />
                {CERTAINTY.map((c) => {
                  const v = w[c.key] || 0;
                  if (!v) return null;
                  const y = Y(acc + v);
                  const hh = Y(acc) - Y(acc + v);
                  acc += v;
                  return (
                    <rect
                      key={c.key}
                      className={cn('origin-bottom animate-grow-y transform-fill', c.svg)}
                      x={x}
                      y={y}
                      width={bwi}
                      height={Math.max(0, hh - 1.5)}
                      rx={3}
                      strokeWidth={c.key === 'pipeline' ? 1 : undefined}
                      strokeDasharray={c.key === 'pipeline' ? '3 3' : undefined}
                      style={{ animationDelay: `${i * 40}ms` }}
                    />
                  );
                })}
                {i % every === 0 ? (
                  <Tick x={x + bwi / 2} y={H - 6} textAnchor="middle">
                    {w.label}
                  </Tick>
                ) : null}
              </g>
            );
          })}
          {weeklyCost ? (
            <g>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={Y(weeklyCost)}
                y2={Y(weeklyCost)}
                stroke="var(--color-warn)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <Tick
                x={W - pad.r}
                y={Y(weeklyCost) - 6}
                textAnchor="end"
                style={{ fill: 'var(--color-warn)' }}
              >
                Costs {money(weeklyCost)}/wk
              </Tick>
            </g>
          ) : null}
        </svg>
        {hi != null ? (
          <Tooltip
            x={Math.min(Math.max(pad.l + (hi + 0.5) * bw, 90), W - 90)}
            y={Y(totalOf(weeks[hi]!))}
          >
            <div className="mb-1 text-ink-faint">Week of {weeks[hi]!.label}</div>
            {CERTAINTY.map((c) => {
              const v = weeks[hi]![c.key];
              if (!v) return null;
              return (
                <TooltipRow key={c.key}>
                  <Swatch className={c.bg} />
                  <span className="text-ink-muted">{c.label}</span>
                  <Num className="ml-auto pl-3 text-ink">{money(v)}</Num>
                </TooltipRow>
              );
            })}
            {weeks[hi]!.items?.length ? (
              <div className="mt-6px border-t border-line-strong pt-6px">
                {weeks[hi]!.items.map((t, j) => (
                  <div key={j} className="text-ink-faint">
                    {t}
                  </div>
                ))}
              </div>
            ) : null}
          </Tooltip>
        ) : null}
      </div>
      <Legend>
        {CERTAINTY.map((c) => (
          <LegendItem key={c.key} swatchClassName={c.bg}>
            {c.label}
            <span className="text-ink-faint">{c.note}</span>
          </LegendItem>
        ))}
      </Legend>
    </div>
  );
}
