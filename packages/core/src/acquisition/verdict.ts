/* eslint-disable @typescript-eslint/no-unused-vars -- stub until T22b */
import type { Money } from '../money/money';

export type ChannelVerdict = 'add-hours' | 'hold' | 'trim' | 'too-early' | 'no-data';

export interface ChannelVerdictInput {
  readonly returnPerHour: Money | null;
  /** What an hour of billable work pays; same currency as `returnPerHour`. */
  readonly baselineRate: Money;
  /** Days since the channel's bet started. */
  readonly ageDays: number;
}

/**
 * too-early under 45 days; no-data without a return; add-hours at 1.5 × baseline or more;
 * hold at 0.8 × baseline or more; trim below that. Throws RangeError on a currency mismatch.
 */
export function channelVerdict(input: ChannelVerdictInput): ChannelVerdict {
  throw new Error('not implemented: channelVerdict');
}
