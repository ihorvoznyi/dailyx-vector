'use client';

import { cn } from '@dailyx/ui';
import type { ReactNode } from 'react';

import type { MathSpec } from '../../lib/math';
import { useShowMath } from './math-provider';

export function ShowMath({
  math,
  children,
  cover,
  className,
}: {
  math: MathSpec;
  children: ReactNode;
  cover?: boolean;
  className?: string;
}) {
  const open = useShowMath();
  const label = `Show the math: ${math.title} ${math.value}`;

  if (cover) {
    return (
      <div className={cn('relative min-w-0', className)}>
        {children}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={label}
          onClick={() => open(math)}
          className="absolute inset-0 cursor-pointer rounded-lg"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      onClick={() => open(math)}
      className={cn('cursor-pointer underline decoration-dotted underline-offset-4', className)}
    >
      {children}
    </button>
  );
}
