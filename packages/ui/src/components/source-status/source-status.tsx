export interface SourceStatusProps {
  name: string;
  mark?: string;
  detail?: string;
  lastSync?: string;
  status?: 'live' | 'syncing' | 'stale' | 'error';
}

/** Stub until stage 3-6 task W2-status builds it. The props above are the contract. */
export function SourceStatus(props: SourceStatusProps) {
  void props;
  return null;
}
