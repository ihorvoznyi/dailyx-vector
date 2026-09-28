import { Eyebrow } from '../../atoms/eyebrow';
import { Num } from '../../atoms/num';
import { Swatch } from '../../atoms/swatch';
import { CERTAINTY, type Payout } from '../../lib/certainty';
import { money } from '../../lib/money';

export interface PayoutBarProps {
  parts: Payout;
  label?: string;
  total?: boolean;
  legend?: boolean;
  compact?: boolean;
}

/**
 * PayoutBar splits money by how sure it is: Received (in the bank), Secured (prepaid, escrow or
 * invoiced), Committed (agreed, not funded), Pipeline (proposed × odds, hatched).
 *
 * Colors step down in lightness from `sure-received` to `sure-committed`; pipeline is a hatched
 * outline so it never reads as money in hand. Every segment has its word in the legend.
 *
 * Never add pipeline into a total that will be read as income.
 */
export function PayoutBar({ parts, label, total = true, legend = true, compact }: PayoutBarProps) {
  const shown = CERTAINTY.filter((c) => parts[c.key]);
  const sum = CERTAINTY.reduce((a, c) => a + (parts[c.key] || 0), 0);
  return (
    <div>
      {total ? (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <Eyebrow>{label ?? 'Compensation'}</Eyebrow>
          <Num className={compact ? 'text-14px' : 'text-16px'}>{money(sum)}</Num>
        </div>
      ) : null}
      <div
        className="flex h-14px gap-3px overflow-hidden rounded-5px"
        role="img"
        aria-label={shown.map((c) => `${c.label} ${money(parts[c.key])}`).join(', ')}
      >
        {shown.map((c, i) => (
          <div
            key={c.key}
            className={`h-full origin-left animate-grow rounded-3px ${c.bg}`}
            style={{ flex: `${parts[c.key]} 1 0`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      {legend ? (
        <div className="mt-10px flex flex-wrap gap-x-4 gap-y-1 text-caption">
          {shown.map((c) => (
            <span key={c.key} className="flex items-center gap-6px">
              <Swatch className={c.bg} />
              <span className="text-ink-muted">{c.label}</span>
              <Num>{money(parts[c.key])}</Num>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
