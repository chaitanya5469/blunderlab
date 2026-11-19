import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { apply, boardToImage, orderQuad, type Pt, type Quad } from './geometry';

interface CornerEditorProps {
  src: string;
  width: number;
  height: number;
  quad: Quad;
  onChange: (q: Quad) => void;
}

const LOUPE = 112;
const ZOOM = 3;

/**
 * The image (fitted into the available space) with the board outline and an 8x8 grid drawn through four draggable corners. A loupe
 * magnifies the area under the finger while dragging so a corner can be placed precisely.
 */
export function CornerEditor({ src, width, height, quad, onChange }: CornerEditorProps) {
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  // Displayed width in CSS pixels (handles and the loupe are sized in screen terms).
  const [shown, setShown] = useState(340);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setShown(el.getBoundingClientRect().width || 340));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const grid = useMemo(() => {
    let H: number[];
    try {
      H = boardToImage(orderQuad(quad));
    } catch {
      return [];
    }
    const lines: [Pt, Pt][] = [];
    for (let i = 1; i < 8; i++) {
      lines.push([apply(H, i, 0), apply(H, i, 8)]);
      lines.push([apply(H, 0, i), apply(H, 8, i)]);
    }
    return lines;
  }, [quad]);

  const toImage = (e: ReactPointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(width, ((e.clientX - r.left) / r.width) * width)),
      y: Math.max(0, Math.min(height, ((e.clientY - r.top) / r.height) * height)),
    };
  };

  const onDown = (i: number) => (e: ReactPointerEvent) => {
    e.preventDefault();
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // No capture (e.g. the pointer is already gone): moves over the image still drag.
    }
    setDrag(i);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (drag === null) return;
    const next = [...quad] as Quad;
    next[drag] = toImage(e);
    onChange(next);
  };
  const onUp = () => setDrag(null);

  // Handle radius in image pixels, so handles look the same size whatever the image resolution.
  const px = width / shown;
  const active = drag !== null ? quad[drag] : null;
  const loupeLeft = active && active.x < width / 2;

  return (
    // The outer box fills the space it is given (a flex child) and never scrolls; the image is fitted
    // inside it (contain). Only a drag that starts on a corner handle moves anything.
    <div className="flex min-h-0 w-full flex-1 touch-none items-center justify-center select-none [container-type:size]">
    <div
      ref={box}
      className="relative overflow-hidden rounded-[10px] bg-ink ring-1 ring-white/5"
      style={{ aspectRatio: `${width} / ${height}`, width: `min(100cqw, calc(100cqh * ${width / height}))` }}
    >
      <img src={src} alt="Your image" className="absolute inset-0 size-full" draggable={false} />
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 size-full" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <polygon points={quad.map((p) => `${p.x},${p.y}`).join(' ')} fill="rgb(111 149 255 / 0.12)" stroke="var(--color-accent-strong)" strokeWidth={2 * px} />
        {grid.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgb(147 176 255 / 0.55)" strokeWidth={1 * px} />
        ))}
        {quad.map((p, i) => (
          <g key={i}>
            {/* Large invisible touch target, small visible ring. */}
            <circle cx={p.x} cy={p.y} r={30 * px} fill="transparent" onPointerDown={onDown(i)} style={{ cursor: 'grab' }} />
            <circle cx={p.x} cy={p.y} r={9 * px} fill="rgb(12 14 18 / 0.35)" stroke="var(--color-accent-strong)" strokeWidth={2.5 * px} pointerEvents="none" />
            <circle cx={p.x} cy={p.y} r={1.6 * px} fill="var(--color-accent-strong)" pointerEvents="none" />
          </g>
        ))}
      </svg>
      {active && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 size-28 overflow-hidden rounded-full shadow-[0_8px_24px_rgb(0_0_0/0.6)] ring-2 ring-accent-strong"
          style={{
            [loupeLeft ? 'right' : 'left']: 8,
            width: LOUPE,
            height: LOUPE,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${(shown * ZOOM)}px ${(shown * ZOOM * height) / width}px`,
            backgroundPosition: `${LOUPE / 2 - (active.x / px) * ZOOM}px ${LOUPE / 2 - (active.y / px) * ZOOM}px`,
          }}
        >
          <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent-strong" />
        </div>
      )}
    </div>
    </div>
  );
}
