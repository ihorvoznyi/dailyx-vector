import type { NumberFormat } from '../../lib/format';

export interface ChannelFunnelProps {
  stages: { label: string; value: number; universal?: string; flag?: string | null }[];
  baseline?: number[];
  baselineLabel?: string;
  format?: NumberFormat;
  bandHeight?: number;
  minWidth?: number;
  universal?: boolean;
}

/** Stub until stage 3-6 task W2-charts builds it. The props above are the contract. */
export function ChannelFunnel(props: ChannelFunnelProps) {
  void props;
  return null;
}
