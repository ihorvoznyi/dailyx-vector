'use client';

import { ChannelLens } from '@dailyx/ui';
import { useRouter } from 'next/navigation';

import type { LensTab } from '../../server/acquisition';

export function LensTabs({ items, value }: { items: LensTab[]; value: string }) {
  const router = useRouter();
  return (
    <ChannelLens
      items={items}
      value={value}
      onChange={(id) => router.push(id === 'all' ? '/acquisition' : `/acquisition/${id}`)}
      label="Channel"
    />
  );
}
