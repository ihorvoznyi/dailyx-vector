import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Swatch } from './swatch';

/** A wrapping row of legend items under a chart. */
export function Legend({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-3 flex flex-wrap gap-4 text-12px text-ink-muted', className)}>
      {children}
    </div>
  );
}

/** One legend entry: a swatch (colour or classes) followed by its label and any extras. */
export function LegendItem({
  color,
  swatchClassName,
  children,
}: {
  color?: string;
  swatchClassName?: string;
  children: ReactNode;
}) {
  return (
    <span className="flex flex-wrap items-center gap-6px">
      <Swatch color={color} className={swatchClassName} />
      {children}
    </span>
  );
}
