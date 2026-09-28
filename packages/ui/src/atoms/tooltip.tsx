import type { ReactNode } from 'react';

/**
 * A chart tooltip anchored above the point (`x`, `y`, px within the chart box). It follows the
 * pointer with a 60ms linear glide and never takes pointer events.
 */
export function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-2 -mt-3 -translate-x-1/2 -translate-y-full rounded-sm border border-line-strong bg-bg-200 px-10px py-2 text-caption whitespace-nowrap shadow-pop transition-all duration-tip ease-linear"
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  );
}

/** One line of a tooltip: swatch, label, value. */
export function TooltipRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}
