import { Badge } from '../badge';
import { Icon } from '../icon';
import { Button } from '../button';
import { EvidenceMeter } from '../evidence-meter';
import { ForestPlot } from '../forest-plot';
import { TrendChart, type TrendChartProps } from '../trend-chart';
import { Chip } from '../../atoms/chip';
import { Eyebrow } from '../../atoms/eyebrow';
import { Meter } from '../../atoms/meter';
import { Num } from '../../atoms/num';
import { Panel, PanelBody, PanelDesc, PanelFoot, PanelSection, panelMode } from '../../atoms/panel';
import { cn } from '../../lib/cn';
import { dayNum, METHODS, shortDate } from '../../lib/hypothesis';
import type { Hypothesis, LeverDef, MetricDef } from '../../lib/hypothesis';
import { HypothesisHead } from './hypothesis-head';

export interface HypothesisRecordProps {
  hypothesis: Hypothesis;
  lever?: LeverDef;
  metrics: MetricDef[];
  today: string;
  conflict?: boolean;
  onChange?: (h: Hypothesis) => void;
  onClose?: () => void;
  className?: string;
}

function Statement({ hypothesis, metric }: { hypothesis: Hypothesis; metric?: MetricDef }) {
  return (
    <p className="text-15px leading-23px text-ink-muted">
      If I <b className="font-semibold text-ink">{hypothesis.change || '…'}</b>, then{' '}
      <b className="font-semibold text-ink">{metric?.label ?? 'the metric'}</b> will{' '}
      <b
        className="font-semibold"
        style={{ color: hypothesis.direction === 'down' ? 'var(--color-down)' : 'var(--color-up)' }}
      >
        {(hypothesis.direction === 'down' ? '▼ fall ' : '▲ rise ') + (hypothesis.amount || '')}
      </b>{' '}
      within <b className="font-semibold text-ink">{(hypothesis.windowDays || '…') + ' days'}</b>
      {hypothesis.because ? `, because ${hypothesis.because}` : ''}.
    </p>
  );
}

function nearestByDate(series: { date: string }[], target: string): number {
  const t = dayNum(target)!;
  let best = 0;
  series.forEach((d, i) => {
    if (Math.abs(dayNum(d.date)! - t) < Math.abs(dayNum(series[best]!.date)! - t)) best = i;
  });
  return best;
}

/**
 * The locked view of a running or concluded experiment: the statement, the evidence, the effect,
 * sample progress, the metric's trend with start/end markers, and the scored prediction.
 */
export function HypothesisRecord({
  hypothesis,
  lever,
  metrics,
  today,
  conflict,
  onChange,
  onClose,
  className,
}: HypothesisRecordProps) {
  const metric = metrics.find((m) => m.id === hypothesis.metric);
  const concluded =
    hypothesis.status === 'supported' ||
    hypothesis.status === 'refuted' ||
    hypothesis.status === 'inconclusive';

  const markers: TrendChartProps['markers'] = [];
  if (metric?.series?.length && hypothesis.startedAt) {
    const best = nearestByDate(metric.series, hypothesis.startedAt);
    markers.push({ at: best, label: `${hypothesis.code || 'H'} start`, tone: 'info' });
    if (hypothesis.endedAt) {
      const be = nearestByDate(metric.series, hypothesis.endedAt);
      markers.push({ at: be, label: 'end', tone: 'neutral', row: 1 });
    }
  }

  const predictedRight =
    concluded && hypothesis.status !== 'inconclusive'
      ? (hypothesis.status === 'supported') === (hypothesis.confidence ?? 0.5) >= 0.5
      : null;

  const method = METHODS.find((x) => x.value === hypothesis.method) ?? METHODS[0]!;

  return (
    <Panel
      mode={panelMode(className)}
      className={cn('box-content', className)}
      aria-label={`${hypothesis.code || 'Hypothesis'} details`}
    >
      <HypothesisHead
        hypothesis={hypothesis}
        lever={lever}
        metric={metric}
        conflict={conflict}
        onClose={onClose}
      />
      {hypothesis.status === 'running' && conflict ? (
        <div className="mx-5 rounded-sm bg-warn-soft px-3 py-2 text-caption text-warn">
          Another experiment is running on {metric ? metric.label : 'this metric'}. You won’t know
          which change moved it.
        </div>
      ) : null}
      <PanelBody>
        <PanelSection>
          <Statement hypothesis={hypothesis} metric={metric} />
          <span className="flex flex-wrap items-center gap-6px text-12px text-ink-faint">
            <Icon name="lock" size={12} stroke={2} />
            {`Pre-registered ${shortDate(hypothesis.startedAt)} · ${method.label}`}
          </span>
        </PanelSection>
        <PanelSection>
          <EvidenceMeter
            value={hypothesis.pBetter ?? null}
            label={
              hypothesis.method === 'before-after'
                ? 'Chance after beats before'
                : 'Chance B beats A'
            }
          />
        </PanelSection>
        {hypothesis.effect ? (
          <PanelSection>
            <Eyebrow>Effect · 90% interval</Eyebrow>
            <ForestPlot
              compact
              domain={[-30, 30]}
              rows={[
                {
                  code: '',
                  label: 'Effect',
                  est: hypothesis.effect.est,
                  lo: hypothesis.effect.lo,
                  hi: hypothesis.effect.hi,
                  status: hypothesis.status,
                },
              ]}
              unit={hypothesis.effect.unit}
              legend={false}
              label="Effect with 90% interval"
            />
          </PanelSection>
        ) : null}
        <PanelSection>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>Sample</Eyebrow>
            <Num className="text-12px">
              {hypothesis.n ?? 0} / {hypothesis.nTarget ?? '?'}
            </Num>
          </div>
          <Meter
            value={Math.min(1, (hypothesis.n ?? 0) / (hypothesis.nTarget || 1))}
            color={hypothesis.status === 'running' ? 'var(--color-info)' : undefined}
          />
          <span className="text-12px text-ink-faint">
            {`Stop: ${hypothesis.stopRule || '—'}${hypothesis.killRule ? ` · Kill: ${hypothesis.killRule}` : ''}`}
          </span>
        </PanelSection>
        {metric?.series ? (
          <PanelSection>
            <Eyebrow>{`${metric.label} · ${metric.source || ''}`}</Eyebrow>
            <TrendChart
              height={132}
              series={[{ name: metric.label, data: metric.series }]}
              format={metric.format}
              markers={markers}
            />
          </PanelSection>
        ) : null}
        <PanelSection>
          <Eyebrow>My prediction</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            <Num>{Math.round((hypothesis.confidence ?? 0.5) * 100)}% sure</Num>
            {predictedRight == null ? (
              <span className="text-12px text-ink-faint">
                {concluded ? 'Inconclusive — not scored' : 'Scored when it ends'}
              </span>
            ) : (
              <Badge tone={predictedRight ? 'up' : 'down'}>
                {predictedRight ? '✓ Called it' : '✕ Got it wrong'}
              </Badge>
            )}
          </div>
        </PanelSection>
        {hypothesis.adoptedTo ? (
          <PanelSection>
            <Eyebrow>Adopted</Eyebrow>
            <Chip tone="up" className="self-start">
              <Icon name="check" size={13} stroke={2} />
              {`Levels up: ${hypothesis.adoptedTo}`}
            </Chip>
          </PanelSection>
        ) : null}
        {hypothesis.notes ? (
          <PanelSection>
            <Eyebrow>Notes</Eyebrow>
            <PanelDesc className="m-0">{hypothesis.notes}</PanelDesc>
          </PanelSection>
        ) : null}
      </PanelBody>
      {hypothesis.status === 'running' ? (
        <PanelFoot>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange?.({
                ...hypothesis,
                status: 'inconclusive',
                endedAt: today,
                notes: `${hypothesis.notes ? `${hypothesis.notes} ` : ''}Stopped early on ${shortDate(today)}.`,
              })
            }
          >
            Stop early
          </Button>
        </PanelFoot>
      ) : hypothesis.status === 'supported' && !hypothesis.adoptedTo ? (
        <PanelFoot>
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name="check" size={14} stroke={2.25} />}
            onClick={() =>
              onChange?.({ ...hypothesis, adoptedTo: hypothesis.skill || 'Skill tree' })
            }
          >
            Adopt into skill tree
          </Button>
        </PanelFoot>
      ) : null}
    </Panel>
  );
}
