import { ProgressRing } from './progress-ring';

/** Sample props from the Vector ProgressRing preview. */
export function ProgressRingPreview() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <ProgressRing value={0.68} size={64} label="Monthly revenue goal" />
      <ProgressRing value={0.34} tone="warn" label="Follower goal" />
      <ProgressRing value={1} label="Skill" center="5/5" />
    </div>
  );
}
