import { evidenceWord } from '../../lib/hypothesis';
import { Num } from '../../atoms/num';

export interface EvidenceMeterProps {
  value: number | null;
  threshold?: number;
  label?: string;
  compact?: boolean;
}

const COLOR = {
  up: 'var(--color-up)',
  down: 'var(--color-down)',
  info: 'var(--color-info)',
  warn: 'var(--color-warn)',
  neutral: 'var(--color-ink-faint)',
};

/**
 * EvidenceMeter shows the chance the change beats the baseline on a scale from "Hurts" through
 * "Coin flip" to "Works", with a verdict in words. Use it instead of p-values: with monthly
 * samples of 20–60, most tests say "not significant" and hide what the data does say.
 */
export function EvidenceMeter({ value, threshold = 0.95, label, compact }: EvidenceMeterProps) {
  const [word, tone] = evidenceWord(value, threshold);
  const color = COLOR[tone];
  return (
    <div
      className="flex flex-col gap-6px"
      role="img"
      aria-label={`${label || 'Chance B beats A'} ${value == null ? 'no data' : `${Math.round(value * 100)}%`}, ${word}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-12px text-ink-muted">{label || 'Chance B beats A'}</span>
        <Num className={compact ? 'text-14px' : 'text-20px'} style={{ color }}>
          {value == null ? '—' : `${Math.round(value * 100)}%`}
        </Num>
      </div>
      <div className="relative h-2 rounded-pill bg-bg-300">
        <div
          className={`absolute inset-y-0 animate-grow rounded-pill opacity-55 ${value != null && value >= 0.5 ? 'origin-left' : 'origin-right'}`}
          style={{
            left: `${Math.min(value ?? 0.5, 0.5) * 100}%`,
            width: `${Math.abs((value ?? 0.5) - 0.5) * 100}%`,
            background: color,
          }}
        />
        <span
          className="absolute -inset-y-3px -ml-1px w-2px bg-ink-faint"
          style={{ left: '50%' }}
        />
        <span
          className="absolute -inset-y-3px w-px bg-line-control"
          style={{ left: `${(1 - threshold) * 100}%` }}
        />
        <span
          className="absolute -inset-y-3px w-px bg-line-control"
          style={{ left: `${threshold * 100}%` }}
        />
        {value == null ? null : (
          <span
            className="absolute top-1/2 -mt-7px -ml-7px box-content size-14px animate-from-mid rounded-pill border-3 border-bg-100"
            style={{ left: `${value * 100}%`, background: color }}
          />
        )}
      </div>
      {compact ? null : (
        <div className="flex justify-between font-mono text-10px leading-14px font-medium tracking-scale text-ink-faint uppercase">
          <span>Hurts</span>
          <span>Coin flip</span>
          <span>Works</span>
        </div>
      )}
      {compact ? null : (
        <div className="mt-1 text-12px" style={{ color }}>
          {word}
        </div>
      )}
    </div>
  );
}
