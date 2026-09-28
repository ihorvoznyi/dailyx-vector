'use client';

import { useState } from 'react';

import { ChannelLens } from './channel-lens';

/** Sample props from the Vector ChannelLens preview. */
export function ChannelLensPreview() {
  const [value, setValue] = useState('upwork');
  return (
    <ChannelLens
      value={value}
      onChange={setValue}
      items={[
        {
          id: 'all',
          name: 'All channels',
          mark: '∑',
          sub: '4 bets · 20h/wk',
          badge: '9',
          badgeTone: 'warn',
        },
        { id: 'upwork', name: 'Upwork', mark: 'UW', sub: '8h/wk', badge: '2' },
        { id: 'email', name: 'Cold email', mark: 'CE', sub: '5h/wk', badge: '4' },
        {
          id: 'linkedin',
          name: 'LinkedIn',
          mark: 'LI',
          sub: '6h/wk',
          badge: '3',
          badgeTone: 'warn',
        },
        { id: 'referrals', name: 'Referrals', mark: 'RF', sub: '1h/wk' },
      ]}
    />
  );
}
