import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

const hud = cva('absolute z-3 rounded-md border border-line bg-bg-100 shadow-pop', {
  variants: {
    corner: {
      tl: 'top-3 left-3 flex flex-col gap-6px px-3 py-10px',
      tr: 'top-3 right-3 flex items-center gap-2px p-1',
      bl: 'bottom-3 left-1/2 -translate-x-1/2 bg-bg-100/90 px-3 py-6px text-caption whitespace-nowrap text-ink-faint',
    },
  },
});

/**
 * A floating canvas panel: top-left, top-right, the bottom hint, or placed by `className` when
 * `corner` is omitted.
 */
export function Hud({
  corner,
  className,
  children,
}: {
  corner?: 'tl' | 'tr' | 'bl';
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(hud({ corner }), className)}>{children}</div>;
}
