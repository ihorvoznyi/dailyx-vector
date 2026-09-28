import { Delta } from '../delta';
import { format, type NumberFormat } from '../../lib/format';

export interface HoldingsTableProps {
  rows: {
    symbol: string;
    name?: string;
    qty: number;
    price: number;
    value?: number;
    change: number;
  }[];
  format?: NumberFormat;
}

/**
 * HoldingsTable lists brokerage positions: symbol, quantity, price, value, day change. Numbers
 * right-aligned in mono; sort by value descending before passing rows. Read-only — no trade
 * actions.
 */
export function HoldingsTable({
  rows,
  format: fmt = { prefix: '$', decimals: 2 },
}: HoldingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-14px">
        <thead>
          <tr>
            <th className="bg-bg-300 px-3 py-2 text-left font-mono text-eyebrow text-ink-faint uppercase first:rounded-l-sm last:rounded-r-sm">
              Symbol
            </th>
            <th className="bg-bg-300 px-3 py-2 text-right font-mono text-eyebrow text-ink-faint uppercase first:rounded-l-sm last:rounded-r-sm">
              Qty
            </th>
            <th className="bg-bg-300 px-3 py-2 text-right font-mono text-eyebrow text-ink-faint uppercase first:rounded-l-sm last:rounded-r-sm">
              Price
            </th>
            <th className="bg-bg-300 px-3 py-2 text-right font-mono text-eyebrow text-ink-faint uppercase first:rounded-l-sm last:rounded-r-sm">
              Value
            </th>
            <th className="bg-bg-300 px-3 py-2 text-right font-mono text-eyebrow text-ink-faint uppercase first:rounded-l-sm last:rounded-r-sm">
              Day
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.symbol}
              className={
                'transition-colors duration-fast ease-out hover:bg-bg-200' +
                (i === 0 ? '' : ' border-t border-line')
              }
            >
              <td className="px-3 py-10px">
                <div className="font-mono text-body-strong text-ink">{r.symbol}</div>
                {r.name ? <div className="text-caption text-ink-faint">{r.name}</div> : null}
              </td>
              <td className="px-3 py-10px text-right font-mono tabular-nums text-ink-muted">
                {format(r.qty, { decimals: r.qty % 1 ? 2 : 0 })}
              </td>
              <td className="px-3 py-10px text-right font-mono tabular-nums text-ink-muted">
                {format(r.price, fmt)}
              </td>
              <td className="px-3 py-10px text-right font-mono tabular-nums">
                {format(r.value ?? r.qty * r.price, fmt)}
              </td>
              <td className="px-3 py-10px text-right">
                <Delta value={r.change} plain />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
