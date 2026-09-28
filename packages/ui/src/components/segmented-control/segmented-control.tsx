'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface SegmentedControlProps {
  options: (string | { value: string; label: string })[];
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  label?: string;
}

/**
 * A range or mode switch (`3M 6M 1Y`): a tablist whose thumb slides to the selected option.
 * Controlled with `value`, or uncontrolled from `defaultValue`. Arrow keys move the selection.
 */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onChange,
  label,
}: SegmentedControlProps) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const [inner, setInner] = useState(defaultValue ?? opts[0]?.value);
  const current = value ?? inner;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useLayoutEffect(() => {
    const el = current === undefined ? null : refs.current[current];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [current, opts.length]);

  const pick = (v: string) => {
    setInner(v);
    onChange?.(v);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = opts.findIndex((o) => o.value === current);
    const next = opts[(i + step + opts.length) % opts.length];
    if (!next) return;
    pick(next.value);
    refs.current[next.value]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label ?? 'Range'}
      onKeyDown={onKeyDown}
      className="relative inline-flex rounded-md border border-line-control bg-bg-100 p-3px"
    >
      <span
        aria-hidden
        className="absolute top-3px bottom-3px rounded-7px bg-bg-300 inset-ring inset-ring-line-strong transition-all duration-base ease-inout"
        style={{ left: thumb.left, width: thumb.width }}
      />
      {opts.map((o) => {
        const selected = o.value === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[o.value] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => pick(o.value)}
            className="relative z-1 cursor-pointer rounded-7px px-10px py-6px font-mono text-caption font-medium tracking-seg text-ink-muted transition-colors duration-fast ease-out hover:text-ink aria-selected:text-ink"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
