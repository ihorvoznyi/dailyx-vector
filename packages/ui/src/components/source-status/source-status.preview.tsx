import { SourceStatus } from './source-status';

/** Sample props from the Vector SourceStatus preview. */
export function SourceStatusPreview() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
        gap: 12,
      }}
    >
      <SourceStatus name="Monobank" mark="MB" detail="2 accounts" lastSync="2m ago" status="live" />
      <SourceStatus
        name="Interactive Brokers"
        mark="IB"
        detail="7 positions"
        lastSync="now"
        status="syncing"
      />
      <SourceStatus name="PayPal" mark="PP" detail="USD" lastSync="3d ago" status="stale" />
      <SourceStatus
        name="Upwork"
        mark="UW"
        detail="Token expired"
        lastSync="1w ago"
        status="error"
      />
    </div>
  );
}
