import { netIncome } from '@dailyx/core';
import { CURRENCIES, forUser, toPayment } from '@dailyx/db';
import { Badge, Button, Card, FreedomMeter, Input, Select, StatTile } from '@dailyx/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ShowMath } from '@/components/math/show-math';
import { BalanceForm } from '@/components/money/balance-form';
import { Page, PageHeader, KpiGrid } from '@/components/page';
import { CURRENCY_SYMBOL, formatDate, formatMoney, toMajor } from '@/lib/format';
import { buildMath, type MathSpec } from '@/lib/math';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';
import { loadMoney, type AccountView } from '@/server/money';

import { addIncomeSource, addPayment, saveAccount } from './actions';
import { INCOME_SOURCE_KINDS, MONEY_ACCOUNT_KINDS } from './parse';

export const metadata: Metadata = { title: 'Money · Vector' };

interface MoneyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Wraps `node` in `ShowMath cover` when `math` is available; a bare node otherwise (missing rate). */
function Explained({ math, children }: { math: MathSpec | null; children: ReactNode }) {
  return math ? (
    <ShowMath cover math={math}>
      {children}
    </ShowMath>
  ) : (
    children
  );
}

export default async function MoneyPage(props: MoneyPageProps) {
  const authedUser = await requireUser();
  const db = getDb();
  const data = forUser(db, authedUser.id);

  const [view, settings, incomeSources, paymentRows] = await Promise.all([
    loadMoney(data),
    data.settings.get(),
    data.incomeSources.list(),
    data.payments.list(),
  ]);

  const params = await props.searchParams;
  const saved = params.saved;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const incomeSourceById = new Map(incomeSources.map((s) => [s.id, s]));
  const receivedPayments = paymentRows
    .filter((p) => p.certainty === 'received')
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const liquidAccounts = view.accounts.filter((a) => a.account.isLiquid);
  const oldestLiquid = [...liquidAccounts].sort((a, b) =>
    (a.latest?.asOf ?? '').localeCompare(b.latest?.asOf ?? ''),
  )[0];

  const growth = view.freedom?.toFreedom.denominator.amount ?? 0;
  const taxPct = settings.taxRateBps / 100;

  return (
    <Page>
      <PageHeader eyebrow="Money" title="Money" meta={`Entered by hand · base ${view.base}`} />
      {saved ? <Badge tone="up">Saved</Badge> : null}
      {error ? <Badge tone="down">{error}</Badge> : null}

      {view.missingRate ? (
        <Card className="border-warn">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warn">Missing rate</Badge>
            <span>
              Add a USD/UAH rate: update Monobank&apos;s balance{' '}
              <a href="#accounts" className="underline">
                below
              </a>
              .
            </span>
          </div>
        </Card>
      ) : null}

      <Card>
        <Explained math={view.freedom?.math ?? null}>
          <FreedomMeter
            monthlyCost={toMajor(settings.monthlyCost)}
            recurring={toMajor(view.freedom?.ratio.numerator.amount ?? 0)}
            runwayMonths={view.runway?.metric.value ?? undefined}
            recurringGrowth={growth > 0 ? toMajor(growth) : undefined}
            hoursPerWeek={view.hoursLastWeek}
            targetHours={view.targetHours}
          />
        </Explained>
      </Card>

      <KpiGrid>
        <Explained math={view.netWorth?.math ?? null}>
          <StatTile
            label="Net worth"
            hero
            value={toMajor(view.netWorth?.metric.value.amount ?? 0)}
            format={{ prefix: CURRENCY_SYMBOL[view.base], decimals: 2 }}
            source="Manual"
            note={oldestLiquid?.sourceLine}
            stale={view.netWorth?.stale ?? false}
          />
        </Explained>
        <Explained math={view.runway?.math ?? null}>
          <StatTile
            label="Runway"
            value={view.runway?.metric.value ?? 0}
            format={{ suffix: ' mo', decimals: 1 }}
            stale={view.runway?.stale ?? false}
          />
        </Explained>
        <Explained math={view.freedom?.math ?? null}>
          <StatTile
            label="Freedom ratio"
            value={(view.freedom?.ratio.value ?? 0) * 100}
            format={{ suffix: '%' }}
          />
        </Explained>
        <Explained math={view.freedom?.math ?? null}>
          <StatTile
            label="Recurring / month"
            value={toMajor(view.freedom?.ratio.numerator.amount ?? 0)}
            format={{ prefix: CURRENCY_SYMBOL[view.base], decimals: 2 }}
          />
        </Explained>
      </KpiGrid>

      <div id="accounts">
        <Card title="Accounts" meta="Manual balances · stale after 7 days">
          {view.accounts.length === 0 ? (
            <p className="text-ink-faint">
              No accounts yet. <a href="/setup">Add one in setup</a>.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {view.accounts.map((av: AccountView) => (
                <div
                  key={av.account.id}
                  className="flex flex-col gap-2 border-b border-line pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{av.account.name}</span>
                    <Badge>{av.account.currency}</Badge>
                    <span className="text-caption text-ink-muted">
                      {av.account.isLiquid ? 'Liquid' : 'Not liquid'}
                    </span>
                  </div>
                  {av.latest ? (
                    av.math ? (
                      <ShowMath math={av.math}>
                        {formatMoney({ amount: av.latest.amount, currency: av.latest.currency })}
                        {av.account.currency !== view.base && av.valueInBase
                          ? ` → ${formatMoney(av.valueInBase)}`
                          : ''}
                      </ShowMath>
                    ) : (
                      <span>
                        {formatMoney({ amount: av.latest.amount, currency: av.latest.currency })}{' '}
                        (missing rate)
                      </span>
                    )
                  ) : (
                    <span className="text-ink-faint">No balance yet</span>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
                    <span>{av.sourceLine}</span>
                    {av.stale ? <Badge tone="warn">Stale</Badge> : null}
                  </div>
                  <details>
                    <summary className="cursor-pointer text-caption text-ink-muted">
                      Update balance
                    </summary>
                    <div className="mt-2">
                      <BalanceForm
                        account={av.account}
                        defaultRate={view.uahRate?.rateE6 ?? null}
                        returnTo="/money"
                      />
                    </div>
                  </details>
                  <details>
                    <summary className="cursor-pointer text-caption text-ink-muted">Edit</summary>
                    <form action={saveAccount} className="mt-2 flex flex-wrap items-end gap-3">
                      <input type="hidden" name="id" value={av.account.id} />
                      <label className="flex flex-col gap-1">
                        <span className="text-caption text-ink-muted">Name</span>
                        <Input name="name" defaultValue={av.account.name} required maxLength={60} />
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isLiquid"
                          defaultChecked={av.account.isLiquid}
                          className="size-18px"
                        />
                        <span className="text-caption text-ink-muted">Liquid</span>
                      </label>
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-caption text-ink-muted">Add account</summary>
            <form action={saveAccount} className="mt-2 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption text-ink-muted">Name</span>
                <Input name="name" required maxLength={60} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption text-ink-muted">Kind</span>
                <Select name="kind" required defaultValue={MONEY_ACCOUNT_KINDS[0]}>
                  {MONEY_ACCOUNT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption text-ink-muted">Currency</span>
                <Select name="currency" required defaultValue={view.base}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isLiquid" defaultChecked className="size-18px" />
                <span className="text-caption text-ink-muted">Liquid</span>
              </label>
              <Button type="submit" size="sm">
                Add account
              </Button>
            </form>
          </details>
        </Card>
      </div>

      <Card title="Income sources">
        {incomeSources.length === 0 ? (
          <p className="text-ink-faint">Add your retainer first.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {incomeSources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <span>{s.name}</span>
                <Badge>{s.kind}</Badge>
                {s.kind === 'retainer' || s.kind === 'product' ? (
                  <Badge tone="up">Recurring</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <details className="mt-4" open={incomeSources.length === 0}>
          <summary className="cursor-pointer text-caption text-ink-muted">
            Add income source
          </summary>
          <form action={addIncomeSource} className="mt-2 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Name</span>
              <Input name="name" required maxLength={60} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Kind</span>
              <Select name="kind" required defaultValue={INCOME_SOURCE_KINDS[0]}>
                {INCOME_SOURCE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </Select>
            </label>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </details>
      </Card>

      <Card title="Received payments">
        <form action={addPayment} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-caption text-ink-muted">Source</span>
            <Select name="incomeSourceId" required>
              {incomeSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-ink-muted">Date</span>
            <Input name="date" type="date" defaultValue={view.today} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-ink-muted">Amount</span>
            <Input name="amount" inputMode="decimal" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-ink-muted">Currency</span>
            <Select name="currency" defaultValue={view.base} required>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-ink-muted">Platform fee</span>
            <Input name="platformFee" inputMode="decimal" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-ink-muted">Tax reserve</span>
            <Input
              name="taxReserved"
              inputMode="decimal"
              placeholder={`Blank = ${taxPct}% of amount`}
            />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="recurring" className="size-18px" />
            <span className="text-caption text-ink-muted">Recurring</span>
          </label>
          <Button type="submit" size="sm">
            Add payment
          </Button>
        </form>

        {receivedPayments.length === 0 ? (
          <p className="mt-4 text-ink-faint">No payments recorded yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {receivedPayments.map((row) => {
              const payment = toPayment(row);
              const net = netIncome(payment, settings.taxRateBps);
              const source = incomeSourceById.get(row.incomeSourceId);
              const math = buildMath({
                title: 'Net income',
                value: formatMoney(net),
                formula: 'Amount − platform fee − tax reserve',
                window: `As of ${formatDate(row.date)}`,
                counts: [
                  { label: 'Amount', value: formatMoney(payment.amount) },
                  { label: 'Platform fee', value: formatMoney(payment.platformFee) },
                  {
                    label: 'Tax reserve',
                    value: payment.taxReserved
                      ? formatMoney(payment.taxReserved)
                      : `${taxPct}% default`,
                  },
                ],
                sources: [
                  {
                    id: row.id,
                    label: `${source?.name ?? 'Unknown'} · ${formatMoney(payment.amount)} · ${formatDate(row.date)}`,
                  },
                ],
                editedAt: [row.updatedAt],
              });
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 text-caption text-ink-muted"
                >
                  <span>{formatDate(row.date)}</span>
                  <span>{source?.name ?? '—'}</span>
                  <span>{formatMoney(payment.amount)}</span>
                  <span>{formatMoney(payment.platformFee)}</span>
                  <span>
                    {payment.taxReserved ? formatMoney(payment.taxReserved) : `${taxPct}% default`}
                  </span>
                  <ShowMath math={math}>{formatMoney(net)}</ShowMath>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Page>
  );
}
