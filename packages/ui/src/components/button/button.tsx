import { cva } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn';

const button = cva(
  'inline-flex h-36px cursor-pointer items-center gap-2 rounded-md border border-transparent px-14px font-sans text-14px leading-20px font-medium transition duration-fast ease-out active:translate-y-1px disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-up text-on-up hover:bg-up-hover',
        ghost: 'border-line-control bg-transparent text-ink hover:bg-bg-200',
        quiet: 'bg-transparent text-ink-muted hover:bg-bg-200 hover:text-ink',
      },
      size: {
        sm: 'h-28px rounded-sm px-10px text-12px',
        md: '',
      },
    },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'quiet';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  loading?: boolean;
}

/**
 * Sentence-case actions ("Connect source", "Sync all"). `primary` is the one green action on a
 * screen, `ghost` the default, `quiet` for low-emphasis links. `loading` swaps the icon for a
 * spinning ↻ and sets aria-busy.
 */
export function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  loading,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(button({ variant, size }), className)}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="inline-block animate-spin" aria-hidden>
          ↻
        </span>
      ) : icon ? (
        <span aria-hidden>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
