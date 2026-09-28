import type { ComponentType } from 'react';

import { ActionQueuePreview } from './components/action-queue/action-queue.preview';
import { AllocationBarPreview } from './components/allocation-bar/allocation-bar.preview';
import { BadgePreview } from './components/badge/badge.preview';
import { ButtonPreview } from './components/button/button.preview';
import { CalibrationChartPreview } from './components/calibration-chart/calibration-chart.preview';
import { CardPreview } from './components/card/card.preview';
import { ChannelFunnelPreview } from './components/channel-funnel/channel-funnel.preview';
import { ChannelHealthPreview } from './components/channel-health/channel-health.preview';
import { ChannelLensPreview } from './components/channel-lens/channel-lens.preview';
import { ChannelPickerPreview } from './components/channel-picker/channel-picker.preview';
import { ChannelPortfolioPreview } from './components/channel-portfolio/channel-portfolio.preview';
import { ClientCardPreview } from './components/client-card/client-card.preview';
import { DeltaPreview } from './components/delta/delta.preview';
import { EvidenceMeterPreview } from './components/evidence-meter/evidence-meter.preview';
import { ForestPlotPreview } from './components/forest-plot/forest-plot.preview';
import { FreedomMeterPreview } from './components/freedom-meter/freedom-meter.preview';
import { FunnelChartPreview } from './components/funnel-chart/funnel-chart.preview';
import { HoldingsTablePreview } from './components/holdings-table/holdings-table.preview';
import { HypothesisCanvasPreview } from './components/hypothesis-canvas/hypothesis-canvas.preview';
import { HypothesisPanelPreview } from './components/hypothesis-panel/hypothesis-panel.preview';
import { IconPreview } from './components/icon/icon.preview';
import { IncomeForecastPreview } from './components/income-forecast/income-forecast.preview';
import { PayoutBarPreview } from './components/payout-bar/payout-bar.preview';
import { ProgressRingPreview } from './components/progress-ring/progress-ring.preview';
import { ProjectCardPreview } from './components/project-card/project-card.preview';
import { SegmentedControlPreview } from './components/segmented-control/segmented-control.preview';
import { SkillNodePreview } from './components/skill-node/skill-node.preview';
import { SkillPanelPreview } from './components/skill-panel/skill-panel.preview';
import { SkillTreePreview } from './components/skill-tree/skill-tree.preview';
import { SourceStatusPreview } from './components/source-status/source-status.preview';
import { SparklinePreview } from './components/sparkline/sparkline.preview';
import { StatTilePreview } from './components/stat-tile/stat-tile.preview';
import { TrendChartPreview } from './components/trend-chart/trend-chart.preview';

/**
 * Every component's preview, keyed by its kebab-case slug: the Vector preview's sample props,
 * rendered at /dev/ui/<slug> in the web app and screenshot against the Vector golden.
 */
export const previews: Record<string, ComponentType> = {
  'action-queue': ActionQueuePreview,
  'allocation-bar': AllocationBarPreview,
  badge: BadgePreview,
  button: ButtonPreview,
  'calibration-chart': CalibrationChartPreview,
  card: CardPreview,
  'channel-funnel': ChannelFunnelPreview,
  'channel-health': ChannelHealthPreview,
  'channel-lens': ChannelLensPreview,
  'channel-picker': ChannelPickerPreview,
  'channel-portfolio': ChannelPortfolioPreview,
  'client-card': ClientCardPreview,
  delta: DeltaPreview,
  'evidence-meter': EvidenceMeterPreview,
  'forest-plot': ForestPlotPreview,
  'freedom-meter': FreedomMeterPreview,
  'funnel-chart': FunnelChartPreview,
  'holdings-table': HoldingsTablePreview,
  'hypothesis-canvas': HypothesisCanvasPreview,
  'hypothesis-panel': HypothesisPanelPreview,
  icon: IconPreview,
  'income-forecast': IncomeForecastPreview,
  'payout-bar': PayoutBarPreview,
  'progress-ring': ProgressRingPreview,
  'project-card': ProjectCardPreview,
  'segmented-control': SegmentedControlPreview,
  'skill-node': SkillNodePreview,
  'skill-panel': SkillPanelPreview,
  'skill-tree': SkillTreePreview,
  'source-status': SourceStatusPreview,
  sparkline: SparklinePreview,
  'stat-tile': StatTilePreview,
  'trend-chart': TrendChartPreview,
};
