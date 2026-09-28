import { Badge } from './badge';

/** Sample props from the Vector Badge preview. */
export function BadgePreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Monobank</Badge>
      <Badge tone="up">On pace</Badge>
      <Badge tone="down">Behind</Badge>
      <Badge tone="warn">Stale</Badge>
      <Badge tone="info">Syncing</Badge>
    </div>
  );
}
