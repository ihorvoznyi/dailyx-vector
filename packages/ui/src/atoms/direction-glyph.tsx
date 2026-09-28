import { directionOf, GLYPH } from '../lib/direction';

/** ▲, ▼ or ■ for the sign of `value`, hidden from screen readers (the label carries the words). */
export function DirectionGlyph({ value, className }: { value: number; className?: string }) {
  return (
    <span aria-hidden className={className}>
      {GLYPH[directionOf(value)]}
    </span>
  );
}
