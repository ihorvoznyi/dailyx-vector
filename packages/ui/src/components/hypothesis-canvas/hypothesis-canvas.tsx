'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { Badge } from '../badge';
import { HypothesisPanel } from '../hypothesis-panel';
import { Icon } from '../icon';
import { ProgressRing } from '../progress-ring';
import { Sparkline } from '../sparkline';
import { Eyebrow } from '../../atoms/eyebrow';
import { Hud } from '../../atoms/hud';
import { IconButton } from '../../atoms/icon-button';
import { Num } from '../../atoms/num';
import { ZoomControls } from '../../atoms/zoom-controls';
import { cn } from '../../lib/cn';
import { format } from '../../lib/format';
import { dayNum, dayStr, HSTATUS, shortDate, signed, TODAY } from '../../lib/hypothesis';
import type { Hypothesis, HypStatus, LeverDef, MetricDef } from '../../lib/hypothesis';

export interface HypothesisCanvasProps {
  metrics: MetricDef[];
  levers: LeverDef[];
  hypotheses: Hypothesis[];
  onChange?: (h: Hypothesis[]) => void;
  onLeversChange?: (l: LeverDef[]) => void;
  today?: string;
  height?: number;
  defaultSelected?: string;
  metricX?: number;
  newLeverLabel?: string;
  label?: string;
}

const MW = 236;
const MH = 92;
const MGAP = 44;
const LW = 212;
const LH = 52;

type Selection = { type: 'hyp' | 'lever' | 'metric'; id: string } | null;
type DragState =
  | { type: 'pan' }
  | { type: 'lever'; id: string; x: number; y: number }
  | { type: 'link'; id: string; x: number; y: number; over: string | null }
  | null;

const TONE_COLOR: Record<HypStatus, string> = {
  supported: 'stroke-up',
  refuted: 'stroke-down',
  running: 'stroke-info',
  inconclusive: 'stroke-ink-faint',
  draft: 'stroke-line-control',
  idea: 'stroke-line-control',
};
const EDGE_DASH: Partial<Record<HypStatus, string>> = { running: '7 7', draft: '6 4', idea: '1 6' };
const CHIP_TONE: Record<HypStatus, string> = {
  supported: 'border-up text-up',
  refuted: 'border-down text-down',
  running: 'border-info text-ink',
  inconclusive: '',
  draft: 'border-dashed',
  idea: 'border-dashed',
};
const CHIP_CODE_TONE: Partial<Record<HypStatus, string>> = {
  supported: 'bg-up text-on-up',
  refuted: 'bg-down-soft text-down',
  running: 'bg-info-soft text-info',
};
const LEGEND_STATUSES: HypStatus[] = [
  'running',
  'supported',
  'refuted',
  'inconclusive',
  'draft',
  'idea',
];

function local(e: { clientX: number; clientY: number }, el: HTMLElement): [number, number] {
  const r = el.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

/**
 * HypothesisCanvas maps what I believe drives my numbers: the things I do (levers) on the left,
 * live funnel metrics on the right, and each hypothesis as a line between them. Metric values
 * always show today's data; the scrubber changes only the hypotheses.
 */
export function HypothesisCanvas({
  metrics,
  levers: initialLevers,
  hypotheses: initialHyps,
  onChange,
  onLeversChange,
  today,
  height = 640,
  defaultSelected,
  metricX = 640,
  newLeverLabel,
  label,
}: HypothesisCanvasProps) {
  const [levers, setLevers] = useState(initialLevers);
  const [hyps, setHyps] = useState(initialHyps);
  const asOfToday = today ?? TODAY;
  const todayN = dayNum(asOfToday)!;
  const [sel, setSel] = useState<Selection>(
    defaultSelected ? { type: 'hyp', id: defaultSelected } : null,
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: height });
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [gliding, setGliding] = useState(false);
  const glideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [tDay, setTDay] = useState<number | null>(null);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const gesture = useRef<{
    mode?: 'pan' | 'lever' | 'link';
    id?: string;
    start?: [number, number];
    moved?: boolean;
    l0?: [number, number];
  }>({});
  // A per-session counter for new lever and hypothesis suffixes (never `Math.random()`).
  const idSeq = useRef(0);

  const sizeRef = useRef(size);
  const viewRef = useRef(view);
  const levRef = useRef(levers);
  const hypRef = useRef(hyps);
  const selRef = useRef(sel);
  useEffect(() => {
    sizeRef.current = size;
    viewRef.current = view;
    levRef.current = levers;
    hypRef.current = hyps;
    selRef.current = sel;
  });

  const mPos: Record<string, [number, number]> = {};
  metrics.forEach((m, i) => {
    mPos[m.id] = [metricX, 24 + i * (MH + MGAP)];
  });

  function commitLevers(next: LeverDef[]) {
    setLevers(next);
    onLeversChange?.(next);
  }
  function commitHyps(next: Hypothesis[]) {
    setHyps(next);
    onChange?.(next);
  }
  function glide() {
    setGliding(true);
    if (glideTimer.current) clearTimeout(glideTimer.current);
    glideTimer.current = setTimeout(() => setGliding(false), 320);
  }
  function bounds() {
    let x0 = 0;
    let y0 = 0;
    const x1 = metricX + MW;
    let y1 = metrics.length * (MH + MGAP);
    levers.forEach((l) => {
      x0 = Math.min(x0, l.x);
      y0 = Math.min(y0, l.y);
      y1 = Math.max(y1, l.y + LH);
    });
    return { x0: x0 - 16, y0: y0 - 16, x1: x1 + 16, y1: y1 + 16 };
  }

  function fit(sz?: { w: number; h: number }, instant?: boolean) {
    const s = sz ?? sizeRef.current;
    const b = bounds();
    const padL = 20;
    const padR = selRef.current && s.w >= 700 ? 380 : 20;
    const padT = 84;
    const padB = 76;
    const k = Math.max(
      0.35,
      Math.min((s.w - padL - padR) / (b.x1 - b.x0), (s.h - padT - padB) / (b.y1 - b.y0), 1.05),
    );
    if (!instant) glide();
    setView({
      k,
      x: padL + (s.w - padL - padR - (b.x1 - b.x0) * k) / 2 - b.x0 * k,
      y: padT + (s.h - padT - padB - (b.y1 - b.y0) * k) / 2 - b.y0 * k,
    });
  }

  function zoomAt(f: number, cx0: number, cy0: number, smooth?: boolean) {
    if (smooth) glide();
    const v = viewRef.current;
    const k = Math.max(0.35, Math.min(2.2, v.k * f));
    const r = k / v.k;
    setView({ k, x: cx0 - (cx0 - v.x) * r, y: cy0 - (cy0 - v.y) * r });
  }

  // Effects can't call `fit`/`zoomAt` directly (they close over this render's state and would
  // need to be re-subscribed every render); a ref holds the latest version for the mount-once
  // ResizeObserver and wheel listener below, refreshed by the ref-sync effect above.
  const fitRef = useRef(fit);
  const zoomAtRef = useRef(zoomAt);
  useEffect(() => {
    fitRef.current = fit;
    zoomAtRef.current = zoomAt;
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let first = true;
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            const r = entries[0]!.contentRect;
            const sz = { w: r.width, h: r.height };
            setSize(sz);
            if (first) {
              first = false;
              fitRef.current(sz, true);
            }
          })
        : null;
    if (ro) ro.observe(el);
    else fitRef.current({ w: el.clientWidth, h: el.clientHeight }, true);

    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest?.('aside')) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        zoomAtRef.current(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      } else {
        setView({ k: v.k, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSel(null);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('keydown', onKey);
    return () => {
      ro?.disconnect();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('keydown', onKey);
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, []);

  function toWorld(pt: [number, number]): [number, number] {
    const v = viewRef.current;
    return [(pt[0] - v.x) / v.k, (pt[1] - v.y) / v.k];
  }
  function metricAt(w: [number, number]): string | null {
    for (const m of metrics) {
      const q = mPos[m.id]!;
      if (w[0] >= q[0] - 24 && w[0] <= q[0] + MW && w[1] >= q[1] && w[1] <= q[1] + MH) return m.id;
    }
    return null;
  }

  function move(e: PointerEvent) {
    const st = gesture.current;
    if (!st.mode || !wrapRef.current) return;
    const pt = local(e, wrapRef.current);
    const dx = pt[0] - st.start![0];
    const dy = pt[1] - st.start![1];
    if (!st.moved && Math.hypot(dx, dy) < 5) return;
    st.moved = true;
    if (st.mode === 'pan') {
      setDrag({ type: 'pan' });
      const v0 = viewRef.current;
      setView({ k: v0.k, x: v0.x + dx, y: v0.y + dy });
    }
    if (st.mode === 'lever' && st.id) {
      const k = viewRef.current.k;
      setDrag({ type: 'lever', id: st.id, x: st.l0![0] + dx / k, y: st.l0![1] + dy / k });
    }
    if (st.mode === 'link' && st.id) {
      const w = toWorld(pt);
      setDrag({ type: 'link', id: st.id, x: w[0], y: w[1], over: metricAt(w) });
    }
  }

  function end(e: PointerEvent) {
    const st = gesture.current;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    if (!wrapRef.current) return;
    const pt = local(e, wrapRef.current);
    const k = viewRef.current.k;
    if (st.mode === 'lever' && st.id && st.moved) {
      const id = st.id;
      const l0 = st.l0!;
      const start = st.start!;
      commitLevers(
        levRef.current.map((l) =>
          l.id === id
            ? {
                ...l,
                x: Math.round(l0[0] + (pt[0] - start[0]) / k),
                y: Math.round(l0[1] + (pt[1] - start[1]) / k),
              }
            : l,
        ),
      );
    } else if (st.mode === 'lever' && st.id) {
      setSel({ type: 'lever', id: st.id });
    } else if (st.mode === 'link' && st.id) {
      const target = metricAt(toWorld(pt));
      if (target) {
        const hs = hypRef.current;
        const num =
          hs.reduce((a, x) => {
            const n = parseInt(String(x.code || '').replace(/\D/g, ''), 10);
            return Number.isNaN(n) ? a : Math.max(a, n);
          }, 0) + 1;
        const lever = levRef.current.find((l) => l.id === st.id);
        const nh: Hypothesis = {
          id: `h${num}-${(idSeq.current += 1)}`,
          code: `H-${num < 10 ? '0' : ''}${num}`,
          lever: st.id,
          metric: target,
          status: 'draft',
          createdAt: asOfToday,
          confidence: 0.6,
          method: 'alternate',
          direction: 'up',
          change: lever?.label,
        };
        commitHyps(hs.concat([nh]));
        setSel({ type: 'hyp', id: nh.id });
      }
    } else if (st.mode === 'pan' && !st.moved) {
      setSel(null);
    }
    setDrag(null);
    st.mode = undefined;
  }

  function begin(e: ReactPointerEvent, mode: 'pan' | 'lever' | 'link', id?: string) {
    if (e.button !== 0 || !wrapRef.current) return;
    e.stopPropagation();
    const st = gesture.current;
    st.mode = mode;
    st.id = id;
    st.start = local(e, wrapRef.current);
    st.moved = false;
    if (mode === 'lever' && id) {
      const l = levRef.current.find((x) => x.id === id);
      if (l) st.l0 = [l.x, l.y];
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function play() {
    if (playTimer.current) clearInterval(playTimer.current);
    const starts = hyps
      .map((x) => dayNum(x.createdAt ?? x.startedAt))
      .filter((x): x is number => x != null);
    const min = starts.length ? Math.min(...starts) : todayN - 90;
    let t = min;
    setTDay(t);
    playTimer.current = setInterval(() => {
      t += Math.max(1, Math.round((todayN - min) / 90));
      if (t >= todayN) {
        if (playTimer.current) clearInterval(playTimer.current);
        setTDay(null);
      } else {
        setTDay(t);
      }
    }, 50);
  }

  function addLever() {
    const v = viewRef.current;
    const sz = sizeRef.current;
    const id = `l${(idSeq.current += 1)}`;
    commitLevers(
      levers.concat([
        {
          id,
          label: newLeverLabel ?? 'New lever',
          icon: 'bulb',
          x: Math.round((sz.w * 0.3 - v.x) / v.k),
          y: Math.round((sz.h * 0.5 - v.y) / v.k),
        },
      ]),
    );
  }

  function asOf(x: Hypothesis): Hypothesis | null {
    if (tDay == null) return x;
    const c = dayNum(x.createdAt ?? x.startedAt);
    const s = dayNum(x.startedAt);
    const e = dayNum(x.endedAt);
    if (c != null && tDay < c) return null;
    if (s == null || tDay < s) return { ...x, status: x.status === 'idea' ? 'idea' : 'draft' };
    if (e == null || tDay < e) {
      const fr = Math.max(
        0,
        Math.min(1, e ? (tDay - s) / Math.max(1, e - s) : (tDay - s) / Math.max(1, todayN - s)),
      );
      return {
        ...x,
        status: 'running',
        n: Math.round((e ? (x.nTarget ?? 0) : (x.n ?? 0)) * fr),
        pBetter: x.pBetter == null ? null : 0.5 + (x.pBetter - 0.5) * fr,
      };
    }
    return x;
  }

  const starts = hyps
    .map((x) => dayNum(x.createdAt ?? x.startedAt))
    .filter((x): x is number => x != null);
  const tMin = starts.length ? Math.min(...starts) : todayN - 90;
  const tNow = tDay ?? todayN;

  const shown = hyps.map(asOf).filter((x): x is Hypothesis => x != null);
  const runningBy: Record<string, number> = {};
  shown.forEach((x) => {
    if (x.status === 'running') runningBy[x.metric] = (runningBy[x.metric] ?? 0) + 1;
  });
  const withConv = metrics.filter((m) => m.conversion != null);
  const bottleneck = withConv.length
    ? withConv.reduce((a, m) => (m.conversion! < a.conversion! ? m : a)).id
    : null;
  const levById: Record<string, LeverDef> = {};
  levers.forEach((l) => {
    levById[l.id] = drag?.type === 'lever' && drag.id === l.id ? { ...l, x: drag.x, y: drag.y } : l;
  });
  const byMetric: Record<string, Hypothesis[]> = {};
  shown.forEach((x) => {
    (byMetric[x.metric] ??= []).push(x);
  });
  Object.keys(byMetric).forEach((k) => {
    byMetric[k]!.sort((a, b) => (levById[a.lever]?.y ?? 0) - (levById[b.lever]?.y ?? 0));
  });
  const selHyp = sel?.type === 'hyp' ? hyps.find((x) => x.id === sel.id) : undefined;
  const related = (x: Hypothesis): boolean => {
    if (!sel) return true;
    if (sel.type === 'hyp') return x.id === sel.id;
    if (sel.type === 'lever') return x.lever === sel.id;
    return x.metric === sel.id;
  };

  const edges: ReactNode[] = [];
  const chips: ReactNode[] = [];
  shown.forEach((x) => {
    const l = levById[x.lever];
    const mp = mPos[x.metric];
    if (!l || !mp) return;
    const list = byMetric[x.metric]!;
    const idx = list.indexOf(x);
    const off = (idx - (list.length - 1) / 2) * 14;
    const a: [number, number] = [l.x + LW, l.y + LH / 2];
    const b: [number, number] = [mp[0], mp[1] + MH / 2 + off];
    const dx = Math.max(60, (b[0] - a[0]) * 0.45);
    const c1: [number, number] = [a[0] + dx, a[1]];
    const c2: [number, number] = [b[0] - dx, b[1]];
    const mid: [number, number] = [
      0.125 * a[0] + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * b[0],
      0.125 * a[1] + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * b[1],
    ];
    const conflict = x.status === 'running' && (runningBy[x.metric] ?? 0) > 1;
    const strength = x.pBetter == null ? 0 : Math.abs(x.pBetter - 0.5) * 2;
    const dim = !related(x);
    const selected = selHyp?.id === x.id;
    const strokeWidth =
      x.status === 'supported' || x.status === 'refuted'
        ? 2 + strength * 3
        : x.status === 'idea'
          ? 2.5
          : 2;

    edges.push(
      <path
        key={x.id}
        className={cn(
          'fill-none transition-opacity duration-base ease-out',
          conflict ? 'stroke-warn' : TONE_COLOR[x.status],
          x.status === 'running' && 'animate-flow',
          dim && 'opacity-28',
          selected && 'drop-shadow-focus',
        )}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={EDGE_DASH[x.status]}
        d={`M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`}
      />,
    );
    edges.push(
      <path
        key={`${x.id}a`}
        className={cn(
          'fill-none',
          conflict ? 'stroke-warn' : TONE_COLOR[x.status],
          dim && 'opacity-28',
        )}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={`M${b[0] - 9} ${b[1] - 5} L${b[0]} ${b[1]} L${b[0] - 9} ${b[1] + 5}`}
      />,
    );

    const status = HSTATUS[x.status];
    let info: ReactNode;
    if (x.status === 'running') {
      info = (
        <>
          <ProgressRing
            value={Math.min(1, (x.n ?? 0) / (x.nTarget || 1))}
            size={18}
            stroke={3}
            tone={conflict ? 'warn' : 'info'}
            showValue={false}
            label="sample"
          />
          <Num>
            {x.n ?? 0}/{x.nTarget ?? '?'}
          </Num>
          {x.pBetter != null ? (
            <Num className="text-ink-faint">{Math.round(x.pBetter * 100)}%</Num>
          ) : null}
        </>
      );
    } else if (x.status === 'supported' || x.status === 'refuted' || x.status === 'inconclusive') {
      info = (
        <Num>
          {status.glyph} {x.effect ? signed(x.effect.est, x.effect.unit) : status.label}
        </Num>
      );
    } else {
      info = <span>{status.label}</span>;
    }

    chips.push(
      <button
        key={x.id}
        type="button"
        className={cn(
          'absolute inline-flex h-26px -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-6px rounded-pill border border-line-strong bg-bg-100 pr-9px pl-1 font-sans text-11px leading-none font-medium whitespace-nowrap text-ink-muted shadow-chip transition duration-base ease-out hover:scale-106',
          CHIP_TONE[x.status],
          conflict && 'border-warn',
          selected && 'outline-2 outline-offset-2 outline-focus',
          dim && 'opacity-28',
        )}
        style={{ left: mid[0], top: mid[1] }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setSel({ type: 'hyp', id: x.id })}
        aria-label={`${x.code || ''} ${status.label}`}
      >
        <span
          className={cn(
            'inline-grid h-18px place-items-center rounded-pill bg-bg-300 px-6px font-mono text-10px leading-none font-semibold text-ink',
            CHIP_CODE_TONE[x.status],
            conflict && 'bg-warn-soft text-warn',
          )}
        >
          {x.code}
        </span>
        {info}
      </button>,
    );
  });

  let linkLine: ReactNode = null;
  if (drag?.type === 'link') {
    const ll = levById[drag.id];
    if (ll) {
      const a0: [number, number] = [ll.x + LW, ll.y + LH / 2];
      linkLine = (
        <path
          className="fill-none stroke-up"
          strokeWidth={2}
          strokeDasharray="5 5"
          d={`M${a0[0]} ${a0[1]} C${a0[0] + 80} ${a0[1]} ${drag.x - 80} ${drag.y} ${drag.x} ${drag.y}`}
        />
      );
    }
  }
  const connectors = metrics.slice(1).map((m, i) => {
    const a = mPos[metrics[i]!.id]!;
    const b = mPos[m.id]!;
    const x = a[0] + MW / 2;
    return (
      <path
        key={`c${m.id}`}
        className="fill-none stroke-line-control"
        strokeWidth={1.5}
        d={`M${x} ${a[1] + MH + 6} L${x} ${b[1] - 8} M${x - 5} ${b[1] - 13} L${x} ${b[1] - 8} L${x + 5} ${b[1] - 13}`}
      />
    );
  });

  const b = bounds();
  const narrow = size.w < 700;
  const counts: Partial<Record<HypStatus, number>> = {};
  shown.forEach((x) => {
    counts[x.status] = (counts[x.status] ?? 0) + 1;
  });

  return (
    <div
      ref={wrapRef}
      role="application"
      aria-label={label ?? 'Hypothesis map'}
      tabIndex={-1}
      className={cn(
        'relative box-content touch-none cursor-grab overflow-hidden rounded-lg border border-line bg-bg-000 bg-dot-grid outline-none select-none',
        drag?.type === 'pan' && 'cursor-grabbing',
      )}
      style={{
        height,
        backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
      onPointerDown={(e) => {
        if (e.target === wrapRef.current || e.target === worldRef.current) begin(e, 'pan');
      }}
    >
      <div
        ref={worldRef}
        className={cn(
          'absolute top-0 left-0 origin-top-left',
          gliding && 'transition-transform duration-glide ease-inout',
        )}
        style={{
          transform: `translate(${view.x}px,${view.y}px) scale(${view.k})`,
          width: b.x1,
          height: b.y1,
        }}
      >
        <div
          className="absolute font-mono text-11px leading-16px font-medium tracking-widest whitespace-nowrap text-ink-faint uppercase"
          style={{ left: 0, top: -34 }}
        >
          Levers · what I do
        </div>
        <div
          className="absolute font-mono text-11px leading-16px font-medium tracking-widest whitespace-nowrap text-ink-faint uppercase"
          style={{ left: metricX, top: -34 }}
        >
          Metrics · live from sources
        </div>
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          width={b.x1 + 40}
          height={b.y1 + 40}
          aria-hidden
        >
          {connectors}
          {edges}
          {linkLine}
        </svg>
        {chips}
        {levers.map((l0) => {
          const l = levById[l0.id]!;
          const mine = shown.filter((x) => x.lever === l.id);
          const isSel = sel?.type === 'lever' && sel.id === l.id;
          const dragging = drag?.type === 'lever' && drag.id === l.id;
          const dim = sel ? (sel.type !== 'lever' ? !mine.some(related) : !isSel) : false;
          return (
            <div
              key={l.id}
              className={cn(
                'absolute transition-opacity duration-base ease-out',
                dim && 'opacity-28',
                dragging && 'z-5',
              )}
              style={{ left: l.x, top: l.y, width: LW, height: LH }}
            >
              <button
                type="button"
                className={cn(
                  'absolute inset-0 flex cursor-grab items-center gap-10px rounded-md border border-line-strong bg-bg-100 pr-14px pl-2 text-left font-sans text-13px leading-16px font-semibold text-ink transition duration-fast ease-out hover:border-line-control',
                  isSel && 'border-focus',
                  dragging && 'scale-103 cursor-grabbing shadow-lift',
                )}
                onPointerDown={(e) => begin(e, 'lever', l.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSel({ type: 'lever', id: l.id });
                }}
              >
                <span className="grid size-8 flex-none place-items-center rounded-8px bg-bg-300 text-ink-muted">
                  <Icon name={l.icon ?? 'target'} size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate">{l.label}</span>
                {mine.length ? <Num className="text-11px text-ink-faint">{mine.length}</Num> : null}
              </button>
              <button
                type="button"
                className={cn(
                  'absolute top-1/2 -right-2 -mt-2 size-4 cursor-crosshair rounded-pill border-2 border-line-control bg-bg-000 p-0 transition duration-fast ease-out hover:scale-125 hover:border-up hover:bg-up-soft',
                  drag?.type === 'link' && drag.id === l.id && 'scale-125 border-up bg-up-soft',
                )}
                title="Drag to a metric to create a hypothesis"
                aria-label={`Create hypothesis from ${l.label}`}
                onPointerDown={(e) => begin(e, 'link', l.id)}
              />
            </div>
          );
        })}
        {metrics.map((m) => {
          const q = mPos[m.id]!;
          const isSel = sel?.type === 'metric' && sel.id === m.id;
          const isOver = drag?.type === 'link' && drag.over === m.id;
          const dim = sel
            ? sel.type !== 'metric'
              ? !(byMetric[m.id] ?? []).some(related)
              : !isSel
            : false;
          return (
            <button
              key={m.id}
              type="button"
              className={cn(
                'absolute flex cursor-pointer flex-col justify-between gap-6px rounded-md border border-line-strong bg-bg-100 px-14px py-3 text-left transition duration-fast ease-out hover:border-line-control',
                bottleneck === m.id && 'border-warn',
                isSel && 'border-focus',
                isOver && 'border-up ring-4 ring-up/18',
                dim && 'opacity-28',
              )}
              style={{ left: q[0], top: q[1], width: MW, height: MH }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setSel(isSel ? null : { type: 'metric', id: m.id })}
            >
              <div className="flex flex-nowrap items-center justify-between gap-2">
                <Eyebrow>{m.label}</Eyebrow>
                {(runningBy[m.id] ?? 0) > 1 ? (
                  <Badge tone="warn">{runningBy[m.id]} running</Badge>
                ) : bottleneck === m.id ? (
                  <Badge tone="warn">Bottleneck</Badge>
                ) : null}
              </div>
              <div className="flex flex-nowrap items-end justify-between gap-2">
                <div>
                  <Num className="text-22px leading-26px text-ink">{format(m.value, m.format)}</Num>
                  <div className="text-11px leading-14px text-ink-faint">
                    {m.note || m.source || ''}
                  </div>
                </div>
                {m.spark ? <Sparkline data={m.spark} width={72} height={26} /> : null}
              </div>
            </button>
          );
        })}
      </div>
      {!narrow ? (
        <Hud corner="tl" className="p-0">
          <div
            className="flex flex-row flex-wrap items-center gap-x-14px gap-y-1 px-3 py-2 text-caption text-ink-muted"
            style={{ maxWidth: Math.max(0, size.w - (selHyp ? 640 : 300)) }}
          >
            {LEGEND_STATUSES.map((k) => (
              <span key={k} className="flex flex-nowrap items-center gap-6px">
                <svg width={18} height={8} aria-hidden>
                  <path
                    className={cn('fill-none', TONE_COLOR[k])}
                    strokeWidth={k === 'supported' || k === 'refuted' ? 3 : k === 'idea' ? 2.5 : 2}
                    strokeDasharray={EDGE_DASH[k]}
                    d="M1 4 L17 4"
                  />
                </svg>
                {HSTATUS[k].label}
                <Num className="text-ink-faint">{counts[k] ?? 0}</Num>
              </span>
            ))}
          </div>
        </Hud>
      ) : null}
      <Hud corner="tr" className={cn('flex-nowrap', selHyp && !narrow && 'right-364px')}>
        <ZoomControls
          zoom={view.k}
          onZoomOut={() => zoomAt(1 / 1.2, size.w / 2, size.h / 2, true)}
          onZoomIn={() => zoomAt(1.2, size.w / 2, size.h / 2, true)}
          onFit={() => fit()}
        >
          <span className="mx-1 h-5 w-px bg-line-strong" aria-hidden />
          <IconButton
            aria-label="Add lever"
            className="inline-flex w-auto gap-1 px-2 text-12px"
            onClick={addLever}
          >
            <Icon name="plus" size={14} />
            Lever
          </IconButton>
        </ZoomControls>
      </Hud>
      <Hud
        className={cn(
          'bottom-3 left-3 right-3 flex items-center gap-10px py-1 pr-3 pl-1',
          selHyp && !narrow && 'right-364px',
          selHyp && narrow && 'hidden',
        )}
      >
        <IconButton aria-label="Replay history" onClick={play}>
          <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
            <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
          </svg>
        </IconButton>
        <input
          type="range"
          className="m-0 h-5 w-full cursor-pointer accent-up"
          min={tMin}
          max={todayN}
          value={tNow}
          aria-label="Show the map as of date"
          onChange={(e) => {
            if (playTimer.current) clearInterval(playTimer.current);
            const v = Number(e.target.value);
            setTDay(v >= todayN ? null : v);
          }}
        />
        <Num
          className={cn(
            'min-w-64px text-right text-12px',
            tDay == null ? 'text-ink-muted' : 'text-info',
          )}
        >
          {tDay == null ? 'Today' : shortDate(dayStr(tNow))}
        </Num>
      </Hud>
      {!selHyp && !narrow ? (
        <Hud corner="bl" className="bottom-64px">
          Drag from a lever’s ● to a metric to create a hypothesis · click a label to open it
        </Hud>
      ) : null}
      {selHyp ? (
        <HypothesisPanel
          key={selHyp.id}
          className={narrow ? 'is-sheet' : undefined}
          hypothesis={asOf(selHyp) ?? selHyp}
          lever={levById[selHyp.lever]}
          metrics={metrics}
          today={asOfToday}
          conflict={(runningBy[selHyp.metric] ?? 0) > 1}
          onClose={() => setSel(null)}
          onChange={(nh) => commitHyps(hypRef.current.map((x) => (x.id === nh.id ? nh : x)))}
        />
      ) : null}
    </div>
  );
}
