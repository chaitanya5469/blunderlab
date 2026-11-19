/// <reference lib="webworker" />
import { forward, loadModel, type Model } from './cnn';
import { rasterFromImageData, type Quad, type Raster } from './geometry';
import { locateBoard } from './localize';
import { photoTiles, screenTiles } from './tiles';

/**
 * Recognition off the main thread: board localisation, tile extraction and the square classifier.
 * Messages carry an id; replies echo it.
 */
export type ScanMode = 'screen' | 'photo';

export type WorkerRequest =
  | { id: number; type: 'image'; image: ImageData }
  | { id: number; type: 'locate' }
  | { id: number; type: 'classify'; quad: Quad; mode: ScanMode; modelBase: string };

export type WorkerReply =
  | { id: number; ok: true; type: 'image' }
  | { id: number; ok: true; type: 'locate'; quad: Quad | null }
  | { id: number; ok: true; type: 'classify'; probs: Float32Array; classes: string[]; unsureBelow: number }
  | { id: number; ok: false; error: string };

let raster: Raster | null = null;
const models = new Map<string, Promise<Model>>();

const model = (base: string) => {
  let m = models.get(base);
  if (!m) {
    m = loadModel(base);
    models.set(base, m);
    m.catch(() => models.delete(base));
  }
  return m;
};

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  const reply = (r: WorkerReply, transfer: Transferable[] = []) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(r, transfer);
  try {
    if (req.type === 'image') {
      raster = rasterFromImageData(req.image);
      return reply({ id: req.id, ok: true, type: 'image' });
    }
    if (!raster) throw new Error('No image loaded');
    if (req.type === 'locate') {
      return reply({ id: req.id, ok: true, type: 'locate', quad: locateBoard(raster)?.quad ?? null });
    }
    const m = await model(req.modelBase);
    const tiles = req.mode === 'photo' ? photoTiles(raster, req.quad) : screenTiles(raster, req.quad);
    const n = m.manifest.classes.length;
    const probs = new Float32Array(64 * n);
    forward(m, tiles).forEach((p, i) => probs.set(p, i * n));
    reply({ id: req.id, ok: true, type: 'classify', probs, classes: m.manifest.classes, unsureBelow: m.manifest.unsure_below ?? 0.85 }, [probs.buffer]);
  } catch (err) {
    reply({ id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
