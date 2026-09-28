import type { HypStatus } from '../../lib/hypothesis';

/** One effect row: estimate with its 90% interval. */
export interface ForestRow {
  code?: string;
  label: string;
  est: number;
  lo: number;
  hi: number;
  status?: HypStatus;
}

export interface ForestPlotProps {
  rows: ForestRow[];
  unit?: string;
  domain?: [number, number];
  onSelect?: (row: ForestRow) => void;
  legend?: boolean;
  compact?: boolean;
  label?: string;
}

/** Stub until stage 3-6 task W2-lab builds it. The props above are the contract. */
export function ForestPlot(props: ForestPlotProps) {
  void props;
  return null;
}
