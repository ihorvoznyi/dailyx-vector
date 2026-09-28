import { Card } from '../card';
import { channels, universalStages } from '../../lib/channels';
import { ChannelFunnel } from './channel-funnel';

function F(
  id: keyof typeof channels,
  values: number[],
  flags?: Record<number, boolean>,
): { label: string; value: number; universal: string; flag: string | null }[] {
  const c = channels[id];
  return c.stages.map((s, i) => ({
    label: s,
    value: values[i]!,
    universal: universalStages[i]!,
    flag: flags?.[i] ? (c.flags?.[i] ?? null) : null,
  }));
}

const CH = {
  upwork: { funnel: [180, 112, 41, 19, 6], baseline: [0.55, 0.33, 0.5, 0.28] },
  email: {
    funnel: [2400, 1050, 72, 14, 2],
    flags: { 1: true },
    baseline: [0.44, 0.085, 0.2, 0.11],
  },
};

/** Sample props from the Vector ChannelFunnel preview. */
export function ChannelFunnelPreview() {
  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <Card eyebrow="Upwork · last 90 days" title="Proposals → Hired">
        <ChannelFunnel stages={F('upwork', CH.upwork.funnel)} baseline={CH.upwork.baseline} />
      </Card>
      <Card
        eyebrow="Cold email · last 90 days"
        title="Emails → Won"
        meta="Same component, the channel’s own words"
      >
        <ChannelFunnel
          stages={F('email', CH.email.funnel, CH.email.flags)}
          baseline={CH.email.baseline}
        />
      </Card>
    </div>
  );
}
