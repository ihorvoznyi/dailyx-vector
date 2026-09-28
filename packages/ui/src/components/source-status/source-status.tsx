import { Monogram } from '../../atoms/monogram';
import { StatusDot } from '../../atoms/status-dot';
import { Badge } from '../badge';

export interface SourceStatusProps {
  name: string;
  mark?: string;
  detail?: string;
  lastSync?: string;
  status?: 'live' | 'syncing' | 'stale' | 'error';
}

const STATUS = {
  live: ['up', 'Live'],
  syncing: ['info', 'Syncing'],
  stale: ['warn', 'Stale'],
  error: ['down', 'Error'],
} as const;

/**
 * SourceStatus shows one connected data source and how fresh its data is. Status is a Badge
 * with a dot and a word; `live` pulses gently. Show every connected source in a row at the top
 * of the overview so stale numbers are never a surprise.
 */
export function SourceStatus({ name, mark, detail, lastSync, status = 'live' }: SourceStatusProps) {
  const [tone, word] = STATUS[status] ?? STATUS.live;
  const letters =
    mark ??
    name
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-bg-100 px-14px py-3">
      <Monogram>{letters}</Monogram>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-ink">{name}</div>
        <div className="truncate text-caption text-ink-faint">
          {[detail, lastSync].filter(Boolean).join(' · ')}
        </div>
      </div>
      <Badge tone={tone}>
        <StatusDot status={status} />
        {word}
      </Badge>
    </div>
  );
}
