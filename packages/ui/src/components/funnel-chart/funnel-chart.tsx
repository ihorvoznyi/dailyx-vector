import type { NumberFormat } from '../../lib/format';

export interface FunnelChartProps {
  stages: { label: string; value: number; convLabel?: string; color?: string }[];
  format?: NumberFormat;
  summary?: boolean;
}

/** Stub until stage 3-6 task W2-charts builds it. The props above are the contract. */
export function FunnelChart(props: FunnelChartProps) {
  void props;
  return null;
}
