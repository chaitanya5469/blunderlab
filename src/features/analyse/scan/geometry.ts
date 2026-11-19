/** Points, homographies and bilinear sampling shared by board localisation and tile extraction. */

export interface Pt {
  x: number;
  y: number;
}

/** Board corners in image pixels, in board order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Pt, Pt, Pt, Pt];

/** Grey or RGB image as floats (0..255), row-major, `channels` interleaved. */
export interface Raster {
  width: number;
  height: number;
  channels: 1 | 3;
  data: Float32Array;
}

export function rasterFromImageData(img: ImageData): Raster {
  const { width, height, data } = img;
  const out = new Float32Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    out[j] = data[i]!;
    out[j + 1] = data[i + 1]!;
    out[j + 2] = data[i + 2]!;
  }
  return { width, height, channels: 3, data: out };
}

/** Solves the 3x3 homography mapping `from[i]` to `to[i]` (h33 = 1). */
export function homography(from: Pt[], to: Pt[]): number[] {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i]!;
    const { x: u, y: v } = to[i]!;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  // Gaussian elimination with partial pivoting on the 8x9 augmented matrix.
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    [A[c], A[p]] = [A[p]!, A[c]!];
    const piv = A[c]![c]!;
    if (Math.abs(piv) < 1e-12) throw new Error('Degenerate corners');
    for (let k = c; k < 9; k++) A[c]![k]! /= piv;
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r]![c]!;
      if (!f) continue;
      for (let k = c; k < 9; k++) A[r]![k]! -= f * A[c]![k]!;
    }
  }
  return [...A.map((row) => row[8]!), 1];
}

export function apply(H: number[], x: number, y: number): Pt {
  const d = H[6]! * x + H[7]! * y + H[8]!;
  return { x: (H[0]! * x + H[1]! * y + H[2]!) / d, y: (H[3]! * x + H[4]! * y + H[5]!) / d };
}

/** Homography from board coordinates (0..8 squares, origin top-left) to image pixels. */
export function boardToImage(q: Quad): number[] {
  return homography(
    [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 8 },
      { x: 0, y: 8 },
    ],
    q,
  );
}

/** Area of a quad (shoelace), for sanity checks. */
export function quadArea(q: Quad): number {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i]!;
    const b = q[(i + 1) % 4]!;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/**
 * Puts four tapped points into board order (TL, TR, BR, BL as seen in the image) whatever order
 * they were given in: sorted around their centroid, starting from the top-left-most.
 */
export function orderQuad(pts: Pt[]): Quad {
  const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
  const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
  const sorted = [...pts].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  // atan2 order runs clockwise on screen (y down) starting near angle -pi (left).
  let start = 0;
  for (let i = 1; i < 4; i++) if (sorted[i]!.x + sorted[i]!.y < sorted[start]!.x + sorted[start]!.y) start = i;
  return [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]!) as Quad;
}
