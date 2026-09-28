# Vector — Product & Build Spec

Sep 28, 2026 · @Ihor · **Revised Sep 28, 2026 after scoping.** Decisions D1–D17 are applied
throughout. A section that changed says so and names the decision.

## Summary

Vector is a personal operating dashboard for a solo founder. It connects bank, broker, payment and
client-acquisition sources, shows where things stand, and ranks the next hour of work by what it
returns. The north star is the **freedom ratio**: recurring net income ÷ monthly cost. Every screen
either explains that number or helps move it.

**Vision.** Vector replaces guessing with numbers. *Now:* see which channel turns my hours into
clients, from outreach I log in seconds. *Always:* know where I stand (freedom ratio, runway, net
worth) from numbers I can trace. North star: freedom ratio. Near-term driver: return per hour by
channel.

- **User:** Ihor, a solo founder who gets clients through Upwork, cold email, LinkedIn and
  referrals. Money sits in Monobank, IBKR, PayPal and Payoneer. Vector is a **personal tool**, and
  no other users are planned (D1). Every row still carries `user_id`.
- **Jobs to be done**, with acquisition first for now (D2):
  1. Know where I am (money, pipeline, audience) and trust the numbers.
  2. Decide the next action by expected return per hour.
  3. Learn what actually works: hypotheses, experiments, calibration.
  4. Grow capabilities deliberately: the skill tree.
- **Design source of truth:** the [Vector design system](https://claude.ai/code/artifact/7ba22b06-4d50-4fb2-9ab2-f1f1ca8f3a7e).
  It holds tokens, 33 components with live previews and typed props, and reference pages for
  Dashboard, Work, Acquisition and Lab. The SkillTree preview is the skill-tree reference.

## Decisions (Sep 28, 2026)

| # | Decision | Why | Changes |
|---|---|---|---|
| D1 | Personal tool; P5 "Other founders" is removed. Keep `user_id` on every row, skip row-level security, and scope every query through one helper. | Monobank personal tokens and the Upwork API are for the account holder's own use, so serving other users would need provider agreements. With one user, RLS guards nothing. | Summary, Scope, Security |
| D2 | Acquisition-first. M1 is the acquisition MVP with money entered by hand. The money connectors move to M3. | Currently about one client payment a month, and the focus is winning clients. The daily decision is where acquisition hours go. | Scope, Screens |
| D3 | Quick-log is the baseline for every stage on every channel, Upwork included. Leads can be added by pasting a list. | Leads come from Claude in batches and are written to by hand, with no email tool. Upwork API fields are unverified. | Screens, Data sources |
| D4 | No time tracking. Planned weekly hours per channel are confirmed or adjusted in the weekly review, stored as one TimeEntry per channel per week. | Return per hour needs hours; timers would cost more than they return. | Domain model, Review |
| D5 | In M1, money is entered by hand: balances for Monobank, IBKR, PayPal and Payoneer; the retainer as a recurring income source; payments recorded as Received when they land. Balances go stale after 7 days. | Enough for FreedomMeter, net worth and runway without any connector. | Money, Screens |
| D6 | In M1, FX uses a manual rate entered with the balances (`FxRate.source = manual`). The NBU feed arrives in M3. | UAH balances need conversion. A manual rate needs no external call. | Metrics, Data sources |
| D7 | Net income is net of platform fees **and** the tax reserve (`tax_rate_bps`, default 500 for FOP group 3). Monthly cost is a manual setting. The remaining tax and currency details are parked until M3. | Without tax, the ratio overstates freedom. | Metrics, Domain model |
| D8 | Stack: Neon Postgres + Drizzle; Better Auth with Google OAuth and one allowed email; web on Vercel; no worker in P0–M1; Cloudflare Workers for jobs from M3. | Owner's accounts and preferences. pg-boss needs a long-lived Node process, which Workers don't provide. | Architecture, `docs/adr/0001-stack.md` |
| D9 | The whole design system (33 components) is ported in P0. | Owner's call. | Build plan |
| D10 | Lab and Skills remain in the vision but are unplanned. Their tables arrive with their milestone. | Small samples; P0–M2 come first. | Scope, Domain model |
| D11 | ChannelPortfolio, rebalance and the ranked ActionQueue move to M2. | Verdicts read "Too early" for channels under 45 days old. | Scope |
| D12 | Upwork API: eligible ($40K lifetime, JSS 100%). Apply now. M2 opens with a GraphQL Explorer spike, because the fields are unverified. | Upwork's developer docs block automated reading. | Data sources |
| D13 | PayPal is a personal account, so no production REST API. Balances are entered by hand, then imported from CSV. The API becomes an option if a business account opens. | Confirmed: PayPal's REST API requires a business account. | Data sources |
| D14 | Payoneer is added as a money source, receiving Upwork withdrawals. Access is unverified; the balance is entered by hand until then. | Missing from the original spec. | Data sources |
| D15 | Treat the Monobank personal webhook as unsigned: unguessable per-connection URL, and re-fetch rather than trust the payload. | Signing is documented only for Monobank's acquiring webhooks. | Data sources, Security |
| D16 | FX history comes from the NBU API. The Monobank public endpoint returns current rates only. | Verified by a live request. | Data sources |
| D17 | M1 data is entered by hand and can't be re-synced, so backups matter from day one. Confirm Neon's restore window before T05. | Original assumption, that everything is re-syncable, doesn't hold in M1. | Security, Open decisions |

## Principles and non-goals

These rules settle design disagreements; agents should cite them in PRs when a choice is not
obvious.

**Principles**

1. **Every number is traceable.** Any figure opens a "show the math" drawer: formula, window, raw
   counts, source records, last sync or edit time.
2. **Money carries its certainty.** Received → Secured → Committed → Pipeline. Pipeline is never
   summed into income.
3. **One yardstick, native words.** Each channel speaks its own vocabulary (Proposals, Connects,
   Invites), but everything is compared in money per hour.
4. **Compare to my own history,** never to invented industry benchmarks.
5. **Read sources where allowed; manual input is first-class until then.** The app reads sources
   through sanctioned APIs. Where none exists yet, quick-log, manual balances and manual rates are
   normal inputs, audited like any other write. *(Changed: D3, D5.)*
6. **Stale data never drives a verdict.** A stale source, including a manual balance older than 7
   days, turns amber and freezes decisions that depend on it.
7. **Pre-register experiments.** A running hypothesis's statement is locked; changes are logged
   amendments.
8. **Calm motion.** Charts animate on arrival and range change only, and `prefers-reduced-motion`
   turns it all off.

**Non-goals**

- No trading, payments or sending outreach from the app.
- No scraping of platforms against their terms. Where no sanctioned API exists, use manual
  quick-log or CSV import.
- No other users: no onboarding, no team or agency features (D1). No native mobile app (responsive
  web only).
- No automated decisions. The app ranks and suggests; the user acts.

## Scope and milestones

*(Changed: D2, D10, D11. P5 removed by D1.)* Build in this order. Each milestone ships something
used daily before the next starts. **Don't start M2 tickets until the M1 exit gate holds.**

| Milestone | Goal | Includes | Exit gate | Target |
| --- | --- | --- | --- | --- |
| P0 Foundation | A running shell | Monorepo, CI, a preview deploy per PR with its own Neon branch, token pipeline, full Vector UI port, Google sign-in, M1 tables, seed data, settings | CI green; every component's visual test passes; sign-in and settings work on a preview | ~Oct 9 |
| M1 Acquisition MVP | Know which channel turns hours into clients | Setup (channels, hours, cost, accounts); quick-log, paste a list and stage taps; ChannelFunnel and ChannelHealth per channel; weekly review; manual money feeding FreedomMeter, net worth and runway; show-the-math drawer | Two straight weeks with every outreach item logged, and the weekly review under 10 minutes | In use ~Oct 23; gate ~Nov 6 |
| M2 Decide | Rank the next hour | Channel return per hour, verdicts, rebalance, ChannelPortfolio; action rules and ranked ActionQueue; Upwork connector (after the Explorer spike); Sources page | Portfolio verdicts shown for every channel older than 45 days; the Upwork stages the API exposes sync without manual taps | — |
| M3 Money truth | Trust the money numbers | Cloudflare worker; Monobank (API + webhook); IBKR Flex; PayPal and Payoneer (CSV, or API where available); CSV framework; NBU FX; transfers and bank matching; projects, milestones, IncomeForecast; tax details; nightly MetricSnapshot | Net worth within 1% of real balances for 14 straight days, with the measurement defined at M3 start | — |
| M4 Lab | Learn what works | Levers, hypotheses, variant tagging, Bayesian stats, frozen verdicts, ForestPlot, CalibrationChart, TrendChart markers | First experiment concluded with a frozen verdict | — |
| M5 Skills and polish | Grow on purpose | Skill tree canvas, metric-linked tiles, mobile and accessibility audit | Skill tiles update from metrics without manual edits | — |

## Screens

Nine routes plus quick-log. Each maps to a reference page or component in the design system; build
to match those previews.

| Route | Purpose | Vector components | Milestone |
| --- | --- | --- | --- |
| `/setup` | First run: monthly cost, base currency, tax rate, channels and hours, accounts; connecting sources comes later | ChannelPicker, SourceStatus, Button | P0–M1 (sources M2–M3) |
| `/` Overview | Where I'm at, in one screen | SourceStatus, StatTile, TrendChart, AllocationBar, FreedomMeter, ActionQueue (top 3, from M2) | M1 |
| `/money` | M1: accounts with manual balances, income sources, received payments, FreedomMeter. M3: projects, forecast, PayoutBar | FreedomMeter, ActionQueue, ClientCard, ProjectCard, PayoutBar, IncomeForecast, AllocationBar | M1 minimal, M3 full |
| `/acquisition` and `/acquisition/[channel]` | Channel lenses, and the bets portfolio from M2 | ChannelLens, ChannelFunnel, ChannelHealth, TrendChart; ChannelPortfolio and ActionQueue from M2 | M1, M2 |
| Quick-log | Log outreach from any page: one item, a pasted list, or a stage tap | Button, Badge, SegmentedControl | M1 |
| `/review` | Weekly review: waiting replies, hours, stale balances; variant tags and verdicts from M4 | ActionQueue, Badge, Button | M1 |
| `/lab` and `/lab/[id]` | Hypothesis map and experiment detail | HypothesisCanvas, HypothesisPanel, EvidenceMeter, ForestPlot, CalibrationChart | M4 |
| `/skills` | Skill tree canvas | SkillTree, SkillNode, SkillPanel | M5 |
| `/sources` | Connections, freshness, errors, sync log, CSV import | SourceStatus, Card, Badge | M2 |
| `/settings` | Costs, currencies, tax rate, caps, horizon, data export | Card, SegmentedControl | P0 |

**Acceptance criteria that apply to every screen**

- Renders correctly at 390, 768 and 1280 px wide, with no horizontal page scroll (canvases pan
  inside their own frame).
- Every number has a source line ("Upwork · synced 12 min ago", "Manual · updated 3 days ago") and
  opens show-the-math on click.
- Empty states say what to connect or enter next, with the button to do it.
- Loading shows the last known value with a syncing badge, never a skeleton over numbers.
- Keyboard: every control is focusable with the `focus` ring, and Esc closes panels.

**Screen-specific criteria**

- **Overview:** the net-worth tile equals the sum shown on `/money`, and a stale source turns its
  tile amber.
- **Money:** in M1, Received payments are entered by hand and audited. From M3, a payment moves to
  Received only when it's matched to a bank transaction (auto-match or a one-click confirm).
  Pipeline amounts never appear in totals.
- **Acquisition:** switching lens keeps the same layout. Funnel deltas compare to the previous
  90-day window. Stages flagged unreliable (email opens) never become the leak.
- **Quick-log:** logging one item is one tap after choosing the channel. Pasting a list of N leads
  creates N Sent items dated today. Advancing a stage is one tap and records its time.
- **Review:** lists replies waiting over 24h, asks to confirm each channel's hours for the week,
  and asks for balances older than 7 days. From M4 it also lists untagged outreach items in running
  tests and experiments whose stop rule was met. Finishing the queue sets "Reviewed" for the week.
- **Lab:** starting an experiment locks statement, metric, method, stop rule and confidence.
  Verdicts freeze with their counts and an inputs hash.
- **Skills:** tile progress from a metric updates on the nightly snapshot. Dragged tiles snap to
  the grid and persist.

## Domain model

Twenty-three tables in five groups. Every table has `id` (uuid), `user_id`, `created_at` and
`updated_at`. Money is stored as integer minor units plus an ISO 4217 `currency`, never as floats;
timestamps are UTC. The **Arrives** column says which milestone creates the table. P0 creates only
the M1 tables.

Better Auth owns the `user`, `session`, `account` and `verification` tables, so the domain Account
table is named `money_accounts`.

| Entity | Key fields | Notes | Arrives |
| --- | --- | --- | --- |
| **Sources** |  |  |  |
| Connection | `provider`, `status` (live, syncing, stale, error), `credentials_ref`, `scopes`, `last_sync_at`, `last_error`, `stale_after_minutes` | One per connected account. Credentials live in an encrypted vault table, referenced by id. | M2 |
| RawRecord | `connection_id`, `external_id`, `kind`, `payload` (jsonb), `payload_hash`, `fetched_at` | Append-only. Unique on (`connection_id`, `external_id`, `payload_hash`). | M2 |
| SyncRun | `connection_id`, `started_at`, `finished_at`, `records_in`, `status`, `error` | Feeds the Sources page log. | M2 |
| **Money** |  |  |  |
| Account (`money_accounts`) | `connection_id?`, `kind` (bank, broker, wallet, cash), `name`, `currency`, `is_liquid` | Liquid accounts count toward runway. `connection_id` is null for manual accounts (D5). | M1 |
| BalanceSnapshot | `account_id`, `as_of`, `amount`, `currency` | One per account per day minimum once synced; in M1, one per manual update. | M1 |
| Position | `account_id`, `symbol`, `name`, `qty`, `price`, `market_value`, `currency`, `as_of`, `price_delay` | From IBKR. | M3 |
| Transaction | `account_id`, `amount`, `currency`, `occurred_at`, `counterparty`, `description`, `matched_payment_id` | From bank and wallet feeds. | M3 |
| FxRate | `date`, `base`, `quote`, `rate`, `source` (manual, nbu) | Used to convert everything to the base currency. | M1 |
| **Work** |  |  |  |
| IncomeSource | `name`, `kind` (project, retainer, hourly, product, lead), `status`, `channel_id` (where it came from), `platform` | The ClientCard. Covers clients and own products alike. | M1 |
| Project | `income_source_id`, `title`, `summary`, `due_on`, `hours_estimate`, `progress` |  | M3 |
| Milestone | `project_id`, `title`, `amount`, `status` (next, active, done, paid, blocked), `due_on` |  | M3 |
| Payment | `income_source_id`, `project_id?`, `amount`, `certainty` (received, secured, committed, pipeline), `probability`, `expected_on`, `is_recurring`, `transaction_id?`, `platform_fee`, `tax_reserved` | From M3, Received requires `transaction_id`. In M1, Received is entered by hand. | M1 |
| TimeEntry | `income_source_id` or `channel_id`, `date`, `hours`, `note` | In M1, one row per channel per week from the weekly review, with `date` = week start (D4). | M1 |
| Action | `title`, `context_ref`, `kind`, `amount`, `probability`, `is_recurring`, `hours`, `origin` (manual, rule), `done_at` | Rules generate actions such as "reply waiting 24h+". | M2 |
| WeeklyReview | `week_start`, `completed_at` | New. Holds the "Reviewed" state for each week. | M1 |
| **Acquisition** |  |  |  |
| ChannelBet | `preset` (upwork, email, linkedin, content, referrals, marketplace), `hours_per_week`, `max_hours`, `started_on`, `caps` (jsonb), `cash_cost_monthly` | The "channel" that `channel_id` points to elsewhere. Stage maturities are per channel and editable. | M1 |
| OutreachItem | `channel_id`, `external_id?`, `contact_name`, `company`, `url`, `sent_at`, `stage_times` (jsonb, per universal stage), `awaiting_reply_since?`, `variant`, `hypothesis_id?`, `value_estimate`, `income_source_id?` | One proposal, email thread, invite or ask. Stage times drive the funnel. The contact fields and `awaiting_reply_since` are new (D3); `variant` and `hypothesis_id` stay null until M4. | M1 |
| **Learning** |  |  |  |
| Lever | `label`, `icon`, `x`, `y` | Canvas position persisted. | M4 |
| Hypothesis | `code`, `lever_id`, `metric_key`, `status`, `change`, `direction`, `amount`, `window_days`, `because`, `method`, `stop_rule`, `kill_rule`, `confidence`, `n_target`, `started_at`, `ended_at`, `locked_at`, `verdict` (jsonb, frozen), `adopted_to_skill_id` | Statement fields are immutable after `locked_at`. | M4 |
| Amendment | `hypothesis_id`, `field`, `old`, `new`, `reason`, `at` |  | M4 |
| MetricSnapshot | `metric_key`, `date`, `value`, `numerator`, `denominator`, `inputs_hash`, `recalculated_from?` | Nightly and immutable; a correction adds a row. M1 computes metrics on read. | M3 |
| SkillNode | `tree_id`, `title`, `icon`, `col`, `row`, `requires` (uuid\[\]), `progress_kind` (metric, steps, levels, toggle), `metric_key?`, `target?`, `steps` (jsonb), `level`, `max_level`, `done_at` |  | M5 |
| AuditEvent | `entity`, `entity_id`, `actor` (sync, user, rule), `change` (jsonb), `at` | Every write that changes a number the user sees. | M1 |

Settings live on the user row: `base_currency` (USD), `monthly_cost`, `tax_rate_bps` (default 500,
new per D7), `baseline_rate`, `target_hours`, `horizon_months` (default 12) and `timezone`.

## Metrics engine

All formulas live in `packages/core` as pure functions with fixture tests. Every function returns
the value plus its inputs (numerator, denominator, record ids), so show-the-math needs no second
query. **M1 computes metrics on read with these functions.** Nightly snapshots, in the user's
timezone and after each sync, start when the worker lands in M3.

**Money** (M1)

- **Base currency:** every amount is converted with the FxRate of its own date. Net worth uses
  today's rate. In M1 rates are entered by hand (D6).
- **Net worth** = liquid balances + position market values, in the base currency.
- **Runway (months)** = liquid balances ÷ `monthly_cost`.
- **Effective rate** = net income over 90 days ÷ client hours over 90 days.
- **Net income** = amount − `platform_fee` − `tax_reserved`, where `tax_reserved` = amount ×
  `tax_rate_bps` ÷ 10,000 unless it's recorded explicitly (D7).
- **Certainty rules:**
  - Received: matched to a bank or wallet transaction from M3; entered by hand in M1.
  - Secured: prepaid, in escrow, or invoiced.
  - Committed: agreed but not funded.
  - Pipeline: an estimate × probability, shown hatched, never in totals.

```latex
\text{freedom ratio} = \frac{\text{recurring net income (trailing 3-month average)}}{\text{monthly cost}}
```

Recurring means retainers, products and subscriptions, net of platform fees and tax reserve. Months
to freedom = (monthly cost − recurring) ÷ average monthly growth in recurring income over the last 3
months. It is shown only when growth is above zero.

**Acquisition**

- **Stage rates** (M1): rate from stage *i* to *i+1* = items that reached *i+1* ÷ items that
  reached *i*.
  - Only items older than that stage's maturity count: 7 days for Attention and Conversation, 21
    for Meeting, 45 for Win.
  - Maturities are per channel and editable.
- **Baseline** (M1): the same rate over the previous 90-day window. The delta is shown in
  percentage points.
- **Biggest leak** (M1): the step with the lowest rate ÷ baseline, if below 0.97. Steps touching a
  flagged stage (email opens) are excluded.
- **Attribution** (M1): payment → income source → `channel_id` of the outreach item that produced
  it.

```latex
\text{return per hour}_{c} = \frac{\text{won}_{c} - \text{cash cost}_{c}}{\text{hours}_{c}} \quad \text{(90 days)}
```

- **Verdicts** (M2):
  - Add hours: at least 1.5 × baseline rate
  - Hold: at least 0.8 × baseline rate
  - Trim: below that
  - Too early: channel under 45 days old
- **Rebalance** (M2):
  - **Donor:** the weakest mature channel, only if it earns below the baseline rate. It gives up
    to half its weekly hours, capped at 4.
  - **Recipients:** channels ranked by return per hour, each filled up to its `max_hours`.
  - **Expected gain** = Σ hours moved × (recipient rate − donor rate) × 4.33, labelled "if returns
    hold".

**Actions** (M2)

```latex
\text{return per hour} = \frac{\text{amount} \times p \times (\text{recurring} ? H : 1)}{\text{hours}}
```

H is `horizon_months` (default 12). Actions below `baseline_rate` are greyed.

**Experiments** (M4)

- **Binary metrics** (viewed, replied, won):
  - Each arm gets a Beta(1, 1) prior and a posterior Beta(1 + successes, 1 + failures).
  - P(B beats A) and the 90% interval of the difference come from 20,000 seeded Monte Carlo draws.
    Seeding keeps the result reproducible.
- **Continuous metrics** (revenue): bootstrap, 5,000 seeded resamples.
- **Before/after** uses the same maths on the two windows and is labelled weaker evidence.
- **Verdict at the stop rule:**
  - Supported: the 90% interval clears zero in the predicted direction.
  - Refuted: it clears zero the other way.
  - Otherwise: inconclusive.
- **Frozen verdict:** stores counts, the interval, the seed and `inputs_hash`. If late data changes
  the inputs, the result shows "recalculated" with both values instead of silently updating.
- **Kill rule:** checked on every snapshot. When met, the review queue flags the experiment; it is
  never auto-stopped.
- **Calibration:** Brier score = mean of (confidence − outcome)² over concluded, non-inconclusive
  hypotheses. Bins are 10 points wide from 50% to 100%.

## Data sources and sync

*(Changed: D3, D5, D6, D12–D16. Access findings are from Sep 28, 2026.)* Every source has a manual
or CSV fallback, so no milestone is blocked by API access. **verify** marks an assumption to
confirm in the connector's first ticket.

| Source | Data | Method | Known limits and findings | Milestone | Fallback |
| --- | --- | --- | --- | --- | --- |
| Monobank | Accounts, balances, transactions | Personal API token; webhook for new statement items; daily reconcile | Client info and statements: 1 call per 60 s per token. At most 31 days + 1 h and 500 items per statement call (medium confidence). Backfilling a year for 3 accounts takes about 36 minutes, which needs the worker. The personal token covers the owner's accounts only. Webhook signing is unverified, so treat it as unsigned (D15). | M3 | Manual balance (M1), CSV statement |
| IBKR (Central Europe) | Positions, cash, NAV | Flex Web Service, daily after close | Read-only by design. Data refreshes once a day at end of day; label prices as delayed. Token lifetime is set when the token is generated, so a renewal reminder is needed. **verify** Flex availability for IB Central Europe in a 1-hour spike. | M3 | Manual balance (M1), Flex CSV |
| PayPal (personal) | Balance, transactions | Activity Download CSV | The production REST API requires a business account (confirmed). CSV exports cover at most 12 months each. If a business account opens, the API becomes an option. | M3 | Manual balance (M1) |
| Payoneer | Balance, transactions | **verify** access for a personal account | Receives Upwork withdrawals. New source (D14). | M3 | Manual balance (M1), CSV |
| Upwork | Proposals, contracts, earnings | GraphQL API with an approved key, every 6 h | Eligible ($40K lifetime, JSS 100%); personal/internal use only; about 1 week review; ≤ 40,000 requests/day ([source](https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork)). **verify** in the GraphQL Explorer with the approved key which stage timestamps, Connects, reply signals and earnings are exposed. The docs block automated reading. | M2 | Quick-log (M1, the baseline for every stage) |
| Cold email | Sends, replies | Quick-log and paste a list | No sending tool: leads are found with Claude and written to by hand. Opens aren't tracked. Add a tool integration only if a tool is adopted. | M1 | — |
| LinkedIn | Invites, accepts, replies | Quick-log | No sanctioned API for this data. Never scrape. | M1 | — |
| Referrals | Asks, intros, wins | Quick-log | — | M1 | — |
| Audience (X etc.) | Followers | Manual weekly number, or an API if affordable (**verify**) | — | Unscheduled | Manual |
| FX | Daily rates | NBU API `bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=YYYYMMDD&json` | Official UAH rates for any past date; free, no auth (verified live). Cross rates such as USD/EUR are derived from the two UAH rates. Monobank's public endpoint has current rates only (D16). | M3 | Manual rate (M1) |

**Sync pipeline** (from M2)

1. **Fetch:** the connector pulls since its cursor, through a per-connection rate limiter.
2. **Store raw:** append to RawRecord. Idempotent on (connection, external id, payload hash).
3. **Normalize:** RawRecord → Account, BalanceSnapshot, Position, Transaction, OutreachItem, with
   the AuditEvent actor `sync`.
4. **Match** (M3): incoming transactions are matched to open payments by amount (±2% for FX and
   fees), counterparty and a date window. A match is auto-confirmed only when unique; otherwise it
   goes to the review queue. Transfers between the owner's own accounts are never income.
5. **Snapshot** (M3): recompute affected metrics, write MetricSnapshot rows, and re-check kill
   rules and stop rules.
6. **Freshness:** each connection has `stale_after_minutes`. Past it, the UI turns amber and
   experiments depending on it pause their verdicts.

**Connector contract**

```ts
interface Connector<Cfg> {
  provider: string;                       // 'monobank' | 'ibkr' | ...
  scopes: readonly string[];              // read-only scopes only
  connect(input: unknown): Promise<Cfg>;  // validates credentials
  fetch(cfg: Cfg, cursor: string | null): AsyncIterable<RawRecordInput>;
  normalize(raw: RawRecord): NormalizedWrite[];
  webhook?(req: Request): Promise<RawRecordInput[]>;
  staleAfterMinutes: number;
}
```

## Architecture and stack

*(Changed: D1, D8.)* A TypeScript monorepo with one Postgres database and all maths in a pure
package. Through M1 there is **one deployable**, the web app. A worker arrives with the first sync
job.

Data flow once the worker exists: sources → worker (fetch, store raw, normalize, match, snapshot) →
Postgres ← web (reads snapshots and records, writes user inputs). Only the worker talks to external
APIs. The web app never calls a source directly, so a slow bank API can't slow a page.

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript, strict mode | One language for agents across web, worker and core |
| Web | Next.js (App Router), React, on Vercel | Server components read data; server actions for inputs |
| Database | Neon Postgres + Drizzle ORM + SQL migrations; a Neon branch per preview deploy | Relational data, typed queries, isolated preview data |
| Auth | Better Auth, Google OAuth, one allowed email | Single user; no email provider to run |
| Jobs | None in P0–M1. M2's Upwork sync host is decided at M2 start. From M3: Cloudflare Workers (Cron Triggers + Queues) | The Monobank backfill and IBKR report polling outgrow request lifetimes |
| Validation | Zod at every boundary (API input, connector payloads, env) | One schema gives agents both compile-time and runtime types |
| Charts and canvases | Hand-rolled SVG from the Vector components; no chart library | Keeps the animation and token rules identical to the design system |
| Tests | Vitest (unit, fixtures), Playwright (e2e and visual) | Fast unit loop for formulas; screenshots against Vector previews |
| Hosting | Web on Vercel; worker on Cloudflare (M3); Neon | Owner's accounts; cheap for one user |

Pinned versions, and the reasoning behind them, are in `docs/adr/0001-stack.md`.

**Repository layout**

```text
AGENTS.md                 rules every agent reads first
apps/web/                 Next.js routes from the Screens section
apps/worker/              queue jobs: sync, normalize, match, snapshot, stats (M2/M3)
packages/core/            pure domain logic: money, metrics, stats, roi, rebalance
packages/db/              Drizzle schema, migrations, seed (sample data from the Vector previews)
packages/connectors/      one folder per provider implementing Connector (M2)
packages/ui/              Vector tokens.css + components as TSX
packages/config/          tsconfig, eslint, prettier presets
docs/                     this spec, ADRs, runbooks
```

**Code conventions**

- Money is an integer in minor units plus a currency; one `Money` type in `core`. No floats for
  money.
- Dates are ISO strings in UTC in storage. The user's timezone applies only in the UI and snapshot
  scheduling.
- `core` has no I/O. Every exported function has a fixture test, and metric outputs carry their
  inputs.
- Every query goes through the user-scoped data-access helper in `packages/db` (D1).
- Errors are typed results at boundaries; never throw across a connector boundary.
- Every write that changes a user-visible number emits an AuditEvent.

## Design system

Port the [Vector design system](https://claude.ai/code/artifact/7ba22b06-4d50-4fb2-9ab2-f1f1ca8f3a7e)
into `packages/ui` one-to-one; its previews are the acceptance reference for every component. **All
33 components are ported in P0** (D9).

**What to take from the artifact** (published paths under `project/`)

- `tokens.json` → a build script generates `tokens.css` (CSS variables) and `tokens.ts` (typed
  names). Never hand-copy values.
- `components/bundle.css` → `packages/ui/styles.css`: the same `vx-` class names, kept as-is.
- `components/index.d.ts` → the public prop types. Keep component names and props identical so the
  READMEs stay valid.
- `components/bundle.js` → rewrite each component as a typed TSX file with the same behaviour. The
  bundle is plain `React.createElement` code, so the port is mechanical.
- Each `components/<Name>/README.md` becomes that component's doc comment and Storybook-style page.
- The reference pages (Dashboard, Work, Acquisition, Lab) double as the layout spec for their
  routes.
- The sample data lives inside the preview files; T07 extracts it for the seed.

**Rules agents must not break**

- Colours come from tokens only; no new hex values in components.
- Money shows its certainty with the `sure-*` tokens.
- Up and down always carry ▲ ▼ and a sign; colour is never the only signal.
- Channels and sources use two-letter monograms, never platform logos, colours or UI.
- Animations use the `dur-*` and `ease-*` tokens and stop under `prefers-reduced-motion`.
- Text contrast is at least 4.5:1 on its surface; control borders use `line-control` (3:1).

**Visual tests**

For every component, a Playwright test renders the same sample props as its Vector preview and
compares a screenshot. Allow a small diff threshold; fonts may differ between environments.

## Security and privacy

*(Changed: D1, D8, D15, D17.)* The app will hold tokens to a bank, a broker and a payment account,
so treat it like a finance product from day one.

- **Read-only access.** Request read-only scopes only; never store bank or platform passwords.
- **Encrypted credentials** (from M2, with the first stored token). Encrypt tokens at rest with
  AES-256-GCM, using a key from the host's secret manager, not the database. Only the job runtime
  can decrypt them.
- **No row-level security while single-user** (D1). Every table keeps `user_id`, and every query
  goes through one user-scoped helper. Add RLS before any second user.
- **Webhooks.** Verify signatures where the provider offers them. Otherwise use an unguessable
  per-connection URL and re-fetch the data rather than trusting the payload.
- **Logs.** Never log tokens, full account numbers or raw payloads. Redact at the logger.
- **Auth.** Google OAuth through Better Auth; only the owner's email may sign in; sessions expire
  after 30 days.
- **No third-party analytics** or session recording on any page that shows money.
- **Your data, your exit.** Export everything as JSON and CSV (M3).
- **Backups.** M1 data is entered by hand and can't be re-synced (D17). Use Neon's point-in-time
  restore. Confirm the plan's restore window before T05, and test a restore once per milestone.
- **Agents in the repo** never receive production credentials. They work against seed data and
  recorded API fixtures only.

## Build plan for agents

The agent rules live in `AGENTS.md`. The ordered working plan for the current milestones is
`PLAN.md`, which is not committed. After T01, three streams can run in parallel: UI port, data, and
core maths.

**Ticket template:** goal (one sentence) · spec sections · inputs/outputs (types) · acceptance
criteria (testable) · out of scope · depends on.

**Definition of done**

- Acceptance criteria pass as automated tests: unit for `core`, e2e or visual for UI.
- Typecheck, lint and all tests green in CI; a preview deploy is linked in the PR.
- Works at 390 and 1280 px with keyboard only and with reduced motion.
- No secrets, no TODOs without a ticket, and the spec is updated where behaviour changed.

**Tickets**

*(Re-sequenced by milestone.)* IDs are kept from the original plan. A split ticket gets a suffix,
and new tickets start at T34.

| ID | Ticket | Milestone | Depends on | Done when |
| --- | --- | --- | --- | --- |
| T01 | Monorepo scaffold: pnpm workspaces, TS strict, lint, Vitest, Playwright, knip, CI, Vercel preview deploys with a Neon branch each | P0 | — | CI green on an empty web app; a PR gets a preview URL |
| T02 | Token pipeline: tokens.json → tokens.css + tokens.ts | P0 | T01 | Generated values match the artifact exactly |
| T03 | Port base UI: Button, Badge, Delta, SegmentedControl, Card, StatTile, Sparkline, ProgressRing, Icon | P0 | T02 | Visual tests pass against Vector previews |
| T04 | Port data UI: TrendChart (with markers), FunnelChart, AllocationBar, HoldingsTable, SourceStatus | P0 | T03 | Visual tests pass; reduced motion honoured |
| T34 | Port acquisition, money and action UI: ChannelPicker, ChannelLens, ChannelFunnel, ChannelHealth, ChannelPortfolio, ActionQueue, FreedomMeter, ClientCard, ProjectCard, PayoutBar, IncomeForecast | P0 | T04 | Visual tests pass |
| T35 | Port lab and skill UI: EvidenceMeter, ForestPlot, CalibrationChart, HypothesisCanvas, HypothesisPanel, SkillTree, SkillNode, SkillPanel | P0 | T04 | Visual tests pass |
| T05 | Schema and migrations for the M1 tables; the user-scoped data-access helper | P0 | T01 | Migrations apply clean on a fresh Neon branch; a test shows the helper never returns another user's rows |
| T06 | Auth (Better Auth, Google, one allowed email) and Settings page | P0 | T05 | The allowed account signs in and any other is rejected; settings persist |
| T07 | Seed data from the Vector previews | P0 | T05 | The seed applies to every preview branch |
| T08 | core: Money, FX conversion, net worth, runway, effective rate, freedom ratio (net of fees and tax reserve) | M1 | T01 | Fixture tests cover currency edge cases |
| T22a | core: stage rates with maturity, baseline, delta, biggest leak | M1 | T08 | Fixtures reproduce the Acquisition reference numbers for these metrics |
| T19 | Channel presets, `/setup`, ChannelBet, accounts, cost, tax rate | M1 | T06, T34 | ChannelPicker saves bets and hours |
| T20 | Quick-log: one tap, paste a list, stage taps, awaiting-reply flag | M1 | T19 | Logging one item is one tap; pasting N leads creates N items |
| T14a | Manual money: accounts with balances and a manual FX rate, income sources, received payments; minimal `/money` | M1 | T06, T08 | FreedomMeter, net worth and runway compute from manual entries |
| T23a | `/acquisition` and `/acquisition/[channel]`: ChannelLens, ChannelFunnel, ChannelHealth, TrendChart | M1 | T04, T20, T22a | The same blocks appear in every lens |
| T18a | Show-the-math drawer and freshness for manual sources | M1 | T08, T14a | Every number opens its math; a stale balance turns its tiles amber |
| T17 | Overview page | M1 | T14a, T23a, T18a | The net-worth tile equals the `/money` total |
| T25a | Weekly review: waiting replies, hours per channel, stale balances, "Reviewed" per week | M1 | T20, T14a | The queue clears in under 10 minutes on seed data |
| T09a | Sync foundation: Connection, RawRecord, SyncRun, credentials vault, rate limiter, Connector interface, M2 job host | M2 | T05 | A fake connector syncs idempotently twice |
| T21 | Upwork connector, starting with a GraphQL Explorer spike | M2 | T09a | Exposed stages sync every 6 h; the rest stay on quick-log |
| T22b | core: channel return per hour, verdicts, rebalance | M2 | T22a | Fixtures reproduce the Acquisition reference numbers |
| T23b | ChannelPortfolio on `/acquisition` | M2 | T22b | Verdicts shown for every channel older than 45 days |
| T24 | Action rules and ranked ActionQueue data | M2 | T22b | Replies waiting 24h+ appear as actions |
| T18b | Sources page | M2 | T09a | A stale source turns amber on every dependent tile |
| T09b | Cloudflare worker: queue, cron, nightly MetricSnapshot | M3 | T09a | Snapshots written nightly in the user's timezone |
| T10 | Monobank connector and webhook | M3 | T09b | Recorded fixtures; balances match to the cent |
| T11 | IBKR connector (first verify Flex for IB Central Europe) | M3 | T09b | Positions and cash match a real statement |
| T12 | PayPal and Payoneer: CSV, or API where available (verify first) | M3 | T13 | Balances match the provider UI |
| T13 | CSV import framework with column mapping | M3 | T09b | Imports a Monobank and an IBKR CSV |
| T36 | NBU FX feed | M3 | T09b | Rates for any past date are stored and used |
| T14b | Projects, milestones, all payment certainty states | M3 | T14a | All certainty states can be created and edited |
| T15 | Transfers between own accounts, bank matching (one transaction to many payments) and match review items | M3 | T10, T14b | Unique matches auto-confirm; ambiguous ones go to review; transfers never count as income |
| T16 | Full Money page: ClientCard, ProjectCard, PayoutBar, IncomeForecast | M3 | T14b, T15 | Matches the Work reference page; pipeline never in totals |
| T26 | core stats: Beta-binomial Monte Carlo, bootstrap, verdicts, Brier score | M4 | T08 | Seeded results are reproducible |
| T27 | Levers, hypotheses, locking, amendments | M4 | T06 | Locked fields reject edits; amendments are logged |
| T28 | HypothesisCanvas + HypothesisPanel | M4 | T35, T27 | Dragging a lever to a metric creates a draft |
| T29 | Variant tagging in quick-log and review | M4 | T20, T27 | Every outreach item in a running test has a variant |
| T30 | Frozen verdicts, ForestPlot, CalibrationChart, experiment markers | M4 | T26, T28 | A late correction shows "recalculated" |
| T31 | Skill tree canvas with persistence | M5 | T35 | Tile moves and progress survive reload |
| T32 | Metric-linked skill tiles | M5 | T31, T09b | Tiles update from nightly snapshots |
| T33 | Mobile and accessibility audit | M5 | T17, T23b, T30 | No horizontal scroll at 390 px; axe audit clean |

## Open decisions and risks

**Decided**

| Decision | Choice |
| --- | --- |
| Database host | Neon (D8) |
| Base currency | USD, with UAH shown in detail lines |
| Job host | Cloudflare Workers from M3 (D8) |
| Personal tool vs product | Personal tool (D1) |

**Open**

| Decision | Default | Decide before |
| --- | --- | --- |
| Neon restore window: does the plan cover the M1 manual data? | At least 7 days of point-in-time restore | T05 |
| Where M2's Upwork sync runs | Vercel Cron if it fits the function limits, otherwise Cloudflare Workers | T09a |
| Baseline window | Previous 90 days | T22a |
| Monthly cost currency; tax details, including whether the 1% military levy applies to FOP group 3 | Cost entered in its own currency; tax at 5% | M3 |
| How the M3 gate is measured | Each account's balance compared in its own currency, once a day | M3 start |
| Experiment interval | 90% credible interval, Beta(1, 1) prior | T26 |

**Risks**

- **Upwork API fields are unverified.** If proposal stages, Connects or reply times aren't
  exposed, those stages stay on quick-log. M1 doesn't depend on the API.
- **IBKR Central Europe and Payoneer access are unverified.** Each connector ticket starts with a
  one-hour spike and falls back to CSV or manual entry if blocked.
- **Manual input fatigue.** M1 depends on logging everything. Quick-log must stay one tap, and the
  M1 gate measures exactly this.
- **Google OAuth on preview deploys.** Redirect URIs must be registered exactly, and preview URLs
  change on every deploy. T06 needs an OAuth proxy or a stable preview alias.
- **Small samples.** With 20–60 events a month, most experiments end inconclusive. That's why the
  UI shows the chance of beating the baseline, not significance, and runs one experiment per metric
  at a time.
- **Opens and other soft signals** can mislead. They're flagged and never drive a verdict.
- **Scope creep.** Six milestones are designed, but M1 alone makes the app useful. Don't start M2
  tickets until the M1 gate holds.
