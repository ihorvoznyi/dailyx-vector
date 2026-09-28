import { Num } from '../../atoms/num';
import { SegmentBar } from '../../atoms/segment-bar';
import { Swatch } from '../../atoms/swatch';
import { format, type NumberFormat } from '../../lib/format';
import { seriesColor } from '../../lib/series';

export interface AllocationBarProps {
  items: { label: string; value: number; detail?: string; color?: string }[];
  format?: NumberFormat;
}

/**
 * AllocationBar splits a total — distributed net worth by source — into one bar plus a legend
 * with amounts and shares. Convert everything to one currency before passing values; say which
 * in the Card meta.
 */
export function AllocationBar({ items, format: fmt = {} }: AllocationBarProps) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div>
      <SegmentBar
        role="img"
        aria-label={items
          .map((it) => `${it.label} ${Math.round((it.value / total) * 100)}%`)
          .join(', ')}
        segments={items.map((it, i) => ({
          key: it.label,
          value: it.value,
          color: it.color ?? seriesColor(i),
        }))}
      />
      <ul className="mt-4 flex flex-col">
        {items.map((it, i) => (
          <li
            key={it.label}
            className="grid grid-cols-alloc items-center gap-3 border-t border-line py-10px first:border-t-0"
          >
            <Swatch className="size-10px" color={it.color ?? seriesColor(i)} />
            <span className="min-w-0">
              <div className="font-semibold">{it.label}</div>
              {it.detail ? <div className="text-caption text-ink-faint">{it.detail}</div> : null}
            </span>
            <Num className="text-16px">{format(it.value, fmt)}</Num>
            <Num className="text-right text-12px text-ink-faint">
              {Math.round((it.value / total) * 100)}%
            </Num>
          </li>
        ))}
      </ul>
    </div>
  );
}
