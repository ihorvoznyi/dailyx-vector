import { Card } from '../card';
import { AllocationBar } from './allocation-bar';

/** Sample props from the Vector AllocationBar preview. */
export function AllocationBarPreview() {
  return (
    <div style={{ maxWidth: 460 }}>
      <Card eyebrow="Where it sits" title="By source">
        <AllocationBar
          format={{ prefix: '$' }}
          items={[
            { label: 'IBKR', detail: '7 positions', value: 26450 },
            { label: 'Monobank', detail: 'UAH ₴ 612,400 → USD', value: 14820 },
            { label: 'PayPal', detail: 'USD balance', value: 5240 },
            { label: 'Cash', detail: 'manual', value: 1700 },
          ]}
        />
      </Card>
    </div>
  );
}
