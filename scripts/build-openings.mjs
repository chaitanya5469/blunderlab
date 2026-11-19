#!/usr/bin/env node
/**
 * Builds the bundled opening book (src/lib/book/positions.json) from the lichess-org/chess-openings
 * TSVs (CC0, https://github.com/lichess-org/chess-openings): a.tsv … e.tsv, columns eco, name, pgn.
 *
 *   node scripts/build-openings.mjs <dir containing a.tsv … e.tsv>
 *
 * Every position reached along every named line counts as opening theory. A position is keyed by
 * the first three FEN fields (pieces, side to move, castling rights) as chess.js writes them; the
 * en-passant field and the move counters are dropped, so transpositions match. Each key is hashed
 * to 32 bits (FNV-1a) and the sorted, de-duplicated hashes are stored as one base64 string of
 * little-endian uint32s. With ~10k positions a random position collides with probability ~1e-6,
 * and a collision only matters while every earlier move of the game was book too.
 * The hash must stay identical to `bookKey`/`fnv1a` in src/lib/book.ts.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/build-openings.mjs <dir with a.tsv … e.tsv>');
  process.exit(1);
}
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'book', 'positions.json');

function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}
const key = (fen) => fen.split(' ').slice(0, 3).join(' ');

const hashes = new Set();
const keys = new Set();
let lines = 0;
for (const f of ['a', 'b', 'c', 'd', 'e']) {
  const rows = readFileSync(join(dir, `${f}.tsv`), 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  for (const row of rows) {
    const [eco, name, pgn] = row.split('\t');
    if (!eco || !name || !pgn) throw new Error(`Malformed row in ${f}.tsv: ${row}`);
    const chess = new Chess();
    const sans = pgn.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/);
    for (const san of sans) {
      chess.move(san); // throws on an illegal move: the data must replay cleanly
      const k = key(chess.fen());
      keys.add(k);
      hashes.add(fnv1a(k));
    }
    lines++;
  }
}
if (hashes.size !== keys.size) console.warn(`Note: ${keys.size - hashes.size} hash collision(s) inside the book itself.`);
const sorted = Uint32Array.from([...hashes].sort((a, b) => a - b));
const b64 = Buffer.from(sorted.buffer).toString('base64');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({
    source: 'lichess-org/chess-openings (CC0)',
    lines,
    positions: sorted.length,
    hashes: b64,
  }) + '\n',
);
console.log(`${lines} opening lines → ${sorted.length} positions → ${out} (${b64.length} bytes of base64)`);
