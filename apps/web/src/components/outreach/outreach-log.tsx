import type { TimedStage } from '@dailyx/core';
import type { ChannelPresetId, outreachItems } from '@dailyx/db';
import { Badge, Button } from '@dailyx/ui';
import type { ReactNode } from 'react';

import { formatShortDate, formatWait } from '../../lib/format';
import { presetOf } from '../../server/channels';
import { setAwaitingReply, tapStage } from '../../server/outreach-actions';

export type OutreachRow = typeof outreachItems.$inferSelect;

export interface OutreachLogProps {
  preset: ChannelPresetId;
  /** Newest first; the caller slices (T7 passes at most 50). */
  items: OutreachRow[];
  /** Rendered in the empty state, e.g. a QuickLog preset to this channel. */
  emptyAction?: ReactNode;
}

const TIMED_STAGES: readonly TimedStage[] = ['attention', 'conversation', 'meeting', 'win'];

export function OutreachLog({ preset, items, emptyAction }: OutreachLogProps) {
  const stageLabels = presetOf(preset).stages.slice(1);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-caption text-ink-muted">Nothing logged here yet</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const waiting = item.awaitingReplySince !== null;
        // Server component, rendered fresh per request; the wait is display-only and doesn't
        // need to be reactive.
        const waitHours = waiting
          ? // eslint-disable-next-line react-hooks/purity
            (Date.now() - item.awaitingReplySince!.getTime()) / 3_600_000
          : 0;

        return (
          <li key={item.id} className="flex flex-col gap-2 border-b border-line pb-3 last:border-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-body text-ink">{item.contactName ?? 'Unnamed'}</span>
              {item.company ? (
                <span className="text-caption text-ink-faint">{item.company}</span>
              ) : null}
              {item.url && /^https?:\/\//i.test(item.url) ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-caption text-ink-muted underline decoration-dotted underline-offset-4"
                >
                  Link
                </a>
              ) : null}
              <span className="text-caption text-ink-faint">
                Sent {formatShortDate(item.sentOn)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIMED_STAGES.map((stage, index) => {
                const date = item.stageDates[stage];
                const reached = date !== undefined;
                const label = stageLabels[index] ?? stage;
                return (
                  <form key={stage} action={tapStage.bind(null, item.id, stage)}>
                    <Button
                      type="submit"
                      size="sm"
                      variant={reached ? 'primary' : 'ghost'}
                      aria-pressed={reached}
                      aria-label={date ? `${label}, ${formatShortDate(date)}` : label}
                    >
                      {label}
                    </Button>
                  </form>
                );
              })}
              {waiting ? (
                <>
                  <Badge tone="warn">Waiting {formatWait(waitHours)}</Badge>
                  <form action={setAwaitingReply.bind(null, item.id, false)}>
                    <Button type="submit" size="sm">
                      Answered
                    </Button>
                  </form>
                </>
              ) : (
                <form action={setAwaitingReply.bind(null, item.id, true)}>
                  <Button type="submit" size="sm">
                    Client replied
                  </Button>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
