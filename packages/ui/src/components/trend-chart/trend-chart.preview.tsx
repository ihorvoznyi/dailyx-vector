'use client';

import { useState } from 'react';

import { Card } from '../card';
import { SegmentedControl } from '../segmented-control';
import { TrendChart } from './trend-chart';

function gen(n: number, start: number, drift: number, vol: number, seed: number): number[] {
  const out: number[] = [];
  let v = start;
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    v += drift + (s / 233280 - 0.5) * vol;
    out.push(Math.round(v));
  }
  return out;
}

const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const R: Record<string, number> = { '3M': 3, '6M': 6, '1Y': 12 };

/** Sample props from the Vector TrendChart preview. */
export function TrendChartPreview() {
  const [range, setRange] = useState('1Y');
  const n = R[range]!;
  const a = gen(12, 31000, 1500, 2600, 7);
  const b = gen(12, 28000, 1100, 1800, 3);
  const slice = (arr: number[]) =>
    arr.slice(12 - n).map((y, i) => ({
      x: months[12 - n + i]!,
      y,
      label: months[12 - n + i]! + (12 - n + i < 3 ? ' 2025' : ' 2026'),
    }));

  return (
    <Card
      eyebrow="Distributed net worth"
      title="$48,210"
      meta="Monobank + IBKR + PayPal, in USD"
      action={<SegmentedControl options={['3M', '6M', '1Y']} value={range} onChange={setRange} />}
    >
      <TrendChart
        format={{ prefix: '$' }}
        series={[
          { name: 'Net worth', data: slice(a) },
          { name: 'Last year', data: slice(b), dashed: true, area: false },
        ]}
      />
    </Card>
  );
}
