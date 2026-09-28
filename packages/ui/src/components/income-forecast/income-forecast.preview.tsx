import { Card } from '../card';
import { IncomeForecast } from './income-forecast';

const WEEKS = [
  {
    label: 'Sep 28',
    received: 420,
    secured: 3700,
    items: ['Lumen retainer · Oct 1', 'Kite invoice · Oct 3', 'Workflow Kit sales'],
  },
  { label: 'Oct 5', secured: 3500, committed: 650, items: ['Northwind M2 (escrow)', 'Kite hours'] },
  { label: 'Oct 12', committed: 1070, items: ['Kite hours', 'Workflow Kit payout'] },
  { label: 'Oct 19', committed: 650, items: ['Kite hours'] },
  {
    label: 'Oct 26',
    committed: 650,
    pipeline: 1800,
    items: ['Kite hours', 'Orbit Labs (30% × $6,000)'],
  },
  { label: 'Nov 2', committed: 3050, items: ['Lumen retainer', 'Kite hours'] },
  { label: 'Nov 9', committed: 3150, items: ['Northwind M3', 'Kite hours'] },
  { label: 'Nov 16', committed: 1070, items: ['Kite hours', 'Workflow Kit payout'] },
  { label: 'Nov 23', committed: 650, items: ['Kite hours'] },
  { label: 'Nov 30', committed: 2150, items: ['Northwind handover', 'Kite hours'] },
  {
    label: 'Dec 7',
    committed: 2400,
    pipeline: 600,
    items: ['Lumen retainer', 'Pipeline, weighted'],
  },
  { label: 'Dec 14', pipeline: 900, items: ['Pipeline, weighted'] },
];

/** Sample props from the Vector IncomeForecast preview. */
export function IncomeForecastPreview() {
  return (
    <Card
      eyebrow="Next 12 weeks"
      title="Money coming in"
      meta="Stacked by how sure it is. The dashed line is what life costs per week."
    >
      <IncomeForecast weeks={WEEKS} weeklyCost={877} />
    </Card>
  );
}
