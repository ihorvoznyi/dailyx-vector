import { cva } from 'class-variance-authority';
import type { CSSProperties } from 'react';

const monogram = cva(
  'grid flex-none place-items-center rounded-8px bg-bg-300 font-mono text-12px leading-none font-semibold text-ink',
  {
    variants: {
      size: { md: 'size-8', lg: 'size-34px' },
      selected: { true: 'bg-up text-on-up' },
    },
  },
);

/**
 * A two-letter mono mark for a source, client or channel (MB, UW, ∑). Never a logo.
 * `lg` is the ChannelLens size; `selected` fills it green.
 */
export function Monogram({
  children,
  size = 'md',
  selected = false,
  style,
}: {
  children: string;
  size?: 'md' | 'lg';
  selected?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden className={monogram({ size, selected })} style={style}>
      {children}
    </span>
  );
}
