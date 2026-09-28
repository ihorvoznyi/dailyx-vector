/** Direction of a change: never shown by colour alone. */
export type Direction = 'up' | 'down' | 'flat';

/** The glyph for each direction: ▲ up, ▼ down, ■ unchanged. */
export const GLYPH: Record<Direction, string> = { up: '▲', down: '▼', flat: '■' };

/** `up` above zero, `down` below, `flat` at zero. */
export const directionOf = (v: number): Direction => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');
