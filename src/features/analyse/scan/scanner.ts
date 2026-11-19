import type { Quad } from './geometry';
import type { ScanMode, WorkerReply, WorkerRequest } from './recognize.worker';

export type { ScanMode };

/** Where the trained square classifiers live (copied into the app from ml/out). */
export const MODEL_BASE: Record<ScanMode, string> = {
  screen: `${import.meta.env.BASE_URL}models/squares-screen`,
  photo: `${import.meta.env.BASE_URL}models/squares-photo`,
};

/** Longest side images are reduced to before recognition (keeps memory and time bounded on phones). */
const MAX_SIDE: Record<ScanMode, number> = { screen: 1600, photo: 1600 };

type Req = WorkerRequest extends infer R ? (R extends WorkerRequest ? Omit<R, 'id'> : never) : never;
type Ok = Extract<WorkerReply, { ok: true }>;

type Pending = { resolve: (r: WorkerReply) => void; reject: (e: Error) => void };

/** One recognition worker per scan screen; everything stays on the device. */
export class Scanner {
  private worker = new Worker(new URL('./recognize.worker.ts', import.meta.url), { type: 'module' });
  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor() {
    this.worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      this.pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data);
      else p.reject(new Error(e.data.error));
    };
    this.worker.onerror = (e) => {
      for (const p of this.pending.values()) p.reject(new Error(e.message || 'Recognition failed'));
      this.pending.clear();
    };
  }

  private call<T extends Ok['type']>(req: Req, transfer: Transferable[] = []): Promise<Extract<Ok, { type: T }>> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (r: WorkerReply) => void, reject });
      this.worker.postMessage({ ...req, id }, transfer);
    });
  }

  async setImage(image: ImageData) {
    await this.call<'image'>({ type: 'image', image });
  }

  async locate(): Promise<Quad | null> {
    return (await this.call<'locate'>({ type: 'locate' })).quad;
  }

  async classify(quad: Quad, mode: ScanMode) {
    // Absolute URL: inside the worker a relative one would resolve against the worker script's folder.
    const modelBase = new URL(MODEL_BASE[mode], document.baseURI).href;
    const r = await this.call<'classify'>({ type: 'classify', quad, mode, modelBase });
    return { probs: r.probs, classes: r.classes, unsureBelow: r.unsureBelow };
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
  }
}

/** Decodes an image file into pixels, reduced so its longest side is at most `MAX_SIDE[mode]`. */
export async function decodeImage(source: Blob, mode: ScanMode): Promise<{ image: ImageData; url: string }> {
  // Copy into memory first: a gallery pick in the Android WebView is backed by a content:// URI
  // that may not be readable again later (an object URL of it showed as a broken image).
  const blob = new Blob([await source.arrayBuffer()], { type: source.type || 'image/png' });
  // createImageBitmap applies EXIF orientation and, unlike HTMLImageElement.decode(), also
  // resolves while the page is in the background.
  const img = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE[mode] / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  img.close();
  // Show exactly the pixels that were decoded (same size and orientation as the scan uses).
  const shown = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  const url = URL.createObjectURL(shown ?? blob);
  return { image: ctx.getImageData(0, 0, w, h), url };
}
