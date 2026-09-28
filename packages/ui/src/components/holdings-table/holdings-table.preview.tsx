import { Card } from '../card';
import { HoldingsTable } from './holdings-table';

/** Sample props from the Vector HoldingsTable preview. */
export function HoldingsTablePreview() {
  return (
    <Card eyebrow="IBKR" title="Positions" meta="Read-only · delayed 15m">
      <HoldingsTable
        rows={[
          { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', qty: 24, price: 548.12, change: 0.84 },
          { symbol: 'NVDA', name: 'NVIDIA', qty: 30, price: 176.4, change: -1.92 },
          { symbol: 'MSFT', name: 'Microsoft', qty: 8, price: 512.9, change: 0.31 },
          { symbol: 'BND', name: 'Vanguard Total Bond', qty: 40, price: 73.6, change: 0 },
        ]}
      />
    </Card>
  );
}
