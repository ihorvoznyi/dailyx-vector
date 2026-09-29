import { CURRENCIES, forUser } from '@dailyx/db';
import { Badge, Button, Card, Input, Select } from '@dailyx/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Page, PageHeader } from '@/components/page';
import { BetsField } from '@/components/setup/bets-field';
import { fromHundredths } from '@/lib/amount';
import { activeBets } from '@/server/channels';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';

import { saveSetup } from './actions';
import { SETUP_ACCOUNTS } from './parse';

export const metadata: Metadata = { title: 'Set up Vector' };

interface SetupPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SetupPage(props: SetupPageProps) {
  const user = await requireUser();
  const data = forUser(getDb(), user.id);
  const [bets, settings, accounts] = await Promise.all([
    data.channelBets.list(),
    data.settings.get(),
    data.moneyAccounts.list(),
  ]);
  const params = await props.searchParams;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const active = activeBets(bets);
  const initial: Record<string, number> = {};
  const initialSent: Record<string, number | null> = {};
  for (const bet of active) {
    initial[bet.preset] = bet.hoursPerWeek;
    initialSent[bet.preset] = bet.caps.sentPerWeek ?? null;
  }

  const hasAccounts = accounts.length > 0;

  return (
    <Page>
      <PageHeader
        eyebrow="Vector · setup"
        title="Set up Vector"
        meta="Pick the channels you work, what a month costs, and where your money sits. Everything here stays editable."
      />
      {error ? <Badge tone="down">{error}</Badge> : null}
      <form action={saveSetup} className="flex flex-col gap-6">
        <Card eyebrow="Acquisition" title="Channels and hours">
          <BetsField initial={initial} initialSent={initialSent} />
        </Card>
        <Card eyebrow="Money" title="Costs and tax">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Monthly cost</span>
              <Input
                name="monthlyCost"
                inputMode="decimal"
                defaultValue={fromHundredths(settings.monthlyCost)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Currency</span>
              <Select
                name="monthlyCostCurrency"
                defaultValue={settings.monthlyCostCurrency}
                required
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Tax rate, %</span>
              <Input
                name="taxRate"
                inputMode="decimal"
                defaultValue={fromHundredths(settings.taxRateBps)}
                required
              />
            </label>
          </div>
        </Card>
        {hasAccounts ? (
          <Card eyebrow="Money" title="Accounts">
            <p className="text-body text-ink-muted">
              Accounts are set up.{' '}
              <Link href="/money" className="underline">
                Update balances in Money.
              </Link>
            </p>
          </Card>
        ) : (
          <Card eyebrow="Money" title="Accounts">
            <input type="hidden" name="withAccounts" value="1" />
            <div className="flex flex-col gap-4">
              {SETUP_ACCOUNTS.map((account) => (
                <div key={account.key} className="grid items-end gap-3 sm:grid-cols-3">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{account.name}</span>
                    <Badge tone="neutral">{account.currency}</Badge>
                  </span>
                  <label className="flex flex-col gap-1">
                    <span className="text-caption text-ink-muted">Balance</span>
                    <Input name={`account.${account.key}.balance`} inputMode="decimal" required />
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name={`account.${account.key}.liquid`} defaultChecked />
                    <span className="text-caption text-ink-muted">Liquid</span>
                  </label>
                </div>
              ))}
              <label className="flex flex-col gap-1">
                <span className="text-caption text-ink-muted">1 USD = ? UAH</span>
                <Input name="uahRate" inputMode="decimal" required />
              </label>
            </div>
          </Card>
        )}
        <div>
          <Button type="submit" variant="primary">
            Save setup
          </Button>
        </div>
      </form>
    </Page>
  );
}
