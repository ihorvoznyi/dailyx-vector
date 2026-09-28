import { Button } from './button';

/** Sample props from the Vector Button preview. */
export function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" icon="+">
        Connect source
      </Button>
      <Button variant="ghost" icon="↻">
        Sync now
      </Button>
      <Button variant="ghost" loading>
        Syncing
      </Button>
      <Button variant="quiet" size="sm">
        View all
      </Button>
    </div>
  );
}
