import { useId } from 'react';

export interface SparklineProps {
  data: number[];
  tone?: 'auto' | 'up' | 'down' | 'flat';
  width?: number;
  height?: number;
  fill?: boolean;
  label?: string;
}

const COLOR = { up: 'var(--color-up)', down: 'var(--color-down)', flat: 'var(--color-ink-muted)' };

/**
 * A tiny trend line with a soft area and an end dot. `auto` tone is up when the last point is at
 * or above the first. Renders nothing under two points.
 */
export function Sparkline({
  data,
  tone,
  width: w = 96,
  height: h = 28,
  fill,
  label,
}: SparklineProps) {
  const id = useId();
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const span = Math.max(...data) - min || 1;
  const pts = data.map((v, i): [number, number] => [
    (i / (data.length - 1)) * w,
    h - 2 - ((v - min) / span) * (h - 4),
  ]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const resolved = tone && tone !== 'auto' ? tone : data.at(-1)! >= data[0]! ? 'up' : 'down';
  const col = COLOR[resolved];
  const [endX, endY] = pts.at(-1)!;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label ?? 'trend'}
      className="flex-none overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor={col} stopOpacity={0.28} />
          <stop offset="100%" stopColor={col} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill === false ? null : (
        <path className="animate-fade" d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      )}
      <path
        key={d}
        className="animate-draw"
        d={d}
        fill="none"
        stroke={col}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
      />
      <circle className="animate-fade" cx={endX} cy={endY} r={2.5} fill={col} />
    </svg>
  );
}
