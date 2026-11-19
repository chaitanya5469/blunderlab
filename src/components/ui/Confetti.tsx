import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const COLORS = ['#f5c542', '#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa'];
const COUNT = 36;
const DURATION = 1.6;

/**
 * A short confetti burst over the nearest positioned ancestor. Plays once on mount, then removes
 * itself. Mount it with a changing `key` to replay. Does nothing under reduced motion.
 */
export function Confetti() {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.1;
        const speed = 90 + Math.random() * 130;
        return {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          fall: 150 + Math.random() * 120,
          rotate: (Math.random() - 0.5) * 720,
          color: COLORS[i % COLORS.length]!,
          w: 5 + Math.random() * 4,
          h: 8 + Math.random() * 5,
          delay: Math.random() * 0.12,
        };
      }),
    [],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), (DURATION + 0.3) * 1000);
    return () => window.clearTimeout(t);
  }, []);

  if (reduce || done) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-1/2 left-1/2 block rounded-[1px]"
          style={{ width: p.w, height: p.h, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + p.fall], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: DURATION, delay: p.delay, ease: 'easeOut', times: [0, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
