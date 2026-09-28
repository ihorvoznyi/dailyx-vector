import type { CSSProperties, ReactNode } from 'react';

import { Eyebrow } from '../../atoms/eyebrow';
import { cn } from '../../lib/cn';

export interface CardProps {
  eyebrow?: string;
  title?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * One card answers one question. `title` says what, `meta` says where the data came from and
 * when, `action` sits top-right. Cards rise 6px and fade in; stagger them with `delay` (ms).
 */
export function Card({
  eyebrow,
  title,
  meta,
  action,
  delay = 0,
  className,
  style,
  children,
}: CardProps) {
  const head = title || eyebrow || action;
  return (
    <section
      className={cn(
        'min-w-0 animate-rise rounded-lg border border-line bg-bg-100 p-5 shadow-card',
        className,
      )}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {head ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow ? <Eyebrow className="mb-1 block">{eyebrow}</Eyebrow> : null}
            {title ? <h3 className="text-title text-ink">{title}</h3> : null}
            {meta ? <p className="mt-2px text-caption text-ink-faint">{meta}</p> : null}
          </div>
          {action ?? null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
