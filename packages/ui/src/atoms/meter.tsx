import { cn } from '../lib/cn';

/**
 * A 6px progress track filled to `value` (0–1, clamped). `color` overrides the green bar
 * (info for running samples, warn when over). Width comes from the parent or `className`.
 */
export function Meter({
  value,
  color,
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('h-6px overflow-hidden rounded-pill bg-bg-300', className)}>
      <div
        className="h-full rounded-pill bg-up transition-all duration-chart ease-out"
        style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}
