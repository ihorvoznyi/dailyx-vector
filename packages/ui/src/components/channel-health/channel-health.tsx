import type { ReactNode } from 'react';

import { Eyebrow } from '../../atoms/eyebrow';
import { Meter } from '../../atoms/meter';
import { cn } from '../../lib/cn';
import { Badge } from '../badge';

export interface ChannelHealthProps {
  items: {
    label: string;
    value: ReactNode;
    unit?: string;
    status?: 'ok' | 'watch' | 'fix' | 'info';
    note?: string;
    meter?: [number, number];
  }[];
}

const HEALTH = {
  ok: ['up', 'Healthy'],
  watch: ['warn', 'Watch'],
  fix: ['down', 'Fix'],
  info: ['neutral', 'Note'],
} as const;

/**
 * ChannelHealth is the channel's native vital signs: the numbers that break the channel when
 * ignored. Limits and caps are the ones I set ("Cap I set: 100"). Never present a platform
 * limit as fact unless it comes from the source.
 */
export function ChannelHealth({ items }: ChannelHealthProps) {
  return (
    <div className="grid grid-cols-health gap-3">
      {items.map((it, i) => {
        const status = it.status ?? 'info';
        const [tone, word] = HEALTH[status];
        return (
          <div
            key={i}
            className={cn(
              'flex flex-col gap-2 rounded-md border border-line bg-bg-200 p-14px',
              status === 'fix' && 'border-down',
              status === 'watch' && 'border-warn/45',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>{it.label}</Eyebrow>
              <Badge tone={tone}>{word}</Badge>
            </div>
            <div className="font-mono tabular-nums text-22px leading-26px text-ink">
              {it.value}
              {it.unit ? <span className="text-13px text-ink-faint"> {it.unit}</span> : null}
            </div>
            {it.meter ? (
              <Meter
                value={it.meter[0] / it.meter[1]}
                color={
                  status === 'fix'
                    ? 'var(--color-down)'
                    : status === 'watch'
                      ? 'var(--color-warn)'
                      : undefined
                }
              />
            ) : null}
            {it.note ? <div className="text-caption text-ink-faint">{it.note}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
