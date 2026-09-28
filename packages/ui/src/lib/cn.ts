import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

import { tokens } from '../tokens';

const keys = (group: object) => Object.keys(group);

const twMerge = extendTailwindMerge({
  // Tailwind 4 keeps an explicit leading-* over a text-* size in any order, so a size must not
  // erase it. tailwind-merge's default would drop `leading-20px` from `leading-20px text-12px`.
  override: { conflictingClassGroups: { 'font-size': [] } },
  extend: {
    theme: {
      color: keys(tokens.color),
      spacing: keys(tokens.spacing),
      radius: keys(tokens.radius),
      shadow: keys(tokens.shadow),
      'drop-shadow': keys(tokens.dropShadow),
      text: [...keys(tokens.text), ...keys(tokens.fontSize)],
      leading: keys(tokens.leading),
      tracking: keys(tokens.tracking),
      ease: keys(tokens.ease),
      breakpoint: keys(tokens.breakpoint),
    },
    classGroups: {
      duration: [{ duration: keys(tokens.duration) }],
      'grid-cols': [{ 'grid-cols': keys(tokens.gridCols) }],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, last one wins.
 * Knows every Vector theme name, so `text-body` (size) and `text-ink` (colour) both survive.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
