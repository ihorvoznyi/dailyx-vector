import type { NumberFormat } from '../../lib/format';

/** One point of a TrendChart series. */
export interface Point {
  x: string;
  y: number;
  label?: string;
}

export interface TrendChartProps {
  series: { name: string; data: Point[]; color?: string; dashed?: boolean; area?: boolean }[];
  format?: NumberFormat;
  height?: number;
  zero?: boolean;
  legend?: boolean;
  label?: string;
  markers?: {
    at: number | string;
    label: string;
    tone?: 'info' | 'up' | 'down' | 'warn' | 'neutral';
    row?: number;
  }[];
}

/** Stub until stage 3-6 task W2-charts builds it. The props above are the contract. */
export function TrendChart(props: TrendChartProps) {
  void props;
  return null;
}
