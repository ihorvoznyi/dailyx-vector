'use client';

import { format, type NumberFormat } from '../../lib/format';
import { useWidth } from '../../lib/use-width';

export interface ChannelFunnelProps {
  stages: { label: string; value: number; universal?: string; flag?: string | null }[];
  baseline?: number[];
  baselineLabel?: string;
  format?: NumberFormat;
  bandHeight?: number;
  minWidth?: number;
  universal?: boolean;
}

function wrapWords(s: string, max: number): string[] {
  const out: string[] = [];
  let cur = '';
  s.split(' ').forEach((w) => {
    if (`${cur} ${w}`.trim().length > max && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = `${cur} ${w}`.trim();
    }
  });
  if (cur) out.push(cur);
  return out;
}

/**
 * ChannelFunnel shows a channel's pipeline in its own words (Proposals sent → Viewed → Hired,
 * Emails sent → Replied → Won) as ribbons that narrow by the share kept at each step. `baseline`
 * compares step rates against history (default wording: "my own 90-day average"); the step
 * furthest below its baseline is the Biggest leak, in warn. `flag` marks an unreliable stage
 * (e.g. email opens): its column is dashed, its value gets ≈, and it's never picked as the leak.
 * Compare against my own history, never an invented industry benchmark.
 */
export function ChannelFunnel({
  stages,
  baseline,
  baselineLabel,
  format: f,
  bandHeight,
  minWidth,
  universal = true,
}: ChannelFunnelProps) {
  const [ref, width] = useWidth<HTMLDivElement>(720);
  const W = Math.max(width, minWidth ?? 560);
  const st = stages;
  const n = st.length;
  const top = 12;
  const Hn = bandHeight ?? 104;
  const colW = 12;
  const H = top + Hn + 92;
  if (n < 2) return null;
  const padX = 8;
  const X = (i: number) => padX + i * ((W - 2 * padX - colW) / (n - 1));
  const rates = st.slice(1).map((s, i) => (st[i]!.value ? s.value / st[i]!.value : 0));
  const base = baseline ?? [];
  const score = rates.map((r, i) => (base[i] ? r / base[i] : null));
  let leak = -1;
  let worst = Infinity;
  rates.forEach((r, i) => {
    if (st[i]!.flag || st[i + 1]!.flag) return;
    const s = score[i] ?? 9;
    if (s < worst && s < 0.97) {
      worst = s;
      leak = i;
    }
  });
  const sig = st.map((s) => s.value).join('|');
  const label = (i: number) =>
    i === 0 ? ('start' as const) : i === n - 1 ? ('end' as const) : ('middle' as const);

  return (
    <div ref={ref} className="relative w-full overflow-x-auto">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: W }}
        className="block overflow-visible"
        role="img"
        aria-label={
          st.map((s) => `${s.label} ${s.value}`).join(', ') +
          (leak >= 0 ? `. Biggest leak: ${st[leak]!.label} to ${st[leak + 1]!.label}` : '')
        }
      >
        {rates.map((r, i) => {
          const x0 = X(i) + colW;
          const x1 = X(i + 1);
          const xm = (x0 + x1) / 2;
          const rr = Math.max(0.04, Math.min(1, r));
          const y1t = top + ((1 - rr) * Hn) / 2;
          const y1b = top + ((1 + rr) * Hn) / 2;
          const d = `M${x0} ${top} C${xm} ${top} ${xm} ${y1t} ${x1} ${y1t} L${x1} ${y1b} C${xm} ${y1b} ${xm} ${top + Hn} ${x0} ${top + Hn} Z`;
          const dpp = base[i] != null ? (r - base[i]) * 100 : null;
          const isLeak = i === leak;
          return (
            <g key={sig + i} className="animate-fade" style={{ animationDelay: `${i * 110}ms` }}>
              <path
                d={d}
                className={isLeak ? 'fill-warn stroke-warn' : 'fill-up stroke-up'}
                fillOpacity={isLeak ? 0.18 : 0.22}
                strokeOpacity={isLeak ? 0.8 : 0.5}
                strokeWidth={1}
              />
              <text
                x={xm + colW / 2}
                y={top + Hn / 2 - 2}
                textAnchor="middle"
                className="fill-ink font-mono text-15px leading-none font-semibold tabular-nums"
              >
                {format(r * 100, { decimals: r < 0.1 ? 1 : 0 }) + '%'}
              </text>
              {dpp != null ? (
                <text
                  x={xm + colW / 2}
                  y={top + Hn / 2 + 14}
                  textAnchor="middle"
                  className="font-mono text-11px leading-none font-medium"
                  style={{
                    fill:
                      Math.abs(dpp) < 0.5
                        ? 'var(--color-ink-muted)'
                        : dpp > 0
                          ? 'var(--color-up)'
                          : 'var(--color-down)',
                  }}
                >
                  {(dpp > 0.5 ? '▲ +' : dpp < -0.5 ? '▼ −' : '■ ') +
                    format(Math.abs(dpp), { decimals: Math.abs(dpp) < 10 ? 1 : 0 }) +
                    'pp'}
                </text>
              ) : null}
              {isLeak ? (
                <text
                  x={xm + colW / 2}
                  y={top + Hn + 4 - 2}
                  textAnchor="middle"
                  className="fill-warn font-mono text-10px leading-none font-semibold tracking-widest"
                >
                  BIGGEST LEAK
                </text>
              ) : null}
            </g>
          );
        })}
        {st.map((s, i) => {
          const lines = wrapWords(s.label, 14);
          const flagged = !!s.flag;
          const anchor = label(i);
          const dx = i === 0 ? -colW / 2 : i === n - 1 ? colW / 2 : 0;
          return (
            <g key={i}>
              <rect
                x={X(i)}
                y={top}
                width={colW}
                height={Hn}
                rx={4}
                className={flagged ? 'fill-bg-300 stroke-line-control' : 'fill-up'}
                strokeDasharray={flagged ? '3 3' : undefined}
              />
              <text
                x={X(i) + colW / 2}
                dx={dx}
                y={top + Hn + 30}
                textAnchor={anchor}
                className="fill-ink font-mono text-20px leading-none font-medium tabular-nums"
              >
                {(flagged ? '≈' : '') + format(s.value, f)}
              </text>
              {lines.map((ln, j) => (
                <text
                  key={j}
                  x={X(i) + colW / 2}
                  dx={dx}
                  y={top + Hn + 48 + j * 15}
                  textAnchor={anchor}
                  className="fill-ink-muted font-sans text-12px leading-none font-medium"
                >
                  {ln}
                </text>
              ))}
              {universal !== false && s.universal ? (
                <text
                  x={X(i) + colW / 2}
                  dx={dx}
                  y={top + Hn + 48 + lines.length * 15 + 2}
                  textAnchor={anchor}
                  className="fill-ink-faint font-mono text-10px leading-none font-medium tracking-widest"
                >
                  {s.universal.toUpperCase()}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {st.some((s) => s.flag) ? (
        <div className="mt-6px text-12px text-ink-faint">
          {st
            .filter((s) => s.flag)
            .map((s) => `≈ ${s.label}: ${s.flag}`)
            .join(' · ')}
        </div>
      ) : null}
      {base.length ? (
        <div className="mt-1 text-12px text-ink-faint">
          ▲▼ against {baselineLabel ?? 'my own 90-day average'}. Ribbons show the share kept at each
          step.
        </div>
      ) : null}
    </div>
  );
}
