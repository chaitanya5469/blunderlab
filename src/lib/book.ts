/**
 * Opening book: positions from the lichess-org/chess-openings list (CC0), built by
 * `scripts/build-openings.mjs` into book/positions.json (32-bit hashes of FEN pieces + side +
 * castling). Loaded lazily, so it stays out of the main bundle.
 *
 * A move is Book when the position after it is in the book and every earlier move of the game
 * (or line) was Book too.
 */

export interface OpeningBook {
  has(fen: string): boolean;
}

/** Same hash as the build script. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export const bookKey = (fen: string) => fen.split(' ').slice(0, 3).join(' ');

let loaded: OpeningBook | null = null;
let loading: Promise<OpeningBook> | null = null;

export function loadBook(): Promise<OpeningBook> {
  if (loaded) return Promise.resolve(loaded);
  loading ??= import('./book/positions.json').then((m) => {
    const bin = atob(m.default.hashes);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const view = new DataView(bytes.buffer);
    const hashes = new Uint32Array(bytes.length / 4);
    for (let i = 0; i < hashes.length; i++) hashes[i] = view.getUint32(i * 4, true);
    const has = (fen: string) => {
      const h = fnv1a(bookKey(fen));
      let lo = 0;
      let hi = hashes.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const v = hashes[mid]!;
        if (v === h) return true;
        if (v < h) lo = mid + 1;
        else hi = mid - 1;
      }
      return false;
    };
    loaded = { has };
    return loaded;
  });
  return loading;
}

/** The book if it has finished loading (for synchronous UI code), else null. */
export const bookIfLoaded = (): OpeningBook | null => loaded;

/** Book flags for a game's moves in order: true while every move so far lands in the book. */
export function bookFlags(fensAfter: string[], book: OpeningBook): boolean[] {
  let inBook = true;
  return fensAfter.map((fen) => (inBook = inBook && book.has(fen)));
}
