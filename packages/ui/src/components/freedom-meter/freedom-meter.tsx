export interface FreedomMeterProps {
  monthlyCost: number;
  recurring: number;
  active?: number;
  runwayMonths?: number;
  hoursPerWeek?: number;
  targetHours?: number;
  effectiveRate?: number;
  recurringGrowth?: number;
}

/** Stub until stage 3-6 task W2-money builds it. The props above are the contract. */
export function FreedomMeter(props: FreedomMeterProps) {
  void props;
  return null;
}
