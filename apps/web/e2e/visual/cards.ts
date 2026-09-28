/**
 * The 33 Vector component cards: PascalCase name, kebab slug (our folder and /dev/ui path) and
 * the card height from the preview's `@dsCard` header, which is the screenshot viewport height.
 */
export const cards = [
  { name: 'ActionQueue', slug: 'action-queue', height: 560 },
  { name: 'AllocationBar', slug: 'allocation-bar', height: 300 },
  { name: 'Badge', slug: 'badge', height: 56 },
  { name: 'Button', slug: 'button', height: 72 },
  { name: 'CalibrationChart', slug: 'calibration-chart', height: 430 },
  { name: 'Card', slug: 'card', height: 170 },
  { name: 'ChannelFunnel', slug: 'channel-funnel', height: 640 },
  { name: 'ChannelHealth', slug: 'channel-health', height: 230 },
  { name: 'ChannelLens', slug: 'channel-lens', height: 90 },
  { name: 'ChannelPicker', slug: 'channel-picker', height: 470 },
  { name: 'ChannelPortfolio', slug: 'channel-portfolio', height: 520 },
  { name: 'ClientCard', slug: 'client-card', height: 300 },
  { name: 'Delta', slug: 'delta', height: 56 },
  { name: 'EvidenceMeter', slug: 'evidence-meter', height: 230 },
  { name: 'ForestPlot', slug: 'forest-plot', height: 330 },
  { name: 'FreedomMeter', slug: 'freedom-meter', height: 330 },
  { name: 'FunnelChart', slug: 'funnel-chart', height: 290 },
  { name: 'HoldingsTable', slug: 'holdings-table', height: 300 },
  { name: 'HypothesisCanvas', slug: 'hypothesis-canvas', height: 760 },
  { name: 'HypothesisPanel', slug: 'hypothesis-panel', height: 760 },
  { name: 'Icon', slug: 'icon', height: 330 },
  { name: 'IncomeForecast', slug: 'income-forecast', height: 360 },
  { name: 'PayoutBar', slug: 'payout-bar', height: 150 },
  { name: 'ProgressRing', slug: 'progress-ring', height: 96 },
  { name: 'ProjectCard', slug: 'project-card', height: 560 },
  { name: 'SegmentedControl', slug: 'segmented-control', height: 64 },
  { name: 'SkillNode', slug: 'skill-node', height: 150 },
  { name: 'SkillPanel', slug: 'skill-panel', height: 620 },
  { name: 'SkillTree', slug: 'skill-tree', height: 760 },
  { name: 'SourceStatus', slug: 'source-status', height: 150 },
  { name: 'Sparkline', slug: 'sparkline', height: 56 },
  { name: 'StatTile', slug: 'stat-tile', height: 170 },
  { name: 'TrendChart', slug: 'trend-chart', height: 330 },
] as const;

export type Slug = (typeof cards)[number]['slug'];

export const WIDTH = 1024;

export function card(slug: Slug) {
  const found = cards.find((c) => c.slug === slug);
  if (!found) throw new Error(`unknown card ${slug}`);
  return found;
}
