import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

const field =
  'rounded-md border border-line-control bg-bg-000 px-3 font-sans text-body text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-offset-1 focus:outline-focus';

/** A 38px text input on the page ground with a control-strength border. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(field, 'h-38px', className)} {...props} />;
}

/** A 38px native select with the Vector chevron. */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(field, 'h-38px appearance-none pr-28px select-chevron', className)}
      {...props}
    />
  );
}

/** A multi-line input, resizable vertically. */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(field, 'resize-y py-2', className)} {...props} />;
}
