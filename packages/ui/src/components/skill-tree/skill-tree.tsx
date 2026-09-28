'use client';

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { Eyebrow } from '../../atoms/eyebrow';
import { Hud } from '../../atoms/hud';
import { Meter } from '../../atoms/meter';
import { Num } from '../../atoms/num';
import { ZoomControls } from '../../atoms/zoom-controls';
import { cn } from '../../lib/cn';
import {
  HEX_D,
  HEX_H,
  HEX_W,
  PITCH_Y,
  cellXY,
  nearestCell,
  nodeState,
  skillProgress,
  tierOf,
} from '../../lib/skill';
import type { SkillDef } from '../../lib/skill';
import { Icon } from '../icon';
import { SkillNode } from '../skill-node';
import { SkillPanel } from '../skill-panel';

export interface SkillTreeProps {
  nodes?: SkillDef[];
  defaultNodes?: SkillDef[];
  onChange?: (nodes: SkillDef[]) => void;
  selected?: string | null;
  defaultSelected?: string;
  onSelect?: (n: SkillDef | null) => void;
  height?: number;
  editable?: boolean;
  start?: boolean;
  label?: string;
}

type View = { x: number; y: number; k: number };
type Drag = { id: string; x: number; y: number; col: number; row: number };
type Pointerish = { clientX: number; clientY: number };
type PointerLike = Pointerish & { pointerId: number; button: number };
type Gesture = {
  pointers: Record<number, [number, number]>;
  mode: 'pan' | 'node' | 'click' | 'pinch' | null;
  start?: [number, number];
  moved?: boolean;
  view0?: View;
  node?: string;
  pinch?: { d: number; k: number };
};

function indexNodes(nodes: SkillDef[]): Record<string, SkillDef> {
  const m: Record<string, SkillDef> = {};
  for (const n of nodes) m[n.id] = n;
  return m;
}

/**
 * SkillTree is the skill map as a pannable, zoomable canvas of hexagon tiles: basics at the
 * bottom, advanced at the top, one point per mastered tile. Drag the background to pan; scroll
 * pans, ⌘/Ctrl + scroll or a pinch zooms around the pointer. Drag a tile to move it, snapping to
 * the nearest cell and swapping with whatever's there. Click a tile to open its panel; Esc or a
 * background click closes it.
 */
export function SkillTree({
  nodes: nodesProp,
  defaultNodes,
  onChange,
  selected: selectedProp,
  defaultSelected,
  onSelect,
  height,
  editable,
  start,
  label,
}: SkillTreeProps) {
  const [innerNodes, setInnerNodes] = useState(defaultNodes ?? nodesProp ?? []);
  const nodes = nodesProp && onChange ? nodesProp : innerNodes;
  const commit = (next: SkillDef[]) => {
    setInnerNodes(next);
    onChange?.(next);
  };
  const byId = indexNodes(nodes);

  const [innerSelected, setInnerSelected] = useState<string | null>(defaultSelected ?? null);
  const selected = selectedProp !== undefined ? selectedProp : innerSelected;

  const [gliding, setGliding] = useState(false);
  const glideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [size, setSize] = useState({ w: 900, h: height ?? 640 });
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [panning, setPanning] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const g = useRef<Gesture>({ pointers: {}, mode: null });

  let rows = 0;
  let minC = Infinity;
  let maxC = -Infinity;
  let minR = Infinity;
  for (const n of nodes) {
    rows = Math.max(rows, n.row + 1);
    minC = Math.min(minC, n.col);
    maxC = Math.max(maxC, n.col);
    minR = Math.min(minR, n.row);
  }

  function bounds() {
    const a = cellXY(minC, minR);
    const b = cellXY(maxC, rows - 1);
    return {
      x0: a[0] - 24,
      y0: Math.min(a[1], cellXY(minC + 1, minR)[1]) - 24,
      x1: b[0] + HEX_W + 24,
      y1: Math.max(b[1], cellXY(maxC - 1, rows - 1)[1]) + PITCH_Y + HEX_H + 72,
    };
  }

  function glide() {
    setGliding(true);
    if (glideTimer.current) clearTimeout(glideTimer.current);
    glideTimer.current = setTimeout(() => setGliding(false), 320);
  }

  function fit(sz?: { w: number; h: number }, instant?: boolean) {
    const s = sz ?? size;
    const b = bounds();
    const padL = 56;
    const k = Math.max(
      0.35,
      Math.min((s.w - padL - 24) / (b.x1 - b.x0), (s.h - 32) / (b.y1 - b.y0), 1.1),
    );
    if (!instant) glide();
    setView({
      k,
      x: padL + (s.w - padL - 24 - (b.x1 - b.x0) * k) / 2 - b.x0 * k,
      y: 16 + (s.h - 32 - (b.y1 - b.y0) * k) / 2 - b.y0 * k,
    });
  }

  function zoomAt(f: number, cx0: number, cy0: number, smooth?: boolean) {
    if (smooth) glide();
    const k = Math.max(0.35, Math.min(2.2, view.k * f));
    const r = k / view.k;
    setView({ k, x: cx0 - (cx0 - view.x) * r, y: cy0 - (cy0 - view.y) * r });
  }

  function select(id: string | null) {
    setInnerSelected(id);
    const m = id ? (byId[id] ?? null) : null;
    onSelect?.(m);
    if (m && size.w >= 640) {
      const c = cellXY(m.col, m.row);
      const right = view.x + (c[0] + HEX_W) * view.k;
      const limit = size.w - 364 - 24;
      if (right > limit) {
        glide();
        setView({ k: view.k, x: view.x - (right - limit), y: view.y });
      }
    }
  }

  function local(e: Pointerish): [number, number] {
    const r = wrapRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function onDown(e: PointerLike, nodeId: string | null) {
    if (e.button !== 0) return;
    const st = g.current;
    const pt = local(e);
    st.pointers[e.pointerId] = pt;
    const ids = Object.keys(st.pointers);
    if (ids.length === 2) {
      const a = st.pointers[Number(ids[0])]!;
      const b = st.pointers[Number(ids[1])]!;
      st.mode = 'pinch';
      st.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: view.k };
      setDrag(null);
      return;
    }
    st.start = pt;
    st.moved = false;
    st.view0 = view;
    if (nodeId && editable !== false) {
      st.mode = 'node';
      st.node = nodeId;
    } else if (nodeId) {
      st.mode = 'click';
      st.node = nodeId;
    } else {
      st.mode = 'pan';
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function onMove(e: PointerEvent) {
    const st = g.current;
    if (!st.mode) return;
    const pt = local(e);
    st.pointers[e.pointerId] = pt;
    if (st.mode === 'pinch') {
      const ids = Object.keys(st.pointers);
      if (ids.length < 2) return;
      const a = st.pointers[Number(ids[0])]!;
      const b = st.pointers[Number(ids[1])]!;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomAt((st.pinch!.k * d) / st.pinch!.d / view.k, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      return;
    }
    const dx = pt[0] - st.start![0];
    const dy = pt[1] - st.start![1];
    if (!st.moved && Math.hypot(dx, dy) < 5) return;
    st.moved = true;
    if (st.mode === 'pan') {
      setPanning(true);
      setView({ k: st.view0!.k, x: st.view0!.x + dx, y: st.view0!.y + dy });
    }
    if (st.mode === 'node') {
      const n = byId[st.node!];
      if (!n) return;
      const c = cellXY(n.col, n.row);
      const k = view.k;
      const wx = c[0] + dx / k;
      const wy = c[1] + dy / k;
      const cell = nearestCell(wx, wy);
      setDrag({ id: st.node!, x: wx, y: wy, col: cell[0], row: cell[1] });
    }
  }

  function onUp(e: PointerEvent) {
    const st = g.current;
    delete st.pointers[e.pointerId];
    if (st.mode === 'pinch') {
      if (Object.keys(st.pointers).length === 0) st.mode = null;
      return;
    }
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    setPanning(false);
    if (st.mode === 'node' && st.moved) {
      const n = byId[st.node!];
      if (n) {
        const c = cellXY(n.col, n.row);
        const k = view.k;
        const pt = local(e);
        const cell = nearestCell(
          c[0] + (pt[0] - st.start![0]) / k,
          c[1] + (pt[1] - st.start![1]) / k,
        );
        if (cell[1] >= 0 && (cell[0] !== n.col || cell[1] !== n.row)) {
          const other = nodes.find((m) => m.col === cell[0] && m.row === cell[1]);
          commit(
            nodes.map((m) => {
              if (m.id === n.id) return { ...m, col: cell[0], row: cell[1] };
              if (other && m.id === other.id) return { ...m, col: n.col, row: n.row };
              return m;
            }),
          );
        }
      }
    } else if (!st.moved) {
      if (st.node) select(st.node === selected ? null : st.node);
      else select(null);
    }
    setDrag(null);
    st.mode = null;
    st.node = undefined;
    st.pointers = {};
  }

  const handleResize = useEffectEvent((sz: { w: number; h: number }, isFirst: boolean) => {
    setSize(sz);
    if (isFirst) fit(sz, true);
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') {
      handleResize({ w: el.clientWidth, h: el.clientHeight }, true);
      return;
    }
    let first = true;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const isFirst = first;
      first = false;
      handleResize({ w: rect.width, h: rect.height }, isFirst);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleWheel = useEffectEvent((e: WheelEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('aside')) return;
    e.preventDefault();
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) {
      zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    } else {
      setView({ k: view.k, x: view.x - e.deltaX, y: view.y - e.deltaY });
    }
  });

  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') select(null);
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('keydown', handleKey);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('keydown', handleKey);
    };
  }, []);

  const sel = selected ? (byId[selected] ?? null) : null;
  const edges: ReactNode[] = [];
  if (sel) {
    const center = (m: SkillDef): [number, number] => {
      const c = cellXY(m.col, m.row);
      return [c[0] + HEX_W / 2, c[1] + HEX_H / 2];
    };
    const line = (from: SkillDef, to: SkillDef, lit: boolean, key: string) => {
      const a = center(from);
      const b = center(to);
      edges.push(
        <path
          key={key}
          className={cn('fill-none', lit ? 'stroke-up animate-flow' : 'stroke-line-control')}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={lit ? '6 8' : '2 6'}
          d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`}
        />,
      );
    };
    for (const id of sel.requires ?? []) {
      const r = byId[id];
      if (r) line(r, sel, skillProgress(r) >= 1, `r${id}`);
    }
    for (const m of nodes) {
      if ((m.requires ?? []).includes(sel.id)) line(sel, m, skillProgress(sel) >= 1, `u${m.id}`);
    }
  }

  const counted = nodes.filter((n) => !(n.goal && !n.title));
  const score = counted.filter((n) => skillProgress(n) >= 1).length;
  const b = bounds();
  const startC = cellXY(Math.round((minC + maxC) / 2), rows - 1);
  const draggedNode = drag ? byId[drag.id] : null;
  const ghost =
    drag &&
    draggedNode &&
    (drag.col !== draggedNode.col || drag.row !== draggedNode.row) &&
    drag.row >= 0
      ? cellXY(drag.col, drag.row)
      : null;
  const narrow = size.w < 640;

  return (
    <div
      ref={wrapRef}
      role="application"
      aria-label={label ?? 'Skill tree canvas'}
      tabIndex={-1}
      className={cn(
        'relative box-content cursor-grab touch-none overflow-hidden rounded-lg border border-line bg-bg-000 bg-dot-grid outline-none select-none',
        panning && 'cursor-grabbing',
      )}
      style={{
        height: height ?? 640,
        backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
      onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.target === wrapRef.current || e.target === worldRef.current) onDown(e, null);
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
        <svg
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width={b.x1}
          height={b.y1}
          aria-hidden
        >
          {edges}
        </svg>
        {ghost ? (
          <svg
            className="pointer-events-none absolute"
            width={HEX_W}
            height={HEX_H}
            style={{ left: ghost[0], top: ghost[1] }}
            aria-hidden
          >
            <path
              d={HEX_D}
              fill="none"
              stroke="var(--color-focus)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </svg>
        ) : null}
        {nodes.map((n) => {
          const isDrag = drag != null && drag.id === n.id;
          const c: [number, number] = isDrag && drag ? [drag.x, drag.y] : cellXY(n.col, n.row);
          const inTier = { ...n, tier: n.tier || tierOf(n.row, rows) };
          return (
            <SkillNode
              key={n.id}
              node={inTier}
              state={nodeState(n, byId)}
              selected={selected === n.id}
              dragging={isDrag}
              style={{ left: c[0], top: c[1] }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onDown(e, n.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(n.id);
                }
              }}
            />
          );
        })}
        {start !== false ? (
          <div
            className="absolute box-content inline-flex h-8 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-pill border border-line-control bg-bg-200 px-14px font-mono text-12px leading-none font-semibold tracking-widest whitespace-nowrap text-ink uppercase"
            style={{ left: startC[0] + HEX_W / 2, top: startC[1] + HEX_H + PITCH_Y / 2 + 28 }}
          >
            <Icon name="flag" size={14} stroke={2} />
            Start here
          </div>
        ) : null}
      </div>

      <div
        className="pointer-events-none absolute top-156px bottom-56px left-14px flex w-4 flex-col items-center gap-2"
        aria-hidden
      >
        <span className="vertical-rl rotate-180 font-mono text-10px leading-none font-medium tracking-rail text-ink-faint uppercase">
          Advanced
        </span>
        <i className="relative w-2px flex-1 rounded-2px bg-line-control before:absolute before:-top-2px before:left-1/2 before:-translate-x-1/2 before:border-5 before:border-t-0 before:border-transparent before:border-b-7 before:border-b-line-control" />
        <span className="vertical-rl rotate-180 font-mono text-10px leading-none font-medium tracking-rail text-ink-faint uppercase">
          Basics
        </span>
      </div>

      <Hud corner="tl">
        <Eyebrow>Total score</Eyebrow>
        <div className="flex items-baseline gap-6px">
          <Num className="text-22px leading-26px text-ink">{score}</Num>
          <Num className="text-ink-faint">/ {counted.length} pts</Num>
        </div>
        <Meter className="w-120px" value={counted.length ? score / counted.length : 0} />
        <span className="text-11px text-ink-faint">1 tile = 1 point</span>
      </Hud>

      <Hud corner="tr" className={cn(sel && !narrow && 'right-364px')}>
        <ZoomControls
          zoom={view.k}
          onZoomOut={() => zoomAt(1 / 1.2, size.w / 2, size.h / 2, true)}
          onZoomIn={() => zoomAt(1.2, size.w / 2, size.h / 2, true)}
          onFit={() => fit()}
        />
      </Hud>

      {!sel ? (
        <Hud corner="bl">
          {narrow
            ? 'Drag to pan · pinch to zoom · tap a tile'
            : 'Drag to pan · ⌘/Ctrl + scroll to zoom · drag a tile to move it · click to open'}
        </Hud>
      ) : null}

      {sel ? (
        <SkillPanel
          key={sel.id}
          className={cn(narrow && 'is-sheet', 'box-content')}
          node={{ ...sel, tier: sel.tier || tierOf(sel.row, rows) }}
          byId={byId}
          nodes={nodes}
          onClose={() => select(null)}
          onSelect={select}
          onChange={(m) => {
            const clean = { ...m };
            if (!byId[m.id]?.tier) delete clean.tier;
            commit(nodes.map((x) => (x.id === m.id ? clean : x)));
          }}
        />
      ) : null}
    </div>
  );
}
