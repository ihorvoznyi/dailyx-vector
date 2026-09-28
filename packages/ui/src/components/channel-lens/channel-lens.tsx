'use client';

import { Monogram } from '../../atoms/monogram';
import { cn } from '../../lib/cn';

export interface ChannelLensProps {
  items: {
    id: string;
    name: string;
    mark?: string;
    sub?: string;
    badge?: string;
    badgeTone?: 'warn';
  }[];
  value: string;
  onChange?: (id: string) => void;
  label?: string;
}

/**
 * ChannelLens switches the acquisition view between channels, and "All channels", with each
 * tab showing its hours and how many replies are waiting. The lens changes words, not layout:
 * every channel view has the same four blocks, so switching never costs a re-learn.
 */
export function ChannelLens({ items, value, onChange, label }: ChannelLensProps) {
  return (
    <div
      className="no-scrollbar flex gap-2 overflow-x-auto p-2px"
      role="tablist"
      aria-label={label ?? 'Channel'}
    >
      {items.map((it) => {
        const sel = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={sel}
            className={cn(
              'inline-flex h-52px flex-none cursor-pointer items-center gap-10px rounded-md border border-line-strong bg-bg-100 pr-14px pl-2 text-ink-muted transition-colors duration-fast ease-out hover:border-line-control hover:text-ink',
              sel && 'border-up bg-bg-200 text-ink shadow-tab-sel',
            )}
            onClick={() => onChange?.(it.id)}
          >
            <Monogram size="lg" selected={sel}>
              {it.mark ?? '∑'}
            </Monogram>
            <span className="flex flex-col items-start leading-16px">
              <span className="text-14px font-semibold">{it.name}</span>
              {it.sub ? <span className="font-mono text-11px text-ink-faint">{it.sub}</span> : null}
            </span>
            {it.badge ? (
              <span
                className={cn(
                  'box-content inline-grid h-5 min-w-5 place-items-center rounded-pill bg-bg-300 px-6px font-mono text-11px leading-none font-semibold text-ink',
                  it.badgeTone === 'warn' && 'bg-warn text-on-warn',
                )}
              >
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
