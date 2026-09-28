import type { Payout } from '../../lib/certainty';

export interface PayoutBarProps {
  parts: Payout;
  label?: string;
  total?: boolean;
  legend?: boolean;
  compact?: boolean;
}

/** Stub until stage 3-6 task W2-money builds it. The props above are the contract. */
export function PayoutBar(props: PayoutBarProps) {
  void props;
  return null;
}
