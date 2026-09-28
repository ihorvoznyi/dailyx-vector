import { ProjectCard } from './project-card';

const PROJECT = {
  title: 'Merchant analytics dashboard',
  client: 'Northwind Pay',
  kind: 'project',
  summary: 'Stripe and ledger data in one live revenue view for 40 merchants',
  due: 'Nov 14',
  payout: { received: 1500, secured: 3500, committed: 4000 },
  progress: 0.38,
  hoursLogged: 64,
  hoursEstimate: 140,
  milestones: [
    { title: 'Discovery & data audit', amount: 1500, status: 'paid' as const },
    { title: 'MVP dashboard', amount: 3500, status: 'active' as const },
    { title: 'Integrations', amount: 2500, status: 'next' as const },
    { title: 'Handover & docs', amount: 1500, status: 'next' as const },
  ],
};

/** Sample props from the Vector ProjectCard preview. */
export function ProjectCardPreview() {
  return (
    <div style={{ maxWidth: 560 }}>
      <ProjectCard project={PROJECT} />
    </div>
  );
}
