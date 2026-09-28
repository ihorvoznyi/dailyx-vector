import type { CSSProperties, ReactNode } from 'react';

import { cn } from '../../lib/cn';

export interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: 'up' | 'warn' | 'info' | 'down';
  label?: string;
  center?: ReactNode;
  showValue?: boolean;
}

const TONE = { up: 'stroke-up', warn: 'stroke-warn', info: 'stroke-info', down: 'stroke-down' };

/**
 * Progress toward a goal (0–1, clamped) as a ring that fills clockwise from the top on arrival.
 * Shows the percentage in the centre unless `center` or `showValue={false}`.
 */
export function ProgressRing({
  value,
  size = 48,
  stroke = 5,
  tone = 'up',
  label,
  center,
  showValue,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <span
      role="img"
      aria-label={`${label ?? 'progress'} ${Math.round(v * 100)}%`}
      className="relative inline-grid place-items-center"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          className="stroke-bg-300"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className={cn('animate-ring transition-all duration-chart ease-out', TONE[tone])}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ '--ring-empty': c } as CSSProperties}
        />
      </svg>
      {showValue === false ? null : (
        <span
          className={cn(
            'absolute font-mono leading-none font-medium text-ink',
            size >= 64 ? 'text-14px' : 'text-11px',
          )}
        >
          {center ?? `${Math.round(v * 100)}%`}
        </span>
      )}
    </span>
  );
}
