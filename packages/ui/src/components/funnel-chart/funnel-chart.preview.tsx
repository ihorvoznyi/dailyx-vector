import { Card } from '../card';
import { FunnelChart } from './funnel-chart';

/** Sample props from the Vector FunnelChart preview. */
export function FunnelChartPreview() {
  return (
    <div style={{ maxWidth: 560 }}>
      <Card eyebrow="Last 30 days" title="Client acquisition">
        <FunnelChart
          stages={[
            { label: 'Proposals', value: 64 },
            { label: 'Viewed', value: 41, convLabel: 'viewed' },
            { label: 'Conversations', value: 17, convLabel: 'replied' },
            { label: 'Contracts', value: 5, convLabel: 'signed' },
          ]}
        />
      </Card>
    </div>
  );
}
