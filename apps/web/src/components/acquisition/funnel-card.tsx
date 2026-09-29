import { Badge, Card, ChannelFunnel, type ChannelPreset } from '@dailyx/ui';
import type { ReactNode } from 'react';

import { ShowMath } from '../math/show-math';
import { formatPct } from '../../lib/format';
import type { FunnelView } from '../../server/acquisition';

export interface FunnelCardProps {
  name: string;
  preset: ChannelPreset;
  funnel: FunnelView;
  compact?: boolean;
  action?: ReactNode;
}

/** One channel's funnel, with the step and count math one tap away. */
export function FunnelCard({ name, preset, funnel, compact, action }: FunnelCardProps) {
  const stages = preset.stages;
  return (
    <Card
      eyebrow={`${name} · last 90 days`}
      title={`${stages[0]} → ${stages[4]}`}
      meta={
        funnel.hasBaseline
          ? null
          : 'Too few events for a baseline yet — ribbons show this period only'
      }
      action={action}
    >
      <ChannelFunnel
        stages={funnel.stages}
        rates={funnel.rates}
        baseline={funnel.baseline}
        leak={funnel.leak}
        bandHeight={compact ? 72 : undefined}
        baselineLabel="my previous 90 days"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {funnel.stepMath.map((math, i) => (
          <ShowMath key={math.title} math={math} className="flex items-center gap-1 text-caption">
            {funnel.leak === i ? <Badge tone="warn">Leak</Badge> : null}
            {`${stages[i + 1]}: ${formatPct(funnel.rates[i] ?? null)}`}
          </ShowMath>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {funnel.countMath.map((math) => (
          <ShowMath key={math.title} math={math} className="text-caption">
            {`${math.title}: ${math.value}`}
          </ShowMath>
        ))}
      </div>
    </Card>
  );
}
