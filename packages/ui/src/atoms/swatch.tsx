import { cn } from '../lib/cn';

/** An 8px legend square. `color` is any CSS colour; pass classes for certainty fills or size. */
export function Swatch({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-2 flex-none rounded-2px', className)}
      style={color ? { background: color } : undefined}
    />
  );
}
