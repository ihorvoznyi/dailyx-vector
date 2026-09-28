import type { ReactNode } from 'react';
import type { Payout } from '../../lib/certainty';

export interface ProjectCardProps {
  project: {
    title: string;
    client: string;
    kind?: string;
    summary?: string;
    due?: string;
    payout: Payout;
    milestones: {
      title: string;
      amount: number;
      status?: 'paid' | 'done' | 'active' | 'next' | 'blocked';
    }[];
    progress?: number;
    hoursLogged?: number;
    hoursEstimate?: number;
  };
  footer?: ReactNode;
}

/** Stub until stage 3-6 task W3-cards builds it. The props above are the contract. */
export function ProjectCard(props: ProjectCardProps) {
  void props;
  return null;
}
