import type { ChannelPresetId } from '@dailyx/db';
import { Button } from '@dailyx/ui';

export interface QuickLogChannel {
  id: string;
  preset: ChannelPresetId;
  name: string;
}

export interface QuickLogProps {
  channels: QuickLogChannel[];
  /** Preselects this channel (acquisition empty states). */
  defaultChannelId?: string;
  /** Trigger label; default 'Log outreach'. */
  label?: string;
}

/** Stub: T5 replaces the body. The exported names and props are the contract. */
export function QuickLog({ label = 'Log outreach' }: QuickLogProps) {
  return (
    <Button variant="primary" size="sm" disabled>
      {label}
    </Button>
  );
}
