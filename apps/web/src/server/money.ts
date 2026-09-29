import {
  addDays,
  convert,
  freedomRatio,
  monthsToFreedom,
  money,
  netWorth,
  runway,
  hoursLogged,
  type CurrencyCode,
  type FreedomRatio,
  type IsoDate,
  type MissingFxRate,
  type Money,
  type MonthsToFreedom,
  type NetWorth,
  type Runway,
} from '@dailyx/core';
import {
  toAccountBalance,
  toFxRate,
  toPayment,
  toTimeEntry,
  type balanceSnapshots,
  type fxRates,
  type moneyAccounts,
  type UserData,
} from '@dailyx/db';

import { fromMicros } from '../lib/amount';
import { todayIn, weekStartIn } from '../lib/dates';
import { formatDate, formatMoney, formatWindow } from '../lib/format';
import { isStale, sourceLine } from '../lib/freshness';
import { buildMath, type MathRow, type MathSource, type MathSpec } from '../lib/math';

export type AccountRow = typeof moneyAccounts.$inferSelect;
export type SnapshotRow = typeof balanceSnapshots.$inferSelect;
type FxRateRow = typeof fxRates.$inferSelect;

export interface AccountView {
  account: AccountRow;
  /** Latest snapshot by asOf, then createdAt; null when none. */
  latest: SnapshotRow | null;
  /** Latest balance converted to base at today's rate; null with no snapshot or a missing rate. */
  valueInBase: Money | null;
  stale: boolean;
  sourceLine: string;
  /** Math of the converted balance (core `convert`); null when valueInBase is null. */
  math: MathSpec | null;
}

export interface MoneyView {
  today: IsoDate;
  base: CurrencyCode;
  accounts: AccountView[];
  /** Set when any conversion lacked a rate; the metrics below are then null. */
  missingRate: MissingFxRate | null;
  netWorth: { metric: NetWorth; math: MathSpec; stale: boolean } | null;
  runway: { metric: Runway; math: MathSpec; stale: boolean } | null;
  freedom: { ratio: FreedomRatio; toFreedom: MonthsToFreedom; math: MathSpec } | null;
  /** Net worth after each distinct snapshot date (ascending), for the Overview TrendChart. */
  series: { date: IsoDate; value: Money }[];
  /** Latest manual USD/UAH rate row, for the UAH form default; null when none. */
  uahRate: { rateE6: number; date: IsoDate } | null;
  /** Last complete week's confirmed channel hours (core hoursLogged); FreedomMeter "Hours / week". */
  hoursLastWeek: number;
  targetHours: number;
}

/** Newest snapshot per account as of `on` (inclusive); picks max asOf, then max createdAt. */
export function latestSnapshots(rows: readonly SnapshotRow[], on: IsoDate): SnapshotRow[] {
  const byAccount = new Map<string, SnapshotRow>();
  for (const row of rows) {
    if (row.asOf > on) continue;
    const current = byAccount.get(row.accountId);
    if (
      !current ||
      row.asOf > current.asOf ||
      (row.asOf === current.asOf && row.createdAt > current.createdAt)
    ) {
      byAccount.set(row.accountId, row);
    }
  }
  return [...byAccount.values()];
}

/** A record label for a show-the-math source list: either a balance snapshot or a manual FX rate. */
function recordLabel(
  id: string,
  snapshotsById: Map<string, { snapshot: SnapshotRow; account: AccountRow }>,
  ratesById: Map<string, FxRateRow>,
): MathSource {
  const snapshot = snapshotsById.get(id);
  if (snapshot) {
    return {
      id,
      label: `${snapshot.account.name} · ${formatMoney(money(snapshot.snapshot.amount, snapshot.snapshot.currency))} · as of ${formatDate(snapshot.snapshot.asOf)}`,
    };
  }
  const rate = ratesById.get(id);
  if (rate) {
    return {
      id,
      label: `${rate.base}/${rate.quote} ${fromMicros(rate.rateE6)} · manual · ${formatDate(rate.date)}`,
    };
  }
  throw new Error(`money math: unknown record id ${id}`);
}

function recordEditedAt(
  id: string,
  snapshotsById: Map<string, { snapshot: SnapshotRow; account: AccountRow }>,
  ratesById: Map<string, FxRateRow>,
): Date | null {
  return snapshotsById.get(id)?.snapshot.updatedAt ?? ratesById.get(id)?.updatedAt ?? null;
}

/** The 3 complete calendar months before `today`'s month, as a `[start, end]` window. */
function threeMonthsBefore(today: IsoDate): { start: IsoDate; end: IsoDate } {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const start = new Date(Date.UTC(year, month - 1 - 3, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10);
  return { start, end };
}

/** Everything /money and the Overview show. `now` is injectable for tests. */
export async function loadMoney(data: UserData, now: Date = new Date()): Promise<MoneyView> {
  const [accounts, snapshotRows, fxRows, paymentRows, timeEntryRows, settings] = await Promise.all([
    data.moneyAccounts.list(),
    data.balanceSnapshots.list(),
    data.fxRates.list(),
    data.payments.list(),
    data.timeEntries.list(),
    data.settings.get(),
  ]);

  const today = todayIn(settings.timezone, now);
  const base = settings.baseCurrency;
  const rates = fxRows.map(toFxRate);

  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const latest = latestSnapshots(snapshotRows, today);
  const latestByAccount = new Map(latest.map((s) => [s.accountId, s]));
  const snapshotsById = new Map(
    latest.map((s) => [s.id, { snapshot: s, account: accountById.get(s.accountId)! }]),
  );
  const ratesById = new Map(fxRows.map((r) => [r.id, r]));

  const balances = latest.map((s) => toAccountBalance(s, accountById.get(s.accountId)!));
  const monthlyCost = money(settings.monthlyCost, settings.monthlyCostCurrency);
  const payments = paymentRows.map(toPayment);

  const netWorthResult = netWorth({ balances, positions: [], rates, base, on: today });
  const runwayResult = runway({ balances, monthlyCost, rates, base, on: today });
  const freedomInput = {
    payments,
    taxRateBps: settings.taxRateBps,
    monthlyCost,
    rates,
    base,
    on: today,
  };
  const freedomRatioResult = freedomRatio(freedomInput);
  const monthsToFreedomResult = monthsToFreedom(freedomInput);

  const missingRate: MissingFxRate | null = !netWorthResult.ok
    ? netWorthResult.error
    : !runwayResult.ok
      ? runwayResult.error
      : !freedomRatioResult.ok
        ? freedomRatioResult.error
        : !monthsToFreedomResult.ok
          ? monthsToFreedomResult.error
          : null;

  const isLiquidStale = (a: AccountRow) => isStale(latestByAccount.get(a.id)?.asOf ?? null, today);
  const liquidStale = accounts.some((a) => a.isLiquid && isLiquidStale(a));

  let netWorthView: MoneyView['netWorth'] = null;
  let runwayView: MoneyView['runway'] = null;
  let freedomView: MoneyView['freedom'] = null;

  if (missingRate === null && netWorthResult.ok && runwayResult.ok && freedomRatioResult.ok) {
    const netWorthMetric = netWorthResult.data;
    const staleAccounts = accounts.filter((a) => a.isLiquid && isLiquidStale(a));
    const liquidWithSnapshot = balances.filter((b) => b.isLiquid).length;
    netWorthView = {
      metric: netWorthMetric,
      stale: liquidStale,
      math: buildMath({
        title: 'Net worth',
        value: formatMoney(netWorthMetric.value),
        formula: `Liquid balances + position values, each converted to ${base} at the latest rate on or before today`,
        window: `As of ${formatDate(today)}`,
        counts: [
          { label: 'Liquid accounts', value: String(liquidWithSnapshot) },
          { label: 'Total', value: formatMoney(netWorthMetric.value) },
        ] satisfies MathRow[],
        sources: netWorthMetric.recordIds.map((id) => recordLabel(id, snapshotsById, ratesById)),
        editedAt: netWorthMetric.recordIds.map((id) =>
          recordEditedAt(id, snapshotsById, ratesById),
        ),
        ...(liquidStale
          ? {
              note: `Stale: ${staleAccounts.map((a) => a.name).join(', ')} not updated in over 7 days`,
            }
          : {}),
      }),
    };

    const runwayMetric = runwayResult.data;
    runwayView = {
      metric: runwayMetric,
      stale: liquidStale,
      math: buildMath({
        title: 'Runway',
        value: `${runwayMetric.value ?? '—'} mo`,
        formula: 'Liquid balances ÷ monthly cost',
        window: `As of ${formatDate(today)}`,
        counts: [
          { label: 'Liquid balances', value: formatMoney(runwayMetric.numerator) },
          { label: 'Monthly cost', value: formatMoney(runwayMetric.denominator) },
        ] satisfies MathRow[],
        sources: runwayMetric.recordIds.map((id) => recordLabel(id, snapshotsById, ratesById)),
        editedAt: runwayMetric.recordIds.map((id) => recordEditedAt(id, snapshotsById, ratesById)),
      }),
    };

    const freedomRatioMetric = freedomRatioResult.data;
    const monthsToFreedomMetric = monthsToFreedomResult.ok ? monthsToFreedomResult.data : null;
    if (monthsToFreedomMetric) {
      const window = threeMonthsBefore(today);
      const incomeSourceLabelFor = (id: string): MathSource => {
        const payment = paymentRows.find((p) => p.id === id);
        if (payment) {
          return {
            id,
            label: `${formatMoney(money(payment.amount, payment.currency))} · ${formatDate(payment.date)}`,
          };
        }
        const rate = ratesById.get(id);
        if (rate) {
          return {
            id,
            label: `${rate.base}/${rate.quote} ${fromMicros(rate.rateE6)} · manual · ${formatDate(rate.date)}`,
          };
        }
        throw new Error(`money math: unknown record id ${id}`);
      };
      freedomView = {
        ratio: freedomRatioMetric,
        toFreedom: monthsToFreedomMetric,
        math: buildMath({
          title: 'Freedom ratio',
          value: `${freedomRatioMetric.value === null ? '—' : Math.round(freedomRatioMetric.value * 100)}%`,
          formula:
            'Average recurring net income over the last 3 complete months ÷ monthly cost. Net = amount − platform fee − tax reserve.',
          window: formatWindow(window),
          counts: [
            { label: 'Recurring net / month', value: formatMoney(freedomRatioMetric.numerator) },
            { label: 'Monthly cost', value: formatMoney(freedomRatioMetric.denominator) },
          ] satisfies MathRow[],
          sources: freedomRatioMetric.recordIds.map(incomeSourceLabelFor),
          editedAt: freedomRatioMetric.recordIds.map((id) => {
            const payment = paymentRows.find((p) => p.id === id);
            return payment?.updatedAt ?? ratesById.get(id)?.updatedAt ?? null;
          }),
        }),
      };
    }
  }

  const accountViews: AccountView[] = [...accounts]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((account) => {
      const snapshot = latestByAccount.get(account.id) ?? null;
      const stale = isStale(snapshot?.asOf ?? null, today);
      const line = sourceLine(snapshot?.asOf ?? null, today);
      let valueInBase: Money | null = null;
      let math: MathSpec | null = null;
      if (snapshot) {
        const balance = money(snapshot.amount, snapshot.currency);
        const converted = convert(balance, base, today, rates);
        if (converted.ok) {
          valueInBase = converted.data.money;
          const rate = converted.data.rate;
          math = buildMath({
            title: account.name,
            value: formatMoney(valueInBase),
            formula: 'Latest balance converted at the rate on or before today',
            window: `As of ${formatDate(snapshot.asOf)}`,
            counts: [
              { label: 'Balance', value: formatMoney(balance) },
              {
                label: 'Rate',
                value: rate
                  ? `1 ${rate.base} = ${fromMicros(rate.rateE6)} ${rate.quote}`
                  : 'same currency',
              },
            ] satisfies MathRow[],
            sources: [
              {
                id: snapshot.id,
                label: `${account.name} · ${formatMoney(balance)} · as of ${formatDate(snapshot.asOf)}`,
              },
            ],
            editedAt: [
              snapshot.updatedAt,
              rate ? (ratesById.get(rate.id)?.updatedAt ?? null) : null,
            ],
          });
        }
      }
      return { account, latest: snapshot, valueInBase, stale, sourceLine: line, math };
    });

  const distinctDates = [...new Set(snapshotRows.map((s) => s.asOf))].sort();
  const series = distinctDates
    .map((d) => {
      const balancesOn = latestSnapshots(snapshotRows, d).map((s) =>
        toAccountBalance(s, accountById.get(s.accountId)!),
      );
      const result = netWorth({ balances: balancesOn, positions: [], rates, base, on: d });
      return result.ok ? { date: d, value: result.data.value } : null;
    })
    .filter((p): p is { date: IsoDate; value: Money } => p !== null);

  const uahRateRows = fxRows
    .filter((r) => r.base === 'USD' && r.quote === 'UAH' && r.source === 'manual')
    .sort((a, b) =>
      a.date === b.date ? a.updatedAt.getTime() - b.updatedAt.getTime() : a.date < b.date ? -1 : 1,
    );
  const latestUahRate = uahRateRows.at(-1) ?? null;

  const weekStartNow = weekStartIn(settings.timezone, now);
  const hoursLastWeek = hoursLogged({
    entries: timeEntryRows.map(toTimeEntry),
    window: { start: addDays(weekStartNow, -7), end: addDays(weekStartNow, -1) },
  }).value;

  return {
    today,
    base,
    accounts: accountViews,
    missingRate,
    netWorth: netWorthView,
    runway: runwayView,
    freedom: freedomView,
    series,
    uahRate: latestUahRate ? { rateE6: latestUahRate.rateE6, date: latestUahRate.date } : null,
    hoursLastWeek,
    targetHours: settings.targetHours,
  };
}
