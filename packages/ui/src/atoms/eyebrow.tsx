import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

/** The uppercase mono label above a number or a card title ("NET WORTH"). */
export function Eyebrow({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span className={cn('font-mono text-eyebrow text-ink-faint uppercase', className)} {...props} />
  );
}
