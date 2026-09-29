'use client';

import {
  Badge,
  Eyebrow,
  Icon,
  IconButton,
  Num,
  Panel,
  PanelBody,
  PanelFoot,
  PanelHead,
  PanelSection,
} from '@dailyx/ui';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { formatTimestamp } from '../../lib/format';
import type { MathSpec } from '../../lib/math';

const MathContext = createContext<((spec: MathSpec) => void) | null>(null);

/** Opens the drawer with this spec. */
export function useShowMath(): (spec: MathSpec) => void {
  const open = useContext(MathContext);
  if (!open) throw new Error('useShowMath must be used inside a MathProvider');
  return open;
}

export function MathProvider({ timezone, children }: { timezone: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [spec, setSpec] = useState<MathSpec | null>(null);

  const open = useCallback((next: MathSpec) => {
    setSpec(next);
    dialogRef.current?.showModal();
  }, []);

  const contextValue = useMemo(() => open, [open]);

  return (
    <MathContext.Provider value={contextValue}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="math-title"
        onClose={() => setSpec(null)}
        className="m-0 ml-auto h-full max-h-none w-full max-w-364px border-0 bg-transparent p-3 text-ink backdrop:bg-bg-000/70"
      >
        {spec ? (
          <Panel mode="static" className="h-full w-full">
            <PanelHead>
              <div className="flex flex-1 flex-col gap-1">
                <Eyebrow>Show the math</Eyebrow>
                <h2 id="math-title" className="text-title">
                  {spec.title}
                </h2>
                <Num className="text-num-lg">{spec.value}</Num>
              </div>
              <form method="dialog">
                <IconButton type="submit" aria-label="Close">
                  <Icon name="close" size={16} />
                </IconButton>
              </form>
            </PanelHead>
            <PanelBody>
              <PanelSection>
                <Eyebrow>Formula</Eyebrow>
                <p className="font-mono text-caption text-ink-muted">{spec.formula}</p>
              </PanelSection>
              <PanelSection>
                <Eyebrow>Window</Eyebrow>
                <p className="text-caption text-ink-muted">{spec.window}</p>
              </PanelSection>
              <PanelSection>
                <Eyebrow>Counts</Eyebrow>
                <dl className="flex flex-col gap-1">
                  {spec.counts.map((row) => (
                    <div key={row.label} className="grid grid-cols-main-auto gap-2">
                      <dt className="text-ink-muted">{row.label}</dt>
                      <dd className="justify-self-end font-mono">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </PanelSection>
              {spec.note ? <Badge tone="warn">{spec.note}</Badge> : null}
              <PanelSection>
                <Eyebrow>Source records ({spec.sourcesTotal})</Eyebrow>
                {spec.sources.length > 0 ? (
                  <ul className="flex flex-col gap-1 text-caption text-ink-muted">
                    {spec.sources.map((source) => (
                      <li key={source.id}>{source.label}</li>
                    ))}
                    {spec.sourcesTotal > spec.sources.length ? (
                      <li>and {spec.sourcesTotal - spec.sources.length} more</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-caption text-ink-faint">No source records</p>
                )}
              </PanelSection>
            </PanelBody>
            <PanelFoot>
              {spec.lastEdit
                ? `Last edited ${formatTimestamp(spec.lastEdit, timezone)}`
                : 'Last edited —'}
            </PanelFoot>
          </Panel>
        ) : null}
      </dialog>
    </MathContext.Provider>
  );
}
