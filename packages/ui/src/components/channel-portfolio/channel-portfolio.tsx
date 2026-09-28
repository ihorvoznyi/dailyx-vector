'use client';

import { Eyebrow } from '../../atoms/eyebrow';
import { Monogram } from '../../atoms/monogram';
import { Num } from '../../atoms/num';
import { RoiBar } from '../../atoms/roi-bar';
import { SegmentBar } from '../../atoms/segment-bar';
import { Swatch } from '../../atoms/swatch';
import { money, perHour } from '../../lib/money';
import { seriesColor } from '../../lib/series';
import type { Tone } from '../../lib/tone';
import { Badge } from '../badge';
import { Button } from '../button';
import { Icon } from '../icon';

/** One acquisition channel as a bet of hours (Vector index.d.ts `ChannelBet`). */
export interface ChannelBet {
  id: string;
  name: string;
  mark: string;
  hoursPerWeek: number;
  hours90?: number;
  won: number;
  cost?: number;
  costLabel?: string;
  wins: number;
  daysToFirst?: number;
  maxHours?: number;
  ageDays?: number;
  color?: string;
}

export interface ChannelPortfolioProps {
  channels: ChannelBet[];
  baselineRate?: number;
  onSelect?: (id: string) => void;
  onApply?: (plan: { to: ChannelBet; hours: number }[], donor: ChannelBet) => void;
}

interface Row extends ChannelBet {
  hours90: number;
  color: string;
  roi: number | null;
}

function verdict(c: Row, base: number): [Tone, string] {
  if (c.ageDays != null && c.ageDays < 45) return ['neutral', 'Too early'];
  if (c.roi == null) return ['neutral', '—'];
  if (c.roi >= base * 1.5) return ['up', 'Add hours'];
  if (c.roi >= base * 0.8) return ['info', 'Hold'];
  return ['warn', 'Trim'];
}

/**
 * ChannelPortfolio treats hours as capital and channels as positions: where my hours go versus
 * where my money comes from, return per hour per channel, and a suggested rebalance.
 */
export function ChannelPortfolio({
  channels,
  baselineRate = 0,
  onSelect,
  onApply,
}: ChannelPortfolioProps) {
  const base = baselineRate;
  const list: Row[] = channels.map((c, i) => {
    const hours90 = c.hours90 ?? (c.hoursPerWeek || 0) * 13;
    const color = c.color ?? seriesColor(i);
    const roi = hours90 ? ((c.won || 0) - (c.cost || 0)) / hours90 : null;
    return { ...c, hours90, color, roi };
  });
  const totH = list.reduce((a, c) => a + (c.hoursPerWeek || 0), 0) || 1;
  const totW = list.reduce((a, c) => a + (c.won || 0), 0) || 1;

  // rebalance: move hours from the weakest mature channel to the strongest with room
  const mature = list.filter(
    (c) => !(c.ageDays != null && c.ageDays < 45) && c.roi != null && c.hoursPerWeek > 0,
  );
  const donor = mature.slice().sort((a, b) => (a.roi as number) - (b.roi as number))[0];
  const plan: { to: Row; hours: number }[] = [];
  let gain = 0;
  if (donor && (donor.roi as number) < base) {
    let give = Math.min(Math.floor(donor.hoursPerWeek / 2), 4); // D11: floor, not round
    mature
      .filter((c) => c !== donor && (c.roi as number) > (donor.roi as number))
      .sort((a, b) => (b.roi as number) - (a.roi as number))
      .forEach((r) => {
        if (give <= 0) return;
        const room = r.maxHours != null ? Math.max(0, r.maxHours - r.hoursPerWeek) : give;
        const take = Math.min(room, give);
        if (take > 0) {
          plan.push({ to: r, hours: take });
          gain += take * ((r.roi as number) - (donor.roi as number)) * 4.33;
          give -= take;
        }
      });
  }
  const maxRoi = Math.max(...list.map((c) => c.roi || 0), base * 2);
  const RW = (v: number) =>
    Math.max(
      2,
      Math.min(100, (Math.log10(Math.max(1, v)) / Math.log10(Math.max(10, maxRoi))) * 100),
    );

  const split = (key: 'hoursPerWeek' | 'won', tot: number, label: string) => (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        <Num className="text-12px text-ink-faint">
          {key === 'hoursPerWeek' ? `${tot}h / week` : `${money(tot)} · 90 days`}
        </Num>
      </div>
      <SegmentBar
        className="h-14px"
        stagger={70}
        segments={list
          .filter((c) => c[key])
          .map((c) => ({
            key: c.id,
            value: c[key],
            color: c.color,
            title: `${c.name} ${Math.round((c[key] / tot) * 100)}%`,
          }))}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-6 max-760:grid-cols-1 max-760:gap-14px">
        {split('hoursPerWeek', totH, 'Where my hours go')}
        {split('won', totW, 'Where my money comes from')}
      </div>
      <div className="flex flex-wrap gap-x-18px gap-y-6px text-12px text-ink-muted">
        {list.map((c) => (
          <span key={c.id} className="flex flex-wrap items-center gap-6px">
            <Swatch color={c.color} />
            {c.name}
            <Num className="text-ink-faint">
              {Math.round(((c.hoursPerWeek || 0) / totH) * 100)}% →{' '}
              {Math.round(((c.won || 0) / totW) * 100)}%
            </Num>
          </span>
        ))}
      </div>
      <div className="flex flex-col border-t border-line">
        <div className="grid grid-cols-portfolio items-center gap-14px border-b border-line px-2 pt-10px pb-2 font-mono text-eyebrow text-ink-faint uppercase max-760:hidden">
          <span>Channel</span>
          <span className="text-right">Hours/wk</span>
          <span className="text-right">Won · 90d</span>
          <span className="text-right">First $</span>
          <span>Return per hour</span>
          <span />
        </div>
        {list.map((c, i) => {
          const v = verdict(c, base);
          const below = c.roi != null && c.roi < base;
          return (
            <button
              key={c.id}
              type="button"
              className="grid grid-cols-portfolio items-center gap-14px rounded-sm border-b border-line bg-transparent px-2 py-3 text-left cursor-pointer transition-colors duration-fast ease-out hover:bg-bg-200 max-760:grid-cols-main-auto max-760:gap-y-2"
              onClick={onSelect ? () => onSelect(c.id) : undefined}
            >
              <span className="flex min-w-0 items-center gap-10px">
                <Monogram style={{ boxShadow: `inset 3px 0 0 ${c.color}` }}>{c.mark}</Monogram>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{c.name}</span>
                  <span className="block truncate text-caption text-ink-faint">
                    {c.wins} {c.wins === 1 ? 'win · ' : 'wins · '}
                    {c.cost ? `${money(c.cost)} ${c.costLabel || 'cost'}` : 'no cash cost'}
                  </span>
                </span>
              </span>
              <span className="text-right font-mono tabular-nums max-760:hidden">
                {c.hoursPerWeek || 0}h
              </span>
              <span className="text-right font-mono tabular-nums">{money(c.won || 0)}</span>
              <span className="text-right font-mono tabular-nums text-ink-muted max-760:hidden">
                {c.daysToFirst != null ? `${c.daysToFirst}d` : '—'}
              </span>
              <RoiBar
                width={RW(c.roi || 0)}
                base={base ? RW(base) : null}
                barColor={below ? 'var(--color-ink-faint)' : undefined}
                delay={i * 60}
              >
                <Num className="min-w-58px text-right text-13px">
                  {c.roi == null ? '—' : perHour(Math.round(c.roi))}
                </Num>
              </RoiBar>
              <span className="text-right">
                <Badge tone={v[0]}>{v[1]}</Badge>
              </span>
            </button>
          );
        })}
      </div>
      {plan.length && donor ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-up/35 bg-up-soft px-4 py-14px">
          <div className="flex flex-nowrap items-start gap-10px">
            <span className="grid size-30px flex-none place-items-center rounded-8px bg-up text-on-up">
              <Icon name="repeat" size={16} />
            </span>
            <div>
              <div className="font-semibold text-ink">
                Rebalance: move {plan.reduce((a, x) => a + x.hours, 0)}h/week out of {donor.name} →{' '}
                {plan.map((x) => `${x.to.name} (+${x.hours}h)`).join(', ')}
              </div>
              <div className="mt-2px text-13px text-ink-muted">
                ≈ <Num className="text-up">+{money(Math.round(gain / 10) * 10)}/month</Num> if
                returns hold. They usually fall as a channel scales, so re-check in 4 weeks.
              </div>
            </div>
          </div>
          {onApply ? (
            <Button variant="ghost" size="sm" onClick={() => onApply(plan, donor)}>
              Try for 4 weeks
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
