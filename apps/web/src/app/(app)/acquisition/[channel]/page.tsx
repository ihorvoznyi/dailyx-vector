import { keyStep, type TimedStage } from '@dailyx/core';
import { forUser } from '@dailyx/db';
import { Card, ChannelHealth, TrendChart } from '@dailyx/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FunnelCard } from '@/components/acquisition/funnel-card';
import { LensTabs } from '@/components/acquisition/lens-tabs';
import { ShowMath } from '@/components/math/show-math';
import { OutreachLog } from '@/components/outreach/outreach-log';
import { Page, PageHeader, SplitGrid } from '@/components/page';
import { QuickLog } from '@/components/quick-log/quick-log';
import { loadChannelLens, loadLensTabs } from '@/server/acquisition';
import { requireUser } from '@/server/auth';
import { flaggedStages, isPresetId } from '@/server/channels';
import { getDb } from '@/server/db';

/** Step i's `to` stage, matching core `STEPS` in `stage-rates.ts`. */
const STEP_TO: readonly TimedStage[] = ['attention', 'conversation', 'meeting', 'win'];

export default async function AcquisitionChannelPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel } = await params;
  if (!isPresetId(channel)) notFound();

  const user = await requireUser();
  const data = forUser(getDb(), user.id);
  const [lens, tabs] = await Promise.all([loadChannelLens(data, channel), loadLensTabs(data)]);
  if (!lens) notFound();

  const { bet, preset, funnel, health, trend, items } = lens;
  const step = keyStep(flaggedStages(bet.preset));
  const maturity = step !== null ? bet.maturityDays[STEP_TO[step]!] : null;

  return (
    <Page>
      <PageHeader
        eyebrow="Acquisition"
        title="Getting clients"
        actions={
          <Link
            href="/setup"
            className="inline-flex h-28px items-center gap-2 rounded-sm border border-line-control bg-transparent px-10px font-sans text-12px leading-20px font-medium text-ink transition duration-fast ease-out hover:bg-bg-200"
          >
            Edit bets
          </Link>
        }
      />
      <LensTabs items={tabs} value={channel} />

      <FunnelCard name={bet.name} preset={preset} funnel={funnel} />

      <Card eyebrow={bet.name} title="Channel health" meta="From what you logged">
        <ChannelHealth
          items={health.map((h) => ({
            label: h.label,
            value: (
              <ShowMath math={h.math} className="no-underline">
                {h.value}
              </ShowMath>
            ),
            unit: h.unit,
            status: h.status,
            note: h.note,
            meter: h.meter,
          }))}
        />
      </Card>

      <SplitGrid>
        <Card eyebrow={bet.name} title="Outreach log">
          <OutreachLog
            preset={bet.preset}
            items={items}
            emptyAction={
              <QuickLog
                channels={[{ id: bet.id, preset: bet.preset, name: bet.name }]}
                defaultChannelId={bet.id}
                label={`Log the first ${preset.verb}`}
              />
            }
          />
        </Card>

        <Card
          eyebrow={bet.name}
          title={trend?.name ?? 'Weekly rate'}
          meta="Weekly · last 13 weeks"
          action={trend?.latest ? <ShowMath math={trend.latest}>Show the math</ShowMath> : null}
        >
          {trend === null ? (
            <p className="text-ink-faint">Every step touches an estimated stage.</p>
          ) : trend.points.length < 2 ? (
            <p className="text-ink-faint">
              Not enough mature weeks yet — rates count items at least {maturity} days old.
            </p>
          ) : (
            <TrendChart
              height={240}
              format={{ suffix: '%' }}
              series={[{ name: trend.name, data: trend.points }]}
            />
          )}
        </Card>
      </SplitGrid>
    </Page>
  );
}
