import type { Payout } from '../../lib/certainty';

/** One income source: a client project, retainer, hourly contract, product or lead. */
export interface IncomeSource {
  id?: string;
  name: string;
  mark?: string;
  kind: 'project' | 'retainer' | 'hourly' | 'product' | 'lead';
  source?: string;
  status?: 'active' | 'paused' | 'lead' | 'past';
  building?: string;
  payout?: Payout;
  mrr?: number;
  earned?: number;
  effectiveRate?: number | null;
  next?: { amount: number; date: string } | null;
}

export interface ClientCardProps {
  client: IncomeSource;
  baselineRate?: number;
  selected?: boolean;
  onClick?: () => void;
  delay?: number;
}

/** Stub until stage 3-6 task W3-cards builds it. The props above are the contract. */
export function ClientCard(props: ClientCardProps) {
  void props;
  return null;
}
