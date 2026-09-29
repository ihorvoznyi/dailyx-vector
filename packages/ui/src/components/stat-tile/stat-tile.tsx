import { CountUp } from '../../atoms/count-up';
import { Eyebrow } from '../../atoms/eyebrow';
import { cn } from '../../lib/cn';
import { format, type NumberFormat } from '../../lib/format';
import { Badge } from '../badge';
import { Card } from '../card';
import { Delta } from '../delta';
import { Sparkline } from '../sparkline';

export interface StatTileProps {
  label: string;
  value: number;
  format?: NumberFormat;
  delta?: number;
  deltaFormat?: 'pct' | 'abs';
  deltaLabel?: string;
  invert?: boolean;
  spark?: number[];
  source?: string;
  hero?: boolean;
  delay?: number;
  /** A caption under the value, e.g. "Manual · updated 3 days ago". */
  note?: string;
  /** Stale data: warn border, a "Stale" warn Badge in place of `source`, note in warn ink. */
  stale?: boolean;
}

/**
 * A KPI tile: eyebrow label, a counting-up mono number, a Delta with its window, and an optional
 * Sparkline. `hero` is the one headline figure on a screen. `invert` flips the colours for costs.
 */
export function StatTile({
  label,
  value,
  format: f = {},
  delta,
  deltaFormat,
  deltaLabel,
  invert,
  spark,
  source,
  hero,
  delay,
  note,
  stale,
}: StatTileProps) {
  return (
    <Card delay={delay} className={stale ? 'border-warn' : undefined}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>{label}</Eyebrow>
          {stale ? <Badge tone="warn">Stale</Badge> : source ? <Badge>{source}</Badge> : null}
        </div>
        <div
          className={cn(
            'font-mono text-num-lg whitespace-nowrap text-ink tabular-nums',
            hero && 'text-num-hero',
          )}
          aria-label={format(value, f)}
        >
          <CountUp value={value} format={f} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            {delta != null ? (
              <Delta
                value={delta}
                invert={invert}
                format={deltaFormat}
                prefix={f.prefix}
                compact={f.compact}
              />
            ) : null}
            {deltaLabel ? (
              <span className="ml-1 text-caption text-ink-faint">{deltaLabel}</span>
            ) : null}
          </div>
          {spark ? (
            <Sparkline
              data={spark}
              tone={invert ? ((delta ?? 0) > 0 ? 'down' : 'up') : 'auto'}
              width={88}
              height={28}
            />
          ) : null}
        </div>
        {note ? (
          <p className={cn('text-caption', stale ? 'text-warn' : 'text-ink-faint')}>{note}</p>
        ) : null}
      </div>
    </Card>
  );
}
