/**
 * Minimal CNN inference for the square classifiers (no model runtime: a few hundred lines beat a
 * multi-megabyte dependency for a ~200k-parameter net). Layers and weight layout match PyTorch,
 * exported by ml/export.py: CHW activations, conv weights [out][in][k][k] with batch norm folded in,
 * linear weights [out][in], float16 weights in one blob.
 */

export type Layer =
  | { type: 'conv'; cin: number; cout: number; k: number; pad: number; stride?: number; w: number; b: number }
  | { type: 'relu' }
  | { type: 'maxpool'; k: number }
  | { type: 'linear'; cin: number; cout: number; w: number; b: number };

export interface Manifest {
  /** [channels, height, width] */
  input: [number, number, number];
  layers: Layer[];
  classes: string[];
  /** Calibrated on validation data: squares below this confidence get a check-me marker. */
  unsure_below?: number;
}

export interface Model {
  manifest: Manifest;
  weights: Float32Array;
}

function halfToFloat(h: number): number {
  const s = h & 0x8000 ? -1 : 1;
  const e = (h >> 10) & 0x1f;
  const f = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * 2 ** (e - 15) * (1 + f / 1024);
}

export function decodeHalf(buf: ArrayBuffer): Float32Array {
  const u16 = new Uint16Array(buf);
  const out = new Float32Array(u16.length);
  for (let i = 0; i < u16.length; i++) out[i] = halfToFloat(u16[i]!);
  return out;
}

export async function loadModel(base: string): Promise<Model> {
  const [manifest, blob] = await Promise.all([
    fetch(`${base}.json`).then((r) => {
      if (!r.ok) throw new Error(`Model manifest missing (${r.status})`);
      return r.json() as Promise<Manifest>;
    }),
    fetch(`${base}.bin`).then((r) => {
      if (!r.ok) throw new Error(`Model weights missing (${r.status})`);
      return r.arrayBuffer();
    }),
  ]);
  return { manifest, weights: decodeHalf(blob) };
}

/**
 * Activations for a batch are stored channel-major: [channel][sample][y][x]. Convolutions use
 * im2col so the hot loop runs over one long contiguous row (all samples' pixels) per weight,
 * four output channels at a time: much faster in JS than a direct convolution.
 */
interface Act {
  x: Float32Array;
  c: number;
  n: number;
  h: number;
  w: number;
}

function conv(a: Act, L: Extract<Layer, { type: 'conv' }>, W: Float32Array): Act {
  const { x, c, n, h, w } = a;
  const { cout, k, pad } = L;
  const stride = L.stride ?? 1;
  const oh = Math.floor((h + 2 * pad - k) / stride) + 1;
  const ow = Math.floor((w + 2 * pad - k) / stride) + 1;
  const P = oh * ow;
  const NP = n * P;
  const K = c * k * k;
  const col = new Float32Array(K * NP);
  for (let i = 0; i < c; i++) {
    for (let ky = 0; ky < k; ky++) {
      for (let kx = 0; kx < k; kx++) {
        const base = ((i * k + ky) * k + kx) * NP;
        for (let s = 0; s < n; s++) {
          const src = (i * n + s) * h * w;
          for (let oy = 0; oy < oh; oy++) {
            const iy = oy * stride + ky - pad;
            if (iy < 0 || iy >= h) continue;
            const dst = base + s * P + oy * ow;
            const row = src + iy * w;
            for (let ox = 0; ox < ow; ox++) {
              const ix = ox * stride + kx - pad;
              if (ix >= 0 && ix < w) col[dst + ox] = x[row + ix]!;
            }
          }
        }
      }
    }
  }
  const out = new Float32Array(cout * NP);
  let o = 0;
  for (; o + 4 <= cout; o += 4) {
    const b0 = o * NP;
    const b1 = b0 + NP;
    const b2 = b1 + NP;
    const b3 = b2 + NP;
    out.fill(W[L.b + o]!, b0, b1);
    out.fill(W[L.b + o + 1]!, b1, b2);
    out.fill(W[L.b + o + 2]!, b2, b3);
    out.fill(W[L.b + o + 3]!, b3, b3 + NP);
    for (let r = 0; r < K; r++) {
      const w0 = W[L.w + o * K + r]!;
      const w1 = W[L.w + (o + 1) * K + r]!;
      const w2 = W[L.w + (o + 2) * K + r]!;
      const w3 = W[L.w + (o + 3) * K + r]!;
      const cb = r * NP;
      for (let j = 0; j < NP; j++) {
        const v = col[cb + j]!;
        out[b0 + j]! += w0 * v;
        out[b1 + j]! += w1 * v;
        out[b2 + j]! += w2 * v;
        out[b3 + j]! += w3 * v;
      }
    }
  }
  for (; o < cout; o++) {
    const b0 = o * NP;
    out.fill(W[L.b + o]!, b0, b0 + NP);
    for (let r = 0; r < K; r++) {
      const w0 = W[L.w + o * K + r]!;
      const cb = r * NP;
      for (let j = 0; j < NP; j++) out[b0 + j]! += w0 * col[cb + j]!;
    }
  }
  return { x: out, c: cout, n, h: oh, w: ow };
}

function maxpool(a: Act): Act {
  const { x, c, n, h, w } = a;
  const oh = h >> 1;
  const ow = w >> 1;
  const out = new Float32Array(c * n * oh * ow);
  for (let p = 0; p < c * n; p++) {
    const ib = p * h * w;
    const ob = p * oh * ow;
    for (let y = 0; y < oh; y++) {
      for (let xx = 0; xx < ow; xx++) {
        const q = ib + 2 * y * w + 2 * xx;
        out[ob + y * ow + xx] = Math.max(x[q]!, x[q + 1]!, x[q + w]!, x[q + w + 1]!);
      }
    }
  }
  return { x: out, c, n, h: oh, w: ow };
}

/** Linear layer on the flattened (CHW per sample) activations; output is [cout][n]. */
function linear(a: Act, L: Extract<Layer, { type: 'linear' }>, W: Float32Array): Act {
  const { x, c, n, h, w } = a;
  const P = h * w;
  const out = new Float32Array(L.cout * n);
  for (let s = 0; s < n; s++) {
    for (let o = 0; o < L.cout; o++) {
      let acc = W[L.b + o]!;
      const row = L.w + o * L.cin;
      for (let ch = 0; ch < c; ch++) {
        const src = (ch * n + s) * P;
        const wr = row + ch * P;
        for (let p = 0; p < P; p++) acc += W[wr + p]! * x[src + p]!;
      }
      out[o * n + s] = acc;
    }
  }
  return { x: out, c: L.cout, n, h: 1, w: 1 };
}

const BATCH = 16;

/** Runs inputs (CHW floats in [0, 1]) through the net; returns each one's class probabilities. */
export function forward(model: Model, inputs: Float32Array[]): Float32Array[] {
  const results: Float32Array[] = [];
  const [c0, h0, w0] = model.manifest.input;
  for (let start = 0; start < inputs.length; start += BATCH) {
    const batch = inputs.slice(start, start + BATCH);
    const n = batch.length;
    const plane = h0 * w0;
    const x = new Float32Array(c0 * n * plane);
    batch.forEach((t, s) => {
      for (let ch = 0; ch < c0; ch++) x.set(t.subarray(ch * plane, (ch + 1) * plane), (ch * n + s) * plane);
    });
    let a: Act = { x, c: c0, n, h: h0, w: w0 };
    for (const L of model.manifest.layers) {
      if (L.type === 'conv') a = conv(a, L, model.weights);
      else if (L.type === 'maxpool') a = maxpool(a);
      else if (L.type === 'linear') a = linear(a, L, model.weights);
      else {
        const v = a.x;
        for (let i = 0; i < v.length; i++) if (v[i]! < 0) v[i] = 0;
      }
    }
    for (let s = 0; s < n; s++) {
      const logits = new Float32Array(a.c);
      for (let o = 0; o < a.c; o++) logits[o] = a.x[o * n + s]!;
      results.push(softmax(logits));
    }
  }
  return results;
}

function softmax(x: Float32Array): Float32Array {
  let max = -Infinity;
  for (const v of x) max = Math.max(max, v);
  let sum = 0;
  const p = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) sum += p[i] = Math.exp(x[i]! - max);
  for (let i = 0; i < x.length; i++) p[i]! /= sum;
  return p;
}