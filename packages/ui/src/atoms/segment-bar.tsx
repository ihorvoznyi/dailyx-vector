import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

/** One share of a SegmentBar: its weight, colour and optional hover title. */
export interface Segment {
  key: string;
  value: number;
  color: string;
  title?: string;
}

/**
 * A 12px pill split into shares with 3px gaps; segments grow from the left, staggered by
 * `stagger` ms. Pass role/aria-label for the accessible summary and classes for height.
 */
export function SegmentBar({
  segments,
  stagger = 80,
  className,
  ...props
}: { segments: Segment[]; stagger?: number } & ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex h-3 gap-3px overflow-hidden rounded-pill bg-bg-000', className)}
      {...props}
    >
      {segments.map((s, i) => (
        <div
          key={s.key}
          title={s.title}
          className="h-full origin-left animate-grow"
          style={{
            flex: `${s.value} 1 0`,
            background: s.color,
            animationDelay: `${i * stagger}ms`,
          }}
        />
      ))}
    </div>
  );
}
