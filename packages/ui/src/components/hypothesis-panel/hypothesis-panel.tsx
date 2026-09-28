import { TODAY } from '../../lib/hypothesis';
import type { Hypothesis, LeverDef, MetricDef } from '../../lib/hypothesis';
import { HypothesisDraft } from './hypothesis-draft';
import { HypothesisRecord } from './hypothesis-record';

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

/**
 * HypothesisPanel is one experiment's record: a pre-registration form while it's a draft, then
 * locked evidence while it runs and after it ends. Never let a running experiment's statement be
 * edited — changes are amendments, recorded in `notes`.
 */
export function HypothesisPanel({
  hypothesis,
  lever,
  metrics,
  today,
  conflict,
  onChange,
  onClose,
  className,
}: HypothesisPanelProps) {
  const asOf = today ?? TODAY;
  if (hypothesis.status === 'draft' || hypothesis.status === 'idea') {
    return (
      <HypothesisDraft
        key={hypothesis.id}
        hypothesis={hypothesis}
        metrics={metrics}
        today={asOf}
        onChange={onChange}
        onClose={onClose}
        className={className}
      />
    );
  }
  return (
    <HypothesisRecord
      hypothesis={hypothesis}
      lever={lever}
      metrics={metrics}
      today={asOf}
      conflict={conflict}
      onChange={onChange}
      onClose={onClose}
      className={className}
    />
  );
}
