import type { Hypothesis, LeverDef, MetricDef } from '../../lib/hypothesis';

export interface HypothesisCanvasProps {
  metrics: MetricDef[];
  levers: LeverDef[];
  hypotheses: Hypothesis[];
  onChange?: (h: Hypothesis[]) => void;
  onLeversChange?: (l: LeverDef[]) => void;
  today?: string;
  height?: number;
  defaultSelected?: string;
  metricX?: number;
  newLeverLabel?: string;
  label?: string;
}

/** Stub until stage 3-6 task W3-hypothesis builds it. The props above are the contract. */
export function HypothesisCanvas(props: HypothesisCanvasProps) {
  void props;
  return null;
}
