import { cva } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

const panel = cva(
  'z-4 flex w-340px cursor-default flex-col overflow-hidden rounded-lg border border-line-strong bg-bg-100 shadow-pop select-text',
  {
    variants: {
      mode: {
        float: 'absolute top-3 right-3 bottom-3 animate-panel-in',
        static: 'relative',
        sheet: 'absolute right-2 bottom-2 left-2 max-h-18/25 w-auto animate-sheet-in',
      },
    },
  },
);

/** Panel mode from the Vector `className` contract: `is-static`, `is-sheet`, else floating. */
export const panelMode = (className?: string): 'float' | 'static' | 'sheet' =>
  className?.split(' ').includes('is-static')
    ? 'static'
    : className?.split(' ').includes('is-sheet')
      ? 'sheet'
      : 'float';

/** The detail panel shell used by SkillPanel and HypothesisPanel. */
export function Panel({
  mode,
  className,
  ...props
}: { mode: 'float' | 'static' | 'sheet' } & ComponentProps<'aside'>) {
  return <aside className={cn(panel({ mode }), className)} {...props} />;
}

/** Panel header row: icon or code, the title block, and a close button. */
export function PanelHead({ children }: { children: ReactNode }) {
  return <header className="flex items-start gap-3 px-5 pt-5 pb-4">{children}</header>;
}

/** The scrolling body; sections sit space-5 apart. */
export function PanelBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-4">
      {children}
    </div>
  );
}

/** A labelled group inside the body. */
export function PanelSection({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

/** Muted running text in a panel. */
export function PanelDesc({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-ink-muted', className)} {...props} />;
}

/** The footer with the panel's one action, right-aligned. */
export function PanelFoot({ children }: { children: ReactNode }) {
  return <footer className="flex justify-end border-t border-line px-5 py-3">{children}</footer>;
}
