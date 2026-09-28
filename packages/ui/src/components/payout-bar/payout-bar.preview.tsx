import { PayoutBar } from './payout-bar';

const D = { received: 1500, secured: 3500, committed: 4000, pipeline: 1800 };

/** Sample props from the Vector PayoutBar preview. */
export function PayoutBarPreview() {
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PayoutBar parts={D} label="All work in flight" />
      <PayoutBar
        parts={{ received: 1500, secured: 3500, committed: 4000 }}
        compact
        legend={false}
        label="Compact"
      />
    </div>
  );
}
