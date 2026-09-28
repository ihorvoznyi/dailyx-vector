import { cva } from 'class-variance-authority';

const dot = cva('size-2 flex-none rounded-pill', {
  variants: {
    status: {
      live: 'animate-ping-live bg-up',
      syncing: 'bg-info',
      stale: 'bg-warn',
      error: 'bg-down',
    },
  },
});

/** The freshness dot of a data source; `live` pings softly (off under reduced motion). */
export function StatusDot({ status }: { status: 'live' | 'syncing' | 'stale' | 'error' }) {
  return <span aria-hidden className={dot({ status })} />;
}
