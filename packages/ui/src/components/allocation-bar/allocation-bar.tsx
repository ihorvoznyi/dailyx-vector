import type { NumberFormat } from '../../lib/format';

export interface AllocationBarProps {
  items: { label: string; value: number; detail?: string; color?: string }[];
  format?: NumberFormat;
}

/** Stub until stage 3-6 task W2-status builds it. The props above are the contract. */
export function AllocationBar(props: AllocationBarProps) {
  void props;
  return null;
}
