'use client';

import { useState } from 'react';

import { CheckBox } from '../../atoms/check-box';
import { Eyebrow } from '../../atoms/eyebrow';
import { IconButton } from '../../atoms/icon-button';
import { Monogram } from '../../atoms/monogram';
import { Num } from '../../atoms/num';
import { channels } from '../../lib/channels';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { Icon } from '../icon';

export interface ChannelPickerProps {
  value?: Record<string, number>;
  onChange?: (v: Record<string, number>) => void;
  onDone?: (v: Record<string, number>) => void;
  options?: string[];
}

/**
 * ChannelPicker is setup: pick the channels you actually work and the hours a week each gets.
 * The dashboard then speaks each one's language.
 */
export function ChannelPicker({ value, onChange, onDone, options }: ChannelPickerProps) {
  const [inner, setInner] = useState<Record<string, number>>(value || {});
  const val = onChange ? value || {} : inner;
  const set = (next: Record<string, number>) => {
    setInner(next);
    onChange?.(next);
  };
  const ids = options || Object.keys(channels);
  const tot = Object.keys(val).reduce((a, k) => a + (val[k] || 0), 0);
  const count = Object.keys(val).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-pick gap-3">
        {ids.map((id) => {
          const c = channels[id as keyof typeof channels];
          const on = val[id] != null;
          return (
            <div
              key={id}
              className={cn(
                'rounded-md border border-line-strong bg-bg-100 transition-colors duration-fast ease-out',
                on && 'border-up bg-bg-200',
              )}
            >
              <button
                type="button"
                aria-pressed={on ? 'true' : 'false'}
                className="flex w-full cursor-pointer items-start gap-3 rounded-md bg-transparent p-14px text-left"
                onClick={() => {
                  const n = { ...val };
                  if (on) delete n[id];
                  else n[id] = 4;
                  set(n);
                }}
              >
                <Monogram>{c.mark}</Monogram>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{c.name}</span>
                  <span className="block text-caption text-ink-faint">{c.blurb}</span>
                </span>
                <CheckBox checked={on} />
              </button>
              {on ? (
                <div className="flex items-center justify-between gap-2 pr-14px pb-3 pl-58px">
                  <Eyebrow>Hours a week</Eyebrow>
                  <span className="flex items-center gap-1">
                    <IconButton
                      className="size-26px"
                      aria-label="Fewer hours"
                      onClick={() => set({ ...val, [id]: Math.max(1, (val[id] || 0) - 1) })}
                    >
                      <Icon name="minus" size={14} />
                    </IconButton>
                    <Num className="min-w-44px text-center">{val[id]}h/wk</Num>
                    <IconButton
                      className="size-26px"
                      aria-label="More hours"
                      onClick={() => set({ ...val, [id]: Math.min(40, (val[id] || 0) + 1) })}
                    >
                      <Icon name="plus" size={14} />
                    </IconButton>
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-14px">
        <span className="text-ink-muted">
          {count ? `${count} bets · ` : 'Pick the channels you actually work · '}
          <Num className="text-ink">{tot}h</Num> a week on getting clients
        </span>
        {onDone ? (
          <Button variant="primary" disabled={!count} onClick={() => onDone(val)}>
            Build my dashboard
          </Button>
        ) : null}
      </div>
    </div>
  );
}
