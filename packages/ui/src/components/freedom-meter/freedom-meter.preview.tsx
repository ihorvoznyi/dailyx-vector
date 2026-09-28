import { Card } from '../card';
import { FreedomMeter } from './freedom-meter';

/** Sample props from the Vector FreedomMeter preview. */
export function FreedomMeterPreview() {
  return (
    <Card eyebrow="Freedom" title="How close am I to not needing to trade hours?">
      <FreedomMeter
        monthlyCost={3800}
        recurring={2820}
        active={4100}
        runwayMonths={5.9}
        hoursPerWeek={46}
        targetHours={25}
        effectiveRate={78}
        recurringGrowth={240}
      />
    </Card>
  );
}
