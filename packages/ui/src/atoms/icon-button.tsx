import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

/** A 32px square, borderless button holding one Icon. Always give it an aria-label. */
export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      type="button"
      className={cn(
        'grid size-8 cursor-pointer place-items-center rounded-8px bg-transparent text-ink-muted transition-colors duration-fast ease-out hover:bg-bg-300 hover:text-ink',
        className,
      )}
      {...props}
    />
  );
}
