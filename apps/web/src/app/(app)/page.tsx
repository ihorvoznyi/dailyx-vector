import { forUser } from '@dailyx/db';
import {
  AllocationBar,
  Badge,
  Card,
  FreedomMeter,
  SourceStatus,
  StatTile,
  TrendChart,
} from '@dailyx/ui';
import type { Metadata } from 'next';

import { ShowMath } from '@/components/math/show-math';
import { KpiGrid, Page, PageHeader, SplitGrid } from '@/components/page';
import { CURRENCY_SYMBOL, formatMoney, formatShortDate, toMajor } from '@/lib/format';
import { weekStartIn } from '@/lib/dates';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';
import { loadOverview } from '@/server/overview';

export const metadata: Metadata = { title: 'Vector' };

const ACCOUNT_MARKS: Record<string, string> = {
  IBKR: 'IB',
  Monobank: 'MB',
  PayPal: 'PP',
  Payoneer: 'PO',
};

export default async function OverviewPage() {
  const authedUser = await requireUser();
  const db = getDb();
  const data = forUser(db, authedUser.id);

  const [view, settings] = await Promise.all([loadOverview(data), data.settings.get()]);
  const { money } = view;

  const ws = weekStartIn(settings.timezone);
  const symbol = CURRENCY_SYMBOL[money.base];
  const freshCount = money.accounts.filter((a) => !a.stale).length;
  const liquidAccounts = money.accounts.filter((a) => a.account.isLiquid);
  const oldestLiquid = [...liquidAccounts].sort((a, b) =>
    (a.latest?.asOf ?? '').localeCompare(b.latest?.asOf ?? ''),
  )[0];
  const valuedAccounts = money.accounts.filter((a) => a.valueInBase);
  const growth = money.freedom?.toFreedom.denominator.amount ?? 0;

  return (
    <Page>
      <PageHeader
        eyebrow={`Vector · ${view.todayLabel}`}
        title="Where I’m at"
        meta={`Entered by hand · ${freshCount} of ${money.accounts.length} balances fresh`}
      />

      {money.accounts.length === 0 ? (
        <Card>
          <p className="text-ink-faint">
            Add your balances.{' '}
            <a href="/money" className="underline">
              Go to Money
            </a>
            .
          </p>
        </Card>
      ) : (
        <div id="sources" className="grid grid-cols-srcs gap-3">
          {money.accounts.map((av) => (
            <SourceStatus
              key={av.account.id}
              name={av.account.name}
              mark={ACCOUNT_MARKS[av.account.name]}
              detail={`Manual · ${av.account.currency}`}
              lastSync={av.sourceLine.replace('Manual · ', '')}
              status={av.stale ? 'stale' : 'live'}
            />
          ))}
        </div>
      )}

      <KpiGrid>
        {money.missingRate ? (
          <Card className="border-warn">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warn">Missing rate</Badge>
              <span>
                Missing USD/UAH rate.{' '}
                <a href="/money#accounts" className="underline">
                  Fix it in Money
                </a>
                .
              </span>
            </div>
          </Card>
        ) : (
          <>
            <ShowMath cover math={money.netWorth!.math}>
              <StatTile
                label="Net worth"
                hero
                value={toMajor(money.netWorth!.metric.value.amount)}
                format={{ prefix: symbol, decimals: 2 }}
                source="Manual"
                note={oldestLiquid?.sourceLine}
                stale={money.netWorth!.stale}
              />
            </ShowMath>
            <ShowMath cover math={money.runway!.math}>
              <StatTile
                label="Runway"
                value={money.runway!.metric.value ?? 0}
                format={{ suffix: ' mo', decimals: 1 }}
                stale={money.runway!.stale}
              />
            </ShowMath>
            <ShowMath cover math={money.freedom!.math}>
              <StatTile
                label="Freedom ratio"
                value={money.freedom!.ratio.value ? money.freedom!.ratio.value * 100 : 0}
                format={{ suffix: '%' }}
              />
            </ShowMath>
          </>
        )}
        <ShowMath cover math={view.sentThisWeek.math}>
          <StatTile
            label="Sent this week"
            value={view.sentThisWeek.value}
            source="Quick-log"
            note={`Week of ${formatShortDate(ws)}`}
          />
        </ShowMath>
      </KpiGrid>

      <SplitGrid>
        <Card
          eyebrow="Distributed net worth"
          title={money.netWorth ? formatMoney(money.netWorth.metric.value) : '—'}
          meta={`${valuedAccounts.map((a) => a.account.name).join(', ')} · converted to ${money.base}`}
          action={
            money.netWorth ? (
              <ShowMath math={money.netWorth.math}>Show the math</ShowMath>
            ) : undefined
          }
        >
          {money.series.length < 2 ? (
            <p className="text-ink-faint">The trend starts after your second balance update</p>
          ) : (
            <TrendChart
              format={{ prefix: symbol }}
              series={[
                {
                  name: 'Net worth',
                  data: money.series.map((p) => ({
                    x: formatShortDate(p.date),
                    y: toMajor(p.value.amount),
                  })),
                },
              ]}
            />
          )}
        </Card>

        <Card eyebrow="Where it sits" title="By account">
          <AllocationBar
            format={{ prefix: symbol }}
            items={valuedAccounts.map((a) => ({
              label: a.account.name,
              value: toMajor(a.valueInBase!.amount),
              detail: a.sourceLine,
            }))}
          />
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
            {valuedAccounts.map((a) =>
              a.math ? (
                <li key={a.account.id}>
                  <ShowMath math={a.math}>
                    {a.account.name} {formatMoney(a.valueInBase!)}
                  </ShowMath>
                </li>
              ) : null,
            )}
          </ul>
        </Card>
      </SplitGrid>

      <Card title="Freedom">
        <ShowMath cover math={money.freedom?.math ?? view.sentThisWeek.math}>
          <FreedomMeter
            monthlyCost={toMajor(settings.monthlyCost)}
            recurring={toMajor(money.freedom?.ratio.numerator.amount ?? 0)}
            runwayMonths={money.runway?.metric.value ?? undefined}
            recurringGrowth={growth > 0 ? toMajor(growth) : undefined}
            hoursPerWeek={money.hoursLastWeek}
            targetHours={money.targetHours}
          />
        </ShowMath>
      </Card>

      <Card eyebrow="Acquisition" title="This week">
        {view.channels.length === 0 ? (
          <p className="text-ink-faint">
            No active channels yet.{' '}
            <a href="/setup" className="underline">
              Pick one in setup
            </a>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {view.channels.map((c) => (
              <li
                key={c.bet.id}
                className="flex flex-wrap items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
              >
                <span className="min-w-0 flex-1 font-medium text-ink">{c.name}</span>
                <ShowMath math={c.sent.math}>Sent {c.sent.value}</ShowMath>
                <span className="flex items-center gap-1">
                  <ShowMath math={c.waiting.math}>Waiting {c.waiting.value}</ShowMath>
                  {c.waiting.value > 0 ? <Badge tone="warn">Waiting</Badge> : null}
                </span>
                <a href={`/acquisition/${c.bet.preset}`} className="text-caption underline">
                  Open lens
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
