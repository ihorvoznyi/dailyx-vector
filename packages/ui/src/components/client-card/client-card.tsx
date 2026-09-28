import { Monogram } from '../../atoms/monogram';
import { Num } from '../../atoms/num';
import { Eyebrow } from '../../atoms/eyebrow';
import { surface } from '../../atoms/surface';
import type { Payout } from '../../lib/certainty';
import { cn } from '../../lib/cn';
import { KIND } from '../../lib/kind';
import { money, perHour } from '../../lib/money';
import { Badge } from '../badge';
import { PayoutBar } from '../payout-bar';

/** One income source: a client project, retainer, hourly contract, product or lead. */
export interface IncomeSource {
  id?: string;
  name: string;
  mark?: string;
  kind: 'project' | 'retainer' | 'hourly' | 'product' | 'lead';
  source?: string;
  status?: 'active' | 'paused' | 'lead' | 'past';
  building?: string;
  payout?: Payout;
  mrr?: number;
  earned?: number;
  effectiveRate?: number | null;
  next?: { amount: number; date: string } | null;
}

export interface ClientCardProps {
  client: IncomeSource;
  baselineRate?: number;
  selected?: boolean;
  onClick?: () => void;
  delay?: number;
}

const STATUS = {
  active: ['up', 'Active'],
  paused: ['warn', 'Paused'],
  lead: ['info', 'Lead'],
  past: ['neutral', 'Past'],
} as const;

/**
 * ClientCard is one source of income, whether a client, a retainer, hourly work, my own
 * product, or a lead: what I'm building, how sure the money is, and what an hour of it pays.
 */
export function ClientCard({
  client,
  baselineRate,
  selected,
  onClick,
  delay = 0,
}: ClientCardProps) {
  const rate = client.effectiveRate;
  const [tone, statusLabel] = STATUS[client.status ?? 'active'];
  const recurring = client.kind === 'retainer' || client.kind === 'product';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        surface,
        'flex w-full animate-rise cursor-pointer flex-col gap-14px text-left transition duration-fast ease-out hover:-translate-y-2px hover:border-line-control',
        selected && 'border-focus',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <Monogram>{client.mark ?? client.name.slice(0, 2).toUpperCase()}</Monogram>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink">{client.name}</div>
          <div className="truncate text-caption text-ink-faint">
            {[KIND[client.kind] ?? client.kind, client.source].filter(Boolean).join(' · ')}
          </div>
        </div>
        <Badge tone={tone}>{statusLabel}</Badge>
      </div>
      {client.building ? (
        <div className="flex flex-col gap-2px rounded-md bg-bg-200 px-3 py-10px text-13px leading-18px text-ink">
          <Eyebrow>{client.kind === 'product' ? 'Shipping' : 'Building'}</Eyebrow>
          <span>{client.building}</span>
        </div>
      ) : null}
      {recurring ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Eyebrow>Recurring</Eyebrow>
          <Num className="text-16px text-up">↻ {money(client.mrr)}/mo</Num>
        </div>
      ) : client.payout ? (
        <PayoutBar
          parts={client.payout}
          compact
          legend={false}
          label={client.kind === 'lead' ? 'Potential' : 'Contract'}
        />
      ) : null}
      <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
        <div className="flex min-w-0 flex-col gap-2px">
          <Eyebrow>Earned</Eyebrow>
          <Num className="text-14px">{money(client.earned ?? 0)}</Num>
        </div>
        <div className="flex min-w-0 flex-col gap-2px">
          <Eyebrow>Per hour</Eyebrow>
          <Num
            className="text-14px"
            style={{
              color:
                rate == null
                  ? 'var(--color-ink-faint)'
                  : baselineRate && rate < baselineRate
                    ? 'var(--color-warn)'
                    : 'var(--color-ink)',
            }}
          >
            {perHour(rate)}
          </Num>
        </div>
        <div className="flex min-w-0 flex-col gap-2px">
          <Eyebrow>Next</Eyebrow>
          <Num className="text-14px">{client.next ? money(client.next.amount) : '—'}</Num>
          {client.next ? (
            <span className="text-11px text-ink-faint">{client.next.date}</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
