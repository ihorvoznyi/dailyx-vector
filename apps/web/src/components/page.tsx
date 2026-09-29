import { Eyebrow } from '@dailyx/ui';
import type { ReactNode } from 'react';

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-1240px min-w-0 flex-col gap-6 px-5 pt-8 pb-12">
      {children}
    </main>
  );
}

export function PageHeader(p: {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow>{p.eyebrow}</Eyebrow>
        <h1 className="text-display text-ink">{p.title}</h1>
        {p.meta ? <div className="mt-1 text-caption text-ink-muted">{p.meta}</div> : null}
      </div>
      {p.actions ? <div className="flex items-center gap-3">{p.actions}</div> : null}
    </header>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-4 gap-6 max-960:grid-cols-2 max-960:gap-4 max-520:grid-cols-1">
      {children}
    </div>
  );
}

export function SplitGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-wide gap-6 max-960:grid-cols-1 max-960:gap-4">{children}</div>
  );
}
