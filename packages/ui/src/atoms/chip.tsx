import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

const chip = cva(
  'inline-flex h-28px items-center gap-6px rounded-sm border border-line-strong bg-bg-200 px-10px font-sans text-caption font-medium text-ink-muted',
  {
    variants: {
      tone: { neutral: '', up: 'text-up', warn: 'text-warn' },
      // bundle.css sizes the chip content-box when it isn't a button (28px + borders).
      interactive: {
        true: 'cursor-pointer hover:border-line-control hover:text-ink',
        false: 'box-content',
      },
    },
  },
);

/**
 * A small labelled pill for a related item (a prerequisite skill, an adopted hypothesis).
 * With `onClick` it's a button; without, a static span.
 */
export function Chip({
  tone = 'neutral',
  onClick,
  children,
  className,
}: {
  tone?: 'neutral' | 'up' | 'warn';
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        className={chip({ tone, interactive: true, className })}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  return <span className={chip({ tone, interactive: false, className })}>{children}</span>;
}
