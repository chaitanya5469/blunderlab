import type { Quad, Raster } from './geometry';

/**
 * Finds an axis-aligned chessboard in a screenshot or diagram: the square whose 8x8 cells best
 * alternate between two tones. Each cell is read at its four corners (where pieces rarely reach),
 * and a candidate is scored by how far apart the two tone groups are relative to their spread
 * (a Fisher score), so a board shifted by a cell, or one cell too big, scores badly. A coarse search
 * over sizes and positions on a small copy is refined at a higher resolution.
 * Returns null when nothing looks like a board.
 */
export interface Located {
  quad: Quad;
  score: number;
}

interface Gray {
  w: number;
  h: number;
  /** Integral image, (w+1) x (h+1). */
  ii: Float64Array;
}

function grayIntegral(img: Raster, maxSide: number): { g: Gray; scale: number } {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(8, Math.round(img.width * scale));
  const h = Math.max(8, Math.round(img.height * scale));
  const lum = new Float64Array(w * h);
  // Box-average downscale.
  const cnt = new Float64Array(w * h);
  const { data, width, height, channels } = img;
  for (let y = 0; y < height; y++) {
    const ty = Math.min(h - 1, Math.floor(y * scale));
    for (let x = 0; x < width; x++) {
      const tx = Math.min(w - 1, Math.floor(x * scale));
      const p = (y * width + x) * channels;
      const v = channels === 3 ? 0.299 * data[p]! + 0.587 * data[p + 1]! + 0.114 * data[p + 2]! : data[p]!;
      lum[ty * w + tx]! += v;
      cnt[ty * w + tx]! += 1;
    }
  }
  const ii = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += lum[y * w + x]! / Math.max(1, cnt[y * w + x]!);
      ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1]! + row;
    }
  }
  return { g: { w, h, ii }, scale };
}

function boxMean(g: Gray, x0: number, y0: number, x1: number, y1: number): number {
  const W = g.w + 1;
  const a = Math.max(0, Math.min(g.w, Math.round(x0)));
  const b = Math.max(0, Math.min(g.h, Math.round(y0)));
  const c = Math.max(a + 1, Math.min(g.w, Math.round(x1)));
  const d = Math.max(b + 1, Math.min(g.h, Math.round(y1)));
  return (g.ii[d * W + c]! - g.ii[b * W + c]! - g.ii[d * W + a]! + g.ii[b * W + a]!) / ((c - a) * (d - b));
}

/** Fisher score of the 8x8 alternation for a board at (x, y) with side s (in g's pixels). */
function score(g: Gray, x: number, y: number, s: number): number {
  const cell = s / 8;
  const p = Math.max(1, cell * 0.2);
  const inset = Math.max(0.5, cell * 0.06);
  let sa = 0;
  let sa2 = 0;
  let sb = 0;
  let sb2 = 0;
  for (let r = 0; r < 8; r++) {
    const cy0 = y + r * cell;
    for (let c = 0; c < 8; c++) {
      const cx0 = x + c * cell;
      const v =
        (boxMean(g, cx0 + inset, cy0 + inset, cx0 + inset + p, cy0 + inset + p) +
          boxMean(g, cx0 + cell - inset - p, cy0 + inset, cx0 + cell - inset, cy0 + inset + p) +
          boxMean(g, cx0 + inset, cy0 + cell - inset - p, cx0 + inset + p, cy0 + cell - inset) +
          boxMean(g, cx0 + cell - inset - p, cy0 + cell - inset - p, cx0 + cell - inset, cy0 + cell - inset)) /
        4;
      if ((r + c) % 2 === 0) {
        sa += v;
        sa2 += v * v;
      } else {
        sb += v;
        sb2 += v * v;
      }
    }
  }
  const ma = sa / 32;
  const mb = sb / 32;
  const va = Math.max(0, sa2 / 32 - ma * ma);
  const vb = Math.max(0, sb2 / 32 - mb * mb);
  return Math.abs(ma - mb) / (Math.sqrt(va) + Math.sqrt(vb) + 3);
}

function search(g: Gray, sizes: number[], xs: (s: number) => number[], ys: (s: number) => number[]) {
  let best = { x: 0, y: 0, s: 0, v: -1 };
  for (const s of sizes) {
    for (const y of ys(s)) {
      for (const x of xs(s)) {
        const v = score(g, x, y, s);
        if (v > best.v) best = { x, y, s, v };
      }
    }
  }
  return best;
}

const range = (a: number, b: number, step: number) => {
  const out: number[] = [];
  for (let v = a; v <= b + 1e-9; v += step) out.push(v);
  return out;
};

/**
 * Final sub-pixel fit on the full-resolution image along one axis: every one of the 9 grid lines
 * (squares always alternate, so each is a tone edge on almost every row) should sit on a peak of
 * the summed gradient profile. Searches offset and size within a few percent of a square.
 */
function snapToGrid(img: Raster, axis: 'x' | 'y', start: number, size: number, across0: number, across1: number): [number, number] {
  const { width, height, data, channels } = img;
  const len = axis === 'x' ? width : height;
  const lum = (x: number, y: number) => {
    const p = (y * width + x) * channels;
    return channels === 3 ? 0.299 * data[p]! + 0.587 * data[p + 1]! + 0.114 * data[p + 2]! : data[p]!;
  };
  const a0 = Math.max(0, Math.floor(across0 + size * 0.02));
  const a1 = Math.min(axis === 'x' ? height : width, Math.ceil(across1 - size * 0.02));
  // profile[i]: summed |difference| between positions i and i+1 along the axis (an edge at i + 0.5).
  const profile = new Float64Array(len);
  const lo = Math.max(0, Math.floor(start - size * 0.06));
  const hi = Math.min(len - 1, Math.ceil(start + size * 1.06));
  for (let i = lo; i < hi; i++) {
    let s = 0;
    for (let t = a0; t < a1; t++) s += axis === 'x' ? Math.abs(lum(i + 1, t) - lum(i, t)) : Math.abs(lum(t, i + 1) - lum(t, i));
    profile[i] = s;
  }
  const at = (pos: number) => {
    // Positions use the training convention: a board edge at `pos` means pixel `pos` is the first
    // pixel inside, so the step is between pixels pos - 1 and pos, i.e. profile[pos - 1].
    const q = pos - 1;
    const f = Math.floor(q);
    if (f < 0 || f + 1 >= len) return 0;
    const w = q - f;
    return profile[f]! * (1 - w) + profile[f + 1]! * w;
  };
  const cell = size / 8;
  let best = { s: start, z: size, v: -1 };
  for (let dz = -0.03; dz <= 0.0301; dz += 0.0025) {
    const z = size * (1 + dz);
    for (let ds = -0.12; ds <= 0.1201; ds += 0.01) {
      const s0 = start + ds * cell;
      let v = 0;
      for (let i = 0; i <= 8; i++) v += at(s0 + (i * z) / 8);
      if (v > best.v) best = { s: s0, z, v };
    }
  }
  return [best.s, best.s + best.z];
}

export function locateBoard(img: Raster): Located | null {
  // Coarse: small copy, sizes from a quarter of the short side up to all of it.
  const { g, scale } = grayIntegral(img, 200);
  const short = Math.min(g.w, g.h);
  const sizes = range(Math.max(24, short * 0.22), short, Math.max(1, short * 0.02));
  const coarse = search(
    g,
    sizes,
    (s) => range(0, g.w - s, Math.max(1, s / 24)),
    (s) => range(0, g.h - s, Math.max(1, s / 24)),
  );
  if (coarse.v < 0.6) return null;

  // Fine: larger copy, around the coarse hit.
  const { g: G, scale: S } = grayIntegral(img, 720);
  const f = S / scale;
  const cs = coarse.s * f;
  const step = Math.max(0.5, cs / 400);
  let best = { x: coarse.x * f, y: coarse.y * f, s: cs, v: -1 };
  // Two rounds of local search, each narrowing.
  for (const span of [cs / 30, cs / 120]) {
    const c = best;
    best = search(
      G,
      range(c.s - span * 2, c.s + span * 2, Math.max(step, span / 3)),
      () => range(c.x - span, c.x + span, Math.max(step, span / 4)),
      () => range(c.y - span, c.y + span, Math.max(step, span / 4)),
    );
  }
  const k = 1 / S;
  const [x0, x1] = snapToGrid(img, 'x', best.x * k, best.s * k, best.y * k, (best.y + best.s) * k);
  const [y0, y1] = snapToGrid(img, 'y', best.y * k, best.s * k, x0, x1);
  return {
    quad: [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ],
    score: best.v,
  };
}
