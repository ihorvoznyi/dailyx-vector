/** One acquisition channel as a bet of hours (Vector index.d.ts `ChannelBet`). */
export interface ChannelBet {
  id: string;
  name: string;
  mark: string;
  hoursPerWeek: number;
  hours90?: number;
  won: number;
  cost?: number;
  costLabel?: string;
  wins: number;
  daysToFirst?: number;
  maxHours?: number;
  ageDays?: number;
  color?: string;
}

export interface ChannelPortfolioProps {
  channels: ChannelBet[];
  baselineRate?: number;
  onSelect?: (id: string) => void;
  onApply?: (plan: { to: ChannelBet; hours: number }[], donor: ChannelBet) => void;
}

/** Stub until stage 3-6 task W2-channels builds it. The props above are the contract. */
export function ChannelPortfolio(props: ChannelPortfolioProps) {
  void props;
  return null;
}
