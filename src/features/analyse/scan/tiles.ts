import { apply, boardToImage, type Quad, type Raster } from './geometry';

/** Output pixels per board square (both models). */
export const PX = 32;

/**
 * Samples a region of the board plane into a CHW float tile (0..1). Board coordinates are in
 * squares from the top-left corner; output pixel j covers board x = x0 + (j + t/k) / PX, t < k,
 * averaged over a k x k grid of bilinear samples. That is exactly what ml/synth.py does with
 * OpenCV (warp to k times the size, then area-downscale), so the app sees what the model saw.
 */
function region(img: Raster, H: number[], x0: number, y0: number, wpx: number, hpx: number, k: number): Float32Array {
  const plane = wpx * hpx;
  const out = new Float32Array(3 * plane);
  const tmp = new Float32Array(3);
  const inv = 1 / (k * k * 255);
  for (let j = 0; j < hpx; j++) {
    for (let i = 0; i < wpx; i++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ty = 0; ty < k; ty++) {
        const by = y0 + (j + ty / k) / PX;
        for (let tx = 0; tx < k; tx++) {
          const p = apply(H, x0 + (i + tx / k) / PX, by);
          sampleRgb(img, p.x, p.y, tmp);
          r += tmp[0]!;
          g += tmp[1]!;
          b += tmp[2]!;
        }
      }
      const o = j * wpx + i;
      out[o] = r * inv;
      out[plane + o] = g * inv;
      out[2 * plane + o] = b * inv;
    }
  }
  return out;
}

function sampleRgb(img: Raster, x: number, y: number, out: Float32Array) {
  const { width: w, height: h, data } = img;
  const xf = Math.floor(x);
  const yf = Math.floor(y);
  const fx = x - xf;
  const fy = y - yf;
  const x0 = Math.min(w - 1, Math.max(0, xf));
  const x1 = Math.min(w - 1, Math.max(0, xf + 1));
  const y0 = Math.min(h - 1, Math.max(0, yf));
  const y1 = Math.min(h - 1, Math.max(0, yf + 1));
  const a = (y0 * w + x0) * 3;
  const b = (y0 * w + x1) * 3;
  const c = (y1 * w + x0) * 3;
  const d = (y1 * w + x1) * 3;
  for (let ch = 0; ch < 3; ch++) {
    out[ch] = (data[a + ch]! * (1 - fx) + data[b + ch]! * fx) * (1 - fy) + (data[c + ch]! * (1 - fx) + data[d + ch]! * fx) * fy;
  }
}

/** Supersampling factor, as in training: round(board side / 256), capped at 4, none below 1.2x. */
function factor(q: Quad): number {
  const side = (dist(q[0], q[1]) + dist(q[1], q[2]) + dist(q[2], q[3]) + dist(q[3], q[0])) / 4;
  const scale = side / (8 * PX);
  return scale > 1.2 ? Math.min(4, Math.round(scale)) : 1;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** 64 square tiles (32x32), row-major from the board's top-left as seen in the image. */
export function screenTiles(img: Raster, q: Quad): Float32Array[] {
  const H = boardToImage(q);
  const k = factor(q);
  const out: Float32Array[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) out.push(region(img, H, c, r, PX, PX, k));
  return out;
}

/** Photo tiles: each square plus a quarter square either side and one square above (tall pieces), 48x64. */
export const PHOTO_W = 48;
export const PHOTO_H = 64;
export function photoTiles(img: Raster, q: Quad): Float32Array[] {
  const H = boardToImage(q);
  const k = factor(q);
  const out: Float32Array[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) out.push(region(img, H, c - 0.25, r - 1, PHOTO_W, PHOTO_H, k));
  return out;
}
