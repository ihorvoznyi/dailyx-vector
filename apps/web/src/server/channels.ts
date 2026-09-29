import { type channelBets, type ChannelPresetId } from '@dailyx/db';
import { channels, type ChannelPreset } from '@dailyx/ui';

export type ChannelBetRow = typeof channelBets.$inferSelect;

/** Preset order of the design system: upwork, email, linkedin, content, referrals, marketplace. */
export const PRESET_ORDER = Object.keys(channels) as ChannelPresetId[];

/** Bets with hoursPerWeek > 0, in PRESET_ORDER. */
export function activeBets(rows: readonly ChannelBetRow[]): ChannelBetRow[] {
  const active = rows.filter((row) => row.hoursPerWeek > 0);
  return PRESET_ORDER.flatMap((preset) => active.filter((row) => row.preset === preset));
}

export function presetOf(preset: ChannelPresetId): ChannelPreset {
  return channels[preset];
}

/** Stage indices the preset flags as unreliable: email → [1]; others → []. */
export function flaggedStages(preset: ChannelPresetId): number[] {
  return Object.keys(channels[preset].flags ?? {}).map(Number);
}

export function isPresetId(value: string): value is ChannelPresetId {
  return value in channels;
}
