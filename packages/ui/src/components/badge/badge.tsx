import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/tone';

const badge = cva(
  'inline-flex h-22px items-center gap-1 rounded-sm px-2 font-sans text-caption font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-bg-300 text-ink-muted',
        up: 'bg-up-soft text-up',
        down: 'bg-down-soft text-down',
        warn: 'bg-warn-soft text-warn',
        info: 'bg-info-soft text-info',
      },
    },
  },
);

export interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

/**
 * Badges are short status labels: a source name, a pace verdict, a sync state.
 * Each tone pairs a `*-soft` fill with its full-strength ink. Always put a word in a coloured
 * badge; the colour is never the only signal.
 */
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={cn(badge({ tone }))}>{children}</span>;
}
