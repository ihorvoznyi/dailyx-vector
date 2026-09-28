import { ClientCard, type IncomeSource } from './client-card';

const BASE = 65;

const CLIENTS: IncomeSource[] = [
  {
    id: 'northwind',
    name: 'Northwind Pay',
    mark: 'NP',
    kind: 'project',
    source: 'Upwork',
    status: 'active',
    building: 'Merchant analytics dashboard, milestone 2 of 4',
    payout: { received: 1500, secured: 3500, committed: 4000 },
    earned: 5200,
    effectiveRate: 71,
    next: { amount: 3500, date: 'Oct 9' },
  },
  {
    id: 'lumen',
    name: 'Lumen Health',
    mark: 'LH',
    kind: 'retainer',
    source: 'Referral',
    status: 'active',
    building: 'Intake automation + monthly reporting',
    mrr: 2400,
    earned: 9600,
    effectiveRate: 100,
    next: { amount: 2400, date: 'Oct 1' },
  },
  {
    id: 'kite',
    name: 'Kite Analytics',
    mark: 'KA',
    kind: 'hourly',
    source: 'Cold email',
    status: 'active',
    building: 'Data pipeline fixes, capped at 10h/week',
    payout: { secured: 1300, committed: 2600 },
    earned: 3900,
    effectiveRate: 65,
    next: { amount: 1300, date: 'Oct 3' },
  },
  {
    id: 'kit',
    name: 'Workflow Kit',
    mark: 'WK',
    kind: 'product',
    source: 'Gumroad',
    status: 'active',
    building: 'Automation templates · 38 buyers',
    mrr: 420,
    earned: 2980,
    effectiveRate: 140,
    next: { amount: 420, date: 'Oct 15' },
  },
];

/** Sample props from the Vector ClientCard preview: the first four CLIENTS. */
export function ClientCardPreview() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}
    >
      {CLIENTS.map((c, i) => (
        <ClientCard key={c.id} client={c} baselineRate={BASE} delay={i * 60} />
      ))}
    </div>
  );
}
