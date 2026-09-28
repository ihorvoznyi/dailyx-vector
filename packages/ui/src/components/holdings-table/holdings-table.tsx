import type { NumberFormat } from '../../lib/format';

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

/** Stub until stage 3-6 task W2-status builds it. The props above are the contract. */
export function HoldingsTable(props: HoldingsTableProps) {
  void props;
  return null;
}
