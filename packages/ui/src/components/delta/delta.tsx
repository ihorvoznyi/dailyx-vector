import { cva } from 'class-variance-authority';

import { DirectionGlyph } from '../../atoms/direction-glyph';
import { cn } from '../../lib/cn';
import { directionOf } from '../../lib/direction';
import { format } from '../../lib/format';

const delta = cva(
  'inline-flex h-22px items-center gap-1 rounded-sm px-7px font-mono text-caption font-medium whitespace-nowrap tabular-nums',
  {
    variants: {
      good: {
        up: 'bg-up-soft text-up',
        down: 'bg-down-soft text-down',
        flat: 'bg-bg-300 text-ink-muted',
      },
      plain: { true: 'h-auto bg-transparent p-0' },
    },
  },
);

export interface DeltaProps {
  value: number;
  format?: 'pct' | 'abs';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
  invert?: boolean;
  plain?: boolean;
}

/**
 * A change with its direction glyph (▲ ▼ ■), sign and colour. `pct` (default, one decimal) or
 * `abs` (with prefix). `invert` for metrics where down is good (burn). `plain` drops the chip.
 */
export function Delta({
  value,
  format: kind,
  prefix,
  suffix,
  decimals,
  compact,
  invert = false,
  plain,
}: DeltaProps) {
  const dir = directionOf(value);
  const good = dir === 'flat' ? 'flat' : (dir === 'up') !== invert ? 'up' : 'down';
  const abs = Math.abs(value);
  const text =
    kind === 'abs'
      ? format(abs, { prefix, suffix, decimals: decimals ?? 0, compact })
      : format(abs, { suffix: '%', decimals: decimals ?? 1 });
  const sign = dir === 'up' ? '+' : dir === 'down' ? '−' : '';
  const label = `${dir === 'up' ? 'up ' : dir === 'down' ? 'down ' : 'unchanged '}${text}`;
  return (
    <span className={cn(delta({ good, plain }))} aria-label={label} title={label}>
      <DirectionGlyph value={value} className="text-9px" />
      {sign + text}
    </span>
  );
}
