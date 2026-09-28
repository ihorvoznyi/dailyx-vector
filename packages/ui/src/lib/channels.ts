/** A channel's own vocabulary, mapped onto the five universal stages. */
export interface ChannelPreset {
  id: string;
  name: string;
  mark: string;
  blurb: string;
  stages: string[];
  cost: string;
  verb: string;
  flags?: Record<number, string>;
}

/** The five stages every channel maps to. */
export const universalStages = ['Reach', 'Attention', 'Conversation', 'Meeting', 'Win'] as [
  'Reach',
  'Attention',
  'Conversation',
  'Meeting',
  'Win',
];

/** Channel presets: the words a founder already uses on each channel. */
export const channels: Record<
  'upwork' | 'email' | 'linkedin' | 'content' | 'referrals' | 'marketplace',
  ChannelPreset
> = {
  upwork: {
    id: 'upwork',
    name: 'Upwork',
    mark: 'UW',
    blurb: 'Proposals on posted jobs, paid in Connects',
    stages: ['Proposals sent', 'Viewed', 'Replied', 'Interviewed', 'Hired'],
    cost: 'Connects',
    verb: 'proposal',
  },
  email: {
    id: 'email',
    name: 'Cold email',
    mark: 'CE',
    blurb: 'Sequences to a sourced list, from warmed domains',
    stages: ['Emails sent', 'Opened', 'Replied', 'Meetings booked', 'Won'],
    cost: 'Tools & domains',
    verb: 'email',
    flags: { 1: 'Opens are estimates: mail privacy features pre-load images' },
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    mark: 'LI',
    blurb: 'Connection requests, then DMs to a warm first line',
    stages: ['Invites sent', 'Accepted', 'Replied', 'Calls booked', 'Won'],
    cost: 'Sales tools',
    verb: 'invite',
  },
  content: {
    id: 'content',
    name: 'Content',
    mark: 'CT',
    blurb: 'Posts that bring people to you',
    stages: ['Posts', 'Profile visits', 'Inbound DMs', 'Calls', 'Won'],
    cost: 'Tools',
    verb: 'post',
  },
  referrals: {
    id: 'referrals',
    name: 'Referrals',
    mark: 'RF',
    blurb: 'Asking happy clients and peers for intros',
    stages: ['Asks made', 'Intros', 'Calls', 'Proposals', 'Won'],
    cost: 'Gifts & fees',
    verb: 'ask',
  },
  marketplace: {
    id: 'marketplace',
    name: 'Other marketplace',
    mark: 'MK',
    blurb: 'Any platform with bids or applications',
    stages: ['Applications', 'Shortlisted', 'Replied', 'Calls', 'Hired'],
    cost: 'Fees',
    verb: 'application',
  },
};
