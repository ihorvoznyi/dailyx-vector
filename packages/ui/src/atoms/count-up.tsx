'use client';

import { format, type NumberFormat } from '../lib/format';
import { useCountUp } from '../lib/use-count-up';

/** A formatted number that counts up on arrival. */
export function CountUp({ value, format: f }: { value: number; format?: NumberFormat }) {
  return format(useCountUp(value), f);
}
