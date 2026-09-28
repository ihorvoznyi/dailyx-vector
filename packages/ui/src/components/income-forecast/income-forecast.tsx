import type { Payout } from '../../lib/certainty';

export interface IncomeForecastProps {
  weeks: ({ label: string; items?: string[] } & Payout)[];
  weeklyCost?: number;
  height?: number;
}

/** Stub until stage 3-6 task W2-money builds it. The props above are the contract. */
export function IncomeForecast(props: IncomeForecastProps) {
  void props;
  return null;
}
