import type { Hypothesis, LeverDef, MetricDef } from '../../lib/hypothesis';

export interface HypothesisPanelProps {
  hypothesis: Hypothesis;
  lever?: LeverDef;
  metrics: MetricDef[];
  today?: string;
  conflict?: boolean;
  onChange?: (h: Hypothesis) => void;
  onClose?: () => void;
  /** `is-static` renders in flow, `is-sheet` as a bottom sheet; otherwise it floats right. */
  className?: string;
}

/** Stub until stage 3-6 task W3-hypothesis builds it. The props above are the contract. */
export function HypothesisPanel(props: HypothesisPanelProps) {
  void props;
  return null;
}
