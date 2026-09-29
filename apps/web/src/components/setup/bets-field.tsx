'use client';

import { channels, ChannelPicker, Input } from '@dailyx/ui';
import { useState } from 'react';

export interface BetsFieldProps {
  /** Active bets' hours, keyed by preset. */
  initial: Record<string, number>;
  /** `caps.sentPerWeek` per picked preset; null when unset. */
  initialSent: Record<string, number | null>;
}

/** A controlled ChannelPicker plus a hidden `bets` JSON field and per-channel planned-pace inputs. */
export function BetsField({ initial, initialSent }: BetsFieldProps) {
  const [value, setValue] = useState<Record<string, number>>(initial);
  const pickedIds = Object.keys(value);

  return (
    <div className="flex flex-col gap-4">
      <ChannelPicker value={value} onChange={setValue} />
      <input type="hidden" name="bets" value={JSON.stringify(value)} />
      {pickedIds.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {pickedIds.map((id) => {
            const preset = channels[id as keyof typeof channels];
            return (
              <label key={id} className="flex flex-col gap-1">
                <span className="text-caption text-ink-muted">
                  Planned {preset.stages[0]} a week
                </span>
                <Input
                  type="number"
                  name={`sentPerWeek.${id}`}
                  min={0}
                  defaultValue={initialSent[id] ?? undefined}
                />
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
