'use client';

import { useState } from 'react';

import { SegmentedControl } from './segmented-control';

/** Sample props from the Vector SegmentedControl preview. */
export function SegmentedControlPreview() {
  const [range, setRange] = useState('30D');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        options={['7D', '30D', '90D', '1Y', 'ALL']}
        value={range}
        onChange={setRange}
      />
      <span className="text-12px text-ink-faint">Range: {range}</span>
    </div>
  );
}
