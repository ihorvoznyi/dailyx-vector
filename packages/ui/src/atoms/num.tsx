import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

/** A number in Geist Mono with tabular figures, so columns and count-ups don't jitter. */
export function Num({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('font-mono tabular-nums', className)} {...props} />;
}
