import type { HypStatus } from '../../lib/hypothesis';
import { Card } from '../card';
import { ForestPlot, type ForestRow } from './forest-plot';

const LEVERS: { id: string; label: string }[] = [
  { id: 'niche', label: 'Niche: fintech only' },
  { id: 'template', label: 'Proposal template B' },
  { id: 'speed', label: 'Reply within 1 hour' },
  { id: 'loom', label: 'Loom in proposal' },
  { id: 'case', label: 'Case study link' },
  { id: 'script', label: 'Discovery call script' },
  { id: 'price', label: 'Price +30%' },
];

const HYPS: {
  code: string;
  lever: string;
  status: HypStatus;
  effect?: { est: number; lo: number; hi: number };
}[] = [
  { code: 'H-03', lever: 'niche', status: 'supported', effect: { est: 12, lo: 4, hi: 20 } },
  { code: 'H-04', lever: 'price', status: 'refuted', effect: { est: -14, lo: -27, hi: -1 } },
  { code: 'H-06', lever: 'speed', status: 'inconclusive', effect: { est: 3, lo: -8, hi: 14 } },
  { code: 'H-07', lever: 'template', status: 'running', effect: { est: 9, lo: -2, hi: 19 } },
  { code: 'H-09', lever: 'loom', status: 'running', effect: { est: 6, lo: -10, hi: 21 } },
  { code: 'H-10', lever: 'case', status: 'running', effect: { est: 2, lo: -12, hi: 15 } },
  { code: 'H-11', lever: 'script', status: 'draft' },
  { code: 'H-12', lever: 'price', status: 'idea' },
];

const FOREST: ForestRow[] = HYPS.filter((x) => x.effect).map((x) => {
  const lever = LEVERS.find((v) => v.id === x.lever);
  return {
    code: x.code,
    label: lever?.label ?? '',
    est: x.effect!.est,
    lo: x.effect!.lo,
    hi: x.effect!.hi,
    status: x.status,
  };
});

/** Sample props from the Vector ForestPlot preview. */
export function ForestPlotPreview() {
  return (
    <div style={{ maxWidth: 760 }}>
      <Card
        eyebrow="All experiments"
        title="What actually moved the needle"
        meta="Effect on the target metric, percentage points, with 90% interval"
      >
        <ForestPlot rows={FOREST} />
      </Card>
    </div>
  );
}
