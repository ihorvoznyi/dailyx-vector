import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Tracks an element's content width with a ResizeObserver, for charts that compute SVG geometry
 * in pixels. Returns `fallback` until the first measurement (and on the server).
 */
export function useWidth<T extends HTMLElement = HTMLDivElement>(
  fallback = 600,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
