import type { CSSProperties } from 'react';

import { cn } from '../../lib/cn';
import { ICONS, type IconName } from './icons';

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Every icon name, for pickers and the gallery. */
export const iconNames = Object.keys(ICONS) as IconName[];

/**
 * The Vector line icon set: a 24px grid, 1.75 stroke, round caps and joins, in currentColor.
 * Decorative unless `label` is given. Direction in numbers stays ▲ ▼ ■, never an icon.
 */
export function Icon({ name, size = 20, stroke = 1.75, label, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      // The bundle's icons are inline SVG; Preflight would make them blocks.
      className={cn('inline align-baseline', className)}
      style={style}
    >
      {ICONS[name]}
    </svg>
  );
}
