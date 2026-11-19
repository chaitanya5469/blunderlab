import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** A number that eases to its new value instead of jumping. */
export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = previous.current;
    previous.current = value;
    if (reduce || from === value) {
      el.textContent = value.toFixed(decimals);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [value, decimals, reduce]);

  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}
