import type { UserData } from '@dailyx/db';

import type { QuickLogChannel } from '../components/quick-log/quick-log';
import { activeBets, presetOf } from './channels';

export interface ShellData {
  /** Zero channel_bets rows (not "zero active"). */
  needsSetup: boolean;
  quickLogChannels: QuickLogChannel[];
  timezone: string;
}

export async function loadShell(data: UserData): Promise<ShellData> {
  const [bets, settings] = await Promise.all([data.channelBets.list(), data.settings.get()]);
  return {
    needsSetup: bets.length === 0,
    quickLogChannels: activeBets(bets).map((bet) => ({
      id: bet.id,
      preset: bet.preset,
      name: presetOf(bet.preset).name,
    })),
    timezone: settings.timezone,
  };
}
