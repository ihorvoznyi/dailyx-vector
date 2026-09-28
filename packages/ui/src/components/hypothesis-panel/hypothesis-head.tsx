import { Badge } from '../badge';
import { Icon } from '../icon';
import { IconButton } from '../../atoms/icon-button';
import { PanelHead } from '../../atoms/panel';
import { cn } from '../../lib/cn';
import { HSTATUS } from '../../lib/hypothesis';
import type { Hypothesis, LeverDef, MetricDef } from '../../lib/hypothesis';

export interface HypothesisHeadProps {
  hypothesis: Hypothesis;
  lever?: LeverDef;
  metric?: MetricDef;
  conflict?: boolean;
  onClose?: () => void;
}

const CODE_TONE: Partial<Record<Hypothesis['status'], string>> = {
  running: 'bg-info-soft text-info',
  supported: 'bg-up text-on-up',
  refuted: 'bg-down-soft text-down',
};

/** The code badge, status badges, title and close button shared by the draft and record bodies. */
export function HypothesisHead({
  hypothesis,
  lever,
  metric,
  conflict,
  onClose,
}: HypothesisHeadProps) {
  const status = HSTATUS[hypothesis.status];
  return (
    <PanelHead>
      <span
        className={cn(
          'box-content grid h-36px min-w-44px flex-none place-items-center rounded-md bg-bg-300 px-2 font-mono text-12px leading-none font-semibold text-ink-muted',
          CODE_TONE[hypothesis.status],
        )}
      >
        {hypothesis.code || 'H'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-6px">
          <Badge tone={status.tone}>
            {status.glyph} {status.label}
          </Badge>
          {hypothesis.status === 'running' && conflict ? (
            <Badge tone="warn">Confounded</Badge>
          ) : null}
        </div>
        <h3 className="mt-6px text-title text-ink">
          {hypothesis.title ||
            `${lever ? lever.label : 'New hypothesis'} → ${metric ? metric.label : '…'}`}
        </h3>
      </div>
      {onClose ? (
        <IconButton aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} />
        </IconButton>
      ) : null}
    </PanelHead>
  );
}
