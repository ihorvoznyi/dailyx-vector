export interface CalibrationChartProps {
  predictions: { confidence: number; correct: boolean }[];
  maxWidth?: number;
}

/** Stub until stage 3-6 task W2-lab builds it. The props above are the contract. */
export function CalibrationChart(props: CalibrationChartProps) {
  void props;
  return null;
}
