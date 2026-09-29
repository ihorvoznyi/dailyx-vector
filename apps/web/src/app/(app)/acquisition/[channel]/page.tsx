import { forUser } from '@dailyx/db';
import { Card } from '@dailyx/ui';
import { notFound } from 'next/navigation';

import { Page, PageHeader } from '@/components/page';
import { QuickLog } from '@/components/quick-log/quick-log';
import { OutreachLog, type OutreachRow } from '@/components/outreach/outreach-log';
import { activeBets, isPresetId } from '@/server/channels';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';

/**
 * Minimal lens for W2: only the Outreach log card, so stage taps and quick-log are usable.
 * T7 rewrites this with the full acquisition lens in W3.
 */
export default async function AcquisitionChannelPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel } = await params;
  if (!isPresetId(channel)) notFound();

  const user = await requireUser();
  const data = forUser(getDb(), user.id);
  const bets = await data.channelBets.list();
  const bet = activeBets(bets).find((b) => b.preset === channel);
  if (!bet) notFound();

  const items: OutreachRow[] = (await data.outreachItems.list())
    .filter((item) => item.channelId === bet.id)
    .sort(
      (a, b) =>
        b.sentOn.localeCompare(a.sentOn) ||
        b.createdAt.getTime() - a.createdAt.getTime() ||
        b.id.localeCompare(a.id),
    )
    .slice(0, 50);

  return (
    <Page>
      <PageHeader eyebrow="Acquisition" title={bet.name} />
      <Card title="Outreach log">
        <OutreachLog
          preset={bet.preset}
          items={items}
          emptyAction={
            <QuickLog
              channels={[{ id: bet.id, preset: bet.preset, name: bet.name }]}
              defaultChannelId={bet.id}
              label="Log the first one"
            />
          }
        />
      </Card>
    </Page>
  );
}
