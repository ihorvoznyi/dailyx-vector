import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

/** A chart gridline: 1px line-strong, crisp. */
export function GridLine(props: ComponentProps<'line'>) {
  return (
    <line className="stroke-line-strong" strokeWidth={1} shapeRendering="crispEdges" {...props} />
  );
}

/** An axis tick label: 11px mono, tabular, ink-faint. */
export function Tick({ className, ...props }: ComponentProps<'text'>) {
  return (
    <text
      className={cn(
        'fill-ink-faint font-mono text-11px leading-none font-medium tabular-nums',
        className,
      )}
      {...props}
    />
  );
}
