import { forUser } from '@dailyx/db';
import Link from 'next/link';

import { FunnelCard } from '@/components/acquisition/funnel-card';
import { LensTabs } from '@/components/acquisition/lens-tabs';
import { Page, PageHeader } from '@/components/page';
import { loadAllLens, loadLensTabs } from '@/server/acquisition';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';

export default async function AcquisitionPage() {
  const user = await requireUser();
  const data = forUser(getDb(), user.id);
  const [tabs, all] = await Promise.all([loadLensTabs(data), loadAllLens(data)]);

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
      <LensTabs items={tabs} value="all" />

      {all.map(({ bet, preset, funnel }) => (
        <FunnelCard
          key={bet.id}
          name={bet.name}
          preset={preset}
          funnel={funnel}
          compact
          action={
            <Link
              href={`/acquisition/${bet.preset}`}
              className="text-caption text-ink-muted underline decoration-dotted underline-offset-4"
            >
              Open
            </Link>
          }
        />
      ))}
    </Page>
  );
}
