import { CURRENCIES, forUser } from '@dailyx/db';
import { Badge, Button, Card, Input, Select } from '@dailyx/ui';
import type { Metadata } from 'next';

import { Page, PageHeader } from '@/components/page';
import { requireUser } from '@/server/auth';
import { signOut } from '@/server/auth-actions';
import { getDb } from '@/server/db';

import { saveSettings } from './actions';
import { fromHundredths } from './parse';

export const metadata: Metadata = { title: 'Settings · Vector' };

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const user = await requireUser();
  const s = await forUser(getDb(), user.id).settings.get();
  const params = await props.searchParams;
  const saved = params.saved;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const timezones = ['UTC', ...Intl.supportedValuesOf('timeZone').filter((z) => z !== 'UTC')];
  if (!timezones.includes(s.timezone)) timezones.unshift(s.timezone);

  return (
    <Page>
      <PageHeader
        eyebrow="Vector"
        title="Settings"
        actions={
          <>
            <span className="text-caption text-ink-faint">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="quiet" size="sm">
                Sign out
              </Button>
            </form>
          </>
        }
      />
      {saved ? <Badge tone="up">Saved</Badge> : null}
      {error ? <Badge tone="down">{error}</Badge> : null}
      <form action={saveSettings} className="flex flex-col gap-6">
        <Card
          eyebrow="Money"
          title="Costs and currency"
          meta="Amounts are in major units, e.g. 3800.50"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Base currency</span>
              <Select name="baseCurrency" defaultValue={s.baseCurrency} required>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Monthly cost</span>
              <Input
                name="monthlyCost"
                inputMode="decimal"
                defaultValue={fromHundredths(s.monthlyCost)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Monthly cost currency</span>
              <Select name="monthlyCostCurrency" defaultValue={s.monthlyCostCurrency} required>
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
                defaultValue={fromHundredths(s.taxRateBps)}
                required
              />
            </label>
          </div>
        </Card>
        <Card eyebrow="Time" title="Hours and horizon">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">
                Baseline rate per hour, in base currency
              </span>
              <Input
                name="baselineRate"
                inputMode="decimal"
                defaultValue={fromHundredths(s.baselineRate)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Target hours per week</span>
              <Input
                name="targetHours"
                type="number"
                min={0}
                max={168}
                step={1}
                defaultValue={s.targetHours}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Horizon, months</span>
              <Input
                name="horizonMonths"
                type="number"
                min={1}
                max={120}
                step={1}
                defaultValue={s.horizonMonths}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">Timezone</span>
              <Select name="timezone" defaultValue={s.timezone} required>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </Card>
        <div>
          <Button type="submit" variant="primary">
            Save settings
          </Button>
        </div>
      </form>
    </Page>
  );
}
