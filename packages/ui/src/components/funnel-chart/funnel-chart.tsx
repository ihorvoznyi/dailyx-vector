import { Num } from '../../atoms/num';
import { format, type NumberFormat } from '../../lib/format';

export interface FunnelChartProps {
  stages: { label: string; value: number; convLabel?: string; color?: string }[];
  format?: NumberFormat;
  summary?: boolean;
}

/**
 * FunnelChart shows the client-acquisition pipeline: proposals → views → conversations →
 * contracts, with step conversion rates. Bars grow left-to-right, staggered 90ms. Always pass the
 * same time window to every stage and say it in the Card eyebrow.
 */
export function FunnelChart({ stages, format: f, summary }: FunnelChartProps) {
  const max = stages.length ? stages[0]!.value || 1 : 1;
  const first = stages[0];
  const last = stages[stages.length - 1];
  return (
    <div>
      <div className="flex flex-col gap-6px" role="list" aria-label="Funnel">
        {stages.map((s, i) => {
          const rows = [];
          if (i > 0) {
            const prev = stages[i - 1]!.value;
            const conv = prev ? (s.value / prev) * 100 : 0;
            rows.push(
              <div
                key={`c${i}`}
                className="grid grid-cols-funnel gap-3 font-mono text-11px leading-16px font-medium text-ink-faint"
                aria-hidden
              >
                <span />
                <span className="pl-2px">
                  {'↳ ' +
                    format(conv, { decimals: conv < 10 ? 1 : 0 }) +
                    '% ' +
                    (s.convLabel ?? 'convert')}
                </span>
                <span />
              </div>,
            );
          }
          const pct = Math.max(1.5, (s.value / max) * 100);
          rows.push(
            <div key={s.label} className="grid grid-cols-funnel items-center gap-3">
              <span className="text-14px text-ink-muted">{s.label}</span>
              <div className="h-28px overflow-hidden rounded-sm bg-bg-300">
                <div
                  className="h-full origin-left animate-grow rounded-sm bg-up"
                  style={{
                    width: `${pct}%`,
                    animationDelay: `${i * 90}ms`,
                    opacity: 1 - i * 0.14,
                    background: s.color,
                  }}
                />
              </div>
              <Num className="text-right text-16px text-ink">{format(s.value, f)}</Num>
            </div>,
          );
          return rows;
        })}
      </div>
      {first && last && summary !== false ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-12px text-ink-faint">
            {first.label} → {last.label}
          </span>
          <Num className="text-16px text-up">
            {format((last.value / (first.value || 1)) * 100, { decimals: 1, suffix: '%' })}
          </Num>
        </div>
      ) : null}
    </div>
  );
}
