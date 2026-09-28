import { useEffect, useRef, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts from the previous value (0 on mount) to `target` with a quartic ease-out.
 * Renders `target` on the server and under reduced motion, so the number is never wrong.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const from = useRef(0);

  useEffect(() => {
    if (reducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = from.current;
    let begin: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
      begin ??= now;
      const p = Math.min(1, (now - begin) / durationMs);
      const v = start + (target - start) * (1 - Math.pow(1 - p, 4));
      from.current = v;
      setValue(v);
      if (p < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
