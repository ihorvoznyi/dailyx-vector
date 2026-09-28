'use client';

import { Card } from '../card';
import { ChannelPortfolio, type ChannelBet } from './channel-portfolio';

const BASE = 65;
const PORTFOLIO: ChannelBet[] = [
  {
    id: 'upwork',
    name: 'Upwork',
    mark: 'UW',
    hoursPerWeek: 8,
    won: 14200,
    cost: 310,
    costLabel: 'Connects',
    wins: 6,
    daysToFirst: 9,
    maxHours: 15,
  },
  {
    id: 'email',
    name: 'Cold email',
    mark: 'CE',
    hoursPerWeek: 5,
    won: 7500,
    cost: 290,
    costLabel: 'tools & domains',
    wins: 2,
    daysToFirst: 34,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    mark: 'LI',
    hoursPerWeek: 6,
    won: 2400,
    cost: 300,
    costLabel: 'sales tools',
    wins: 1,
    daysToFirst: 52,
  },
  {
    id: 'referrals',
    name: 'Referrals',
    mark: 'RF',
    hoursPerWeek: 1,
    won: 4800,
    cost: 0,
    wins: 1,
    daysToFirst: 12,
    maxHours: 2,
  },
];

/** Sample props from the Vector ChannelPortfolio preview. */
export function ChannelPortfolioPreview() {
  return (
    <Card
      eyebrow="Hours are my capital"
      title="My bets"
      meta="Last 90 days. Return per hour = (won − cash cost) ÷ hours spent."
    >
      <ChannelPortfolio channels={PORTFOLIO} baselineRate={BASE} onApply={() => {}} />
    </Card>
  );
}
