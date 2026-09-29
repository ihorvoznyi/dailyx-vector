import { Button, Input } from '@dailyx/ui';

import { updateBalance } from '../../app/(app)/money/actions';
import { fromMicros } from '../../lib/amount';
import type { AccountRow } from '../../server/money';

export interface BalanceFormProps {
  account: AccountRow;
  /** Default for the UAH rate input (fromMicros), from MoneyView.uahRate. */
  defaultRate: number | null;
  returnTo: '/money' | '/review';
}

/** A balance update: amount, as-of date, and — for a UAH account — the USD/UAH rate for that date. */
export function BalanceForm({ account, defaultRate, returnTo }: BalanceFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={updateBalance} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="accountId" value={account.id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="flex flex-col gap-1">
        <span className="text-caption text-ink-muted">Balance</span>
        <Input name="amount" inputMode="decimal" required aria-label={`${account.name} balance`} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-caption text-ink-muted">As of</span>
        <Input name="asOf" type="date" defaultValue={today} required />
      </label>
      {account.currency === 'UAH' ? (
        <label className="flex flex-col gap-1">
          <span className="text-caption text-ink-muted">1 USD = ? UAH</span>
          <Input
            name="rate"
            inputMode="decimal"
            required
            defaultValue={defaultRate !== null ? fromMicros(defaultRate) : undefined}
          />
        </label>
      ) : null}
      <Button type="submit" size="sm">
        Update
      </Button>
    </form>
  );
}
