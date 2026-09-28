'use client';

import { useState } from 'react';

import { Card } from '../card';
import { ActionQueue, type Action } from './action-queue';

const BASE = 65;
const ACTIONS: Action[] = [
  {
    id: 'a1',
    title: 'Invoice Kite for September hours',
    context: 'Kite Analytics',
    kind: 'Cash in',
    amount: 1300,
    probability: 1,
    hours: 0.17,
  },
  {
    id: 'a2',
    title: 'Follow up on the Orbit proposal',
    context: 'Orbit Labs',
    kind: 'Close',
    amount: 6000,
    probability: 0.3,
    hours: 0.5,
  },
  {
    id: 'a3',
    title: 'Pitch Lumen a reporting add-on',
    context: 'Lumen Health',
    kind: 'Expand',
    amount: 800,
    probability: 0.5,
    recurring: true,
    hours: 2,
  },
  {
    id: 'a4',
    title: 'Ship the milestone 2 demo',
    context: 'Northwind Pay',
    kind: 'Deliver',
    amount: 3500,
    probability: 0.95,
    hours: 12,
  },
  {
    id: 'a5',
    title: 'Add two templates to Workflow Kit',
    context: 'Workflow Kit',
    kind: 'Build',
    amount: 120,
    probability: 0.6,
    recurring: true,
    hours: 6,
  },
  {
    id: 'a6',
    title: 'Take extra Kite hours this week',
    context: 'Kite Analytics',
    kind: 'Bill',
    amount: 650,
    probability: 1,
    hours: 10,
  },
  {
    id: 'a7',
    title: 'Redesign my personal site',
    context: 'Brand',
    kind: 'Nice to have',
    amount: 300,
    probability: 0.3,
    hours: 14,
  },
];

/** Sample props from the Vector ActionQueue preview. */
export function ActionQueuePreview() {
  const [actions, setActions] = useState(ACTIONS);
  return (
    <Card
      eyebrow="This week"
      title="Next best hours"
      meta="Ranked by expected return per hour. Recurring wins count 12 months."
    >
      <ActionQueue actions={actions} onChange={setActions} baselineRate={BASE} />
    </Card>
  );
}
