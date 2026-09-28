import type { ReactNode } from 'react';

/**
 * Return-per-hour bar: an 8px track filled to `width` percent, an amber baseline tick at
 * `base` percent, and the readout (`children`) on the right.
 */
export function RoiBar({
  width,
  base,
  barColor,
  delay = 0,
  children,
}: {
  width: number;
  base?: number | null;
  barColor?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-10px">
      <span className="relative h-2 flex-1 rounded-pill bg-bg-300">
        <span
          className="block h-full origin-left animate-grow rounded-pill bg-up"
          style={{
            width: `${width}%`,
            animationDelay: `${delay}ms`,
            ...(barColor ? { background: barColor } : {}),
          }}
        />
        {base != null ? (
          <span
            className="absolute -top-1 -bottom-1 w-0 border-l-2 border-warn"
            style={{ left: `${base}%` }}
          />
        ) : null}
      </span>
      {children}
    </span>
  );
}
