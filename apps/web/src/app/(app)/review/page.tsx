import { forUser } from '@dailyx/db';
import { Badge, Button, Card, Input } from '@dailyx/ui';
import type { Metadata } from 'next';

import { ShowMath } from '@/components/math/show-math';
import { BalanceForm } from '@/components/money/balance-form';
import { Page, PageHeader } from '@/components/page';
import { formatShortDate, formatWait } from '@/lib/format';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';
import { loadReview } from '@/server/review';
import { setAwaitingReply } from '@/server/outreach-actions';

import { confirmHours, finishReview } from './actions';

export const metadata: Metadata = { title: 'Weekly review · Vector' };

interface ReviewPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SAVED_LABEL: Record<string, string> = {
  hours: 'Hours confirmed',
  balance: 'Balance updated',
  done: 'Review finished',
};

export default async function ReviewPage(props: ReviewPageProps) {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);
  const view = await loadReview(data);

  const params = await props.searchParams;
  const rawSaved = params.saved;
  const saved = Array.isArray(rawSaved) ? rawSaved[0] : rawSaved;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <Page>
      <PageHeader
        eyebrow={`Week of ${formatShortDate(view.weekStart)}`}
        title="Weekly review"
        actions={
          view.reviewed ? (
            <Badge tone="up">Reviewed</Badge>
          ) : (
            <Badge tone="warn">{view.remaining} to do</Badge>
          )
        }
      />
      {saved ? <Badge tone="up">{SAVED_LABEL[saved] ?? 'Saved'}</Badge> : null}
      {error ? <Badge tone="down">{error}</Badge> : null}

      <Card
        title="Replies waiting over 24h"
        meta={<ShowMath math={view.waitingMath}>{view.waiting.length} waiting</ShowMath>}
      >
        {view.waiting.length === 0 ? (
          <Badge tone="up">Nothing waiting over 24h</Badge>
        ) : (
          <ul className="flex flex-col gap-3">
            {view.waiting.map(({ row, channelName, hours }) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
              >
                <span className="text-caption text-ink-muted">{channelName}</span>
                <span className="text-body text-ink">{row.contactName ?? 'Unnamed'}</span>
                {row.company ? (
                  <span className="text-caption text-ink-faint">{row.company}</span>
                ) : null}
                <Badge tone="warn">Waiting {formatWait(hours)}</Badge>
                <form action={setAwaitingReply.bind(null, row.id, false)} className="ml-auto">
                  <Button type="submit" size="sm">
                    Answered
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Hours this week" meta="One entry per channel, dated Monday">
        {view.hours.length === 0 ? (
          <p className="text-ink-faint">
            No active channels yet. <a href="/setup">Pick channels in setup</a>.
          </p>
        ) : (
          <form action={confirmHours} className="flex flex-col gap-4">
            {view.hours.map(({ bet, hours, confirmed }) => (
              <div key={bet.id} className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-caption text-ink-muted">
                    {bet.name} · Planned {bet.hoursPerWeek}h
                  </span>
                  <Input
                    type="number"
                    name={`hours.${bet.id}`}
                    step="0.25"
                    min="0"
                    max="168"
                    defaultValue={hours}
                    aria-label={`${bet.name} hours`}
                  />
                </label>
                {confirmed ? <Badge tone="up">Confirmed</Badge> : null}
              </div>
            ))}
            <Button type="submit" variant="primary" size="sm" className="self-start">
              Confirm hours
            </Button>
          </form>
        )}
      </Card>

      <Card title="Balances older than 7 days">
        {view.stale.length === 0 ? (
          <Badge tone="up">All balances are fresh</Badge>
        ) : (
          <div className="flex flex-col gap-4">
            {view.stale.map((av) => (
              <div
                key={av.account.id}
                className="flex flex-col gap-2 border-b border-line pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{av.account.name}</span>
                  <span className="text-caption text-ink-muted">{av.sourceLine}</span>
                  <Badge tone="warn">Stale</Badge>
                </div>
                <BalanceForm account={av.account} defaultRate={view.uahRate} returnTo="/review" />
              </div>
            ))}
          </div>
        )}
      </Card>

      <form action={finishReview}>
        <Button type="submit" variant="primary">
          Finish review
        </Button>
      </form>
    </Page>
  );
}
