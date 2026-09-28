'use client';

import { GridLine, Tick } from '../../atoms/chart';
import { Num } from '../../atoms/num';
import { useWidth } from '../../lib/use-width';
import { Badge } from '../badge';

export interface CalibrationChartProps {
  predictions: { confidence: number; correct: boolean }[];
  maxWidth?: number;
}

const X_TICKS = [0.5, 0.6, 0.7, 0.8, 0.9, 1];
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

/**
 * CalibrationChart scores me as a forecaster: how sure I said I was against how often I turned
 * out right. This is the long-run feedback loop: my confidence should earn its numbers.
 */
export function CalibrationChart({ predictions, maxWidth }: CalibrationChartProps) {
  const [ref, width] = useWidth(360);
  const W = Math.min(width, maxWidth ?? 420);
  const H = Math.min(W, 300);
  const pad = { l: 40, r: 12, t: 12, b: 34 };

  const bins: { x: number; y: number; n: number }[] = [];
  for (let b = 5; b < 10; b++) {
    const inBin = predictions.filter((q) => {
      const c = Math.max(0.5, q.confidence);
      return c >= b / 10 && (c < (b + 1) / 10 || (b === 9 && c <= 1));
    });
    if (inBin.length) {
      bins.push({
        x: inBin.reduce((a, q) => a + Math.max(0.5, q.confidence), 0) / inBin.length,
        y: inBin.filter((q) => q.correct).length / inBin.length,
        n: inBin.length,
      });
    }
  }

  const X = (v: number) => pad.l + ((v - 0.5) / 0.5) * (W - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - v) * (H - pad.t - pad.b);

  const brier = predictions.length
    ? predictions.reduce((a, q) => {
        const d = q.confidence - (q.correct ? 1 : 0);
        return a + d * d;
      }, 0) / predictions.length
    : null;
  const meanConf = predictions.length
    ? predictions.reduce((a, q) => a + q.confidence, 0) / predictions.length
    : 0;
  const hit = predictions.length
    ? predictions.filter((q) => q.correct).length / predictions.length
    : 0;
  const gap = meanConf - hit;
  const verdict: [string, 'up' | 'warn' | 'info'] =
    Math.abs(gap) < 0.06
      ? ['Well calibrated', 'up']
      : gap > 0
        ? [`Overconfident by ${Math.round(gap * 100)} pts`, 'warn']
        : [`Underconfident by ${Math.round(-gap * 100)} pts`, 'info'];

  const line = bins.map((q, i) => `${i ? 'L' : 'M'}${X(q.x)} ${Y(q.y)}`).join(' ');

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge tone={verdict[1]}>{verdict[0]}</Badge>
        <span className="text-12px text-ink-faint">
          Brier <Num className="text-ink">{brier == null ? '—' : brier.toFixed(3)}</Num>
          {` · n=${predictions.length}`}
        </span>
      </div>
      <div className="relative w-full" ref={ref}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full overflow-visible"
          role="img"
          aria-label={`Calibration: predicted confidence against how often it came true. ${verdict[0]}`}
        >
          {X_TICKS.map((t) => (
            <g key={`x${t}`}>
              <GridLine x1={X(t)} x2={X(t)} y1={pad.t} y2={H - pad.b} strokeOpacity={0.45} />
              <Tick x={X(t)} y={H - pad.b + 16} textAnchor="middle">
                {`${Math.round(t * 100)}%`}
              </Tick>
            </g>
          ))}
          {Y_TICKS.map((t) => (
            <g key={`y${t}`}>
              <GridLine x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} strokeOpacity={0.45} />
              <Tick x={pad.l - 8} y={Y(t) + 4} textAnchor="end">
                {`${Math.round(t * 100)}%`}
              </Tick>
            </g>
          ))}
          <path
            d={`M${X(0.5)} ${Y(0.5)} L${X(1)} ${Y(1)}`}
            stroke="var(--color-line-control)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Tick x={X(0.97)} y={Y(0.97) - 8} textAnchor="end">
            perfect
          </Tick>
          {line ? (
            <path
              className="animate-draw"
              d={line}
              fill="none"
              stroke="var(--color-up)"
              strokeWidth={2}
              pathLength={1}
              strokeDasharray={1}
            />
          ) : null}
          {bins.map((q, i) => (
            <circle
              key={i}
              className="animate-fade"
              cx={X(q.x)}
              cy={Y(q.y)}
              r={4 + Math.sqrt(q.n) * 2.2}
              fill="var(--color-up)"
              fillOpacity={0.25}
              stroke="var(--color-up)"
              strokeWidth={2}
            >
              <title>{`${q.n} predictions at ~${Math.round(q.x * 100)}% → ${Math.round(q.y * 100)}% came true`}</title>
            </circle>
          ))}
          <Tick x={(pad.l + W - pad.r) / 2} y={H - 2} textAnchor="middle">
            How sure I said I was
          </Tick>
        </svg>
      </div>
    </div>
  );
}
