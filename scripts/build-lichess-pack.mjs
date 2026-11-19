#!/usr/bin/env node
/**
 * Builds the bundled Lichess puzzle pack (src/features/puzzles/lichess/data/pack.json) from the
 * official Lichess puzzle database (CC0, https://database.lichess.org/#puzzles).
 *
 *   node scripts/build-lichess-pack.mjs <puzzles.csv | puzzles.parquet> [more files…]
 *
 * Inputs: the decompressed `lichess_db_puzzle.csv` from database.lichess.org, or one or more
 * Parquet shards of the same data that Lichess publishes at
 * https://huggingface.co/datasets/Lichess/chess-puzzles (data/train-*.parquet). One shard
 * (~2M puzzles) is more than enough to fill every band.
 *
 * Selection, per 100-point rating band from 400 to 2900:
 * - well-established puzzles only: RatingDeviation <= 80, NbPlays >= 300 (relaxed in the
 *   sparse bands at both ends), Popularity >= 80;
 * - every move replays legally with chess.js;
 * - a deterministic pseudo-random order (hash of the id), then round-robin over each
 *   puzzle's main motif so a band is not all "crushing" or all "mateIn1";
 * - PER_BAND puzzles per band.
 *
 * Output row: [id, fen, moves, rating, themeIndexes[]] sorted by rating. `fen` is the position
 * before the opponent's set-up move; `moves` is that move followed by the solution (UCI).
 */
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';

const PER_BAND = 160;
const MIN_RATING = 400;
const MAX_RATING = 2900; // exclusive
const BAND = 100;

/** Tags that describe length or phase rather than the idea; not used to balance motifs. */
const GENERIC = new Set(['short', 'long', 'veryLong', 'oneMove', 'opening', 'middlegame', 'endgame', 'advantage', 'crushing', 'equality', 'master', 'masterVsMaster', 'superGM', 'mate']);

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'features', 'puzzles', 'lichess', 'data', 'pack.json');
const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Usage: node scripts/build-lichess-pack.mjs <lichess_db_puzzle.csv | train-*.parquet> [...]');
  process.exit(1);
}

/** FNV-1a, for a stable shuffle that does not change between runs. */
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

const bands = new Map(); // bandStart -> candidate[]
let seen = 0;

function consider(row) {
  seen++;
  const rating = Number(row.Rating);
  if (!(rating >= MIN_RATING && rating < MAX_RATING)) return;
  const edge = rating < 700 || rating >= 2600;
  if (Number(row.RatingDeviation) > 80) return;
  if (Number(row.NbPlays) < (edge ? 100 : 300)) return;
  if (Number(row.Popularity) < (edge ? 70 : 80)) return;
  const moves = String(row.Moves).trim();
  const n = moves.split(' ').length;
  if (n < 2 || n > 12) return;
  const themes = Array.isArray(row.Themes) ? row.Themes : String(row.Themes ?? '').split(' ').filter(Boolean);
  const band = Math.floor(rating / BAND) * BAND;
  const list = bands.get(band) ?? [];
  // Keep a bounded, deterministic sample per band so memory stays flat on the full CSV.
  list.push({ id: String(row.PuzzleId), fen: String(row.FEN), moves, rating, themes, h: hash(String(row.PuzzleId)) });
  if (list.length > PER_BAND * 40) {
    list.sort((a, b) => a.h - b.h);
    list.length = PER_BAND * 20;
  }
  bands.set(band, list);
}

async function readCsv(path) {
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let header = null;
  for await (const line of rl) {
    const cells = line.split(',');
    if (!header) {
      header = cells;
      continue;
    }
    const row = {};
    header.forEach((k, i) => (row[k] = cells[i]));
    consider(row);
  }
}

async function readParquet(path) {
  const { asyncBufferFromFile, parquetMetadataAsync, parquetReadObjects } = await import('hyparquet');
  const file = await asyncBufferFromFile(path);
  const meta = await parquetMetadataAsync(file);
  const columns = ['PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation', 'Popularity', 'NbPlays', 'Themes'];
  let start = 0;
  for (const rg of meta.row_groups) {
    const end = start + Number(rg.num_rows);
    const rows = await parquetReadObjects({ file, metadata: meta, columns, rowStart: start, rowEnd: end });
    for (const r of rows) consider(r);
    console.log(`  rows ${start}-${end}`);
    start = end;
  }
}

function valid(p) {
  try {
    const chess = new Chess(p.fen);
    for (const uci of p.moves.split(' ')) chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return true;
  } catch {
    return false;
  }
}

for (const path of inputs) {
  console.log(`Reading ${path}`);
  if (path.endsWith('.parquet')) await readParquet(path);
  else await readCsv(path);
}

const themeIndex = new Map();
const themeOf = (t) => {
  if (!themeIndex.has(t)) themeIndex.set(t, themeIndex.size);
  return themeIndex.get(t);
};

const picked = [];
const report = [];
for (const band of [...bands.keys()].sort((a, b) => a - b)) {
  const list = bands.get(band).sort((a, b) => a.h - b.h);
  // Group by main motif, then take one from each group in turn.
  const groups = new Map();
  for (const p of list) {
    const motif = p.themes.find((t) => !GENERIC.has(t)) ?? p.themes.find((t) => t.startsWith('mateIn')) ?? 'other';
    const g = groups.get(motif) ?? [];
    g.push(p);
    groups.set(motif, g);
  }
  const queues = [...groups.values()];
  const chosen = [];
  while (chosen.length < PER_BAND && queues.some((q) => q.length)) {
    for (const q of queues) {
      const p = q.shift();
      if (p && valid(p)) chosen.push(p);
      if (chosen.length >= PER_BAND) break;
    }
  }
  report.push(`${band}-${band + BAND - 1}: ${chosen.length}`);
  picked.push(...chosen);
}

picked.sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id));
const pack = {
  v: 1,
  source: 'Lichess puzzle database (https://database.lichess.org/#puzzles), CC0 1.0',
  generatedAt: new Date().toISOString().slice(0, 10),
  themes: [],
  puzzles: picked.map((p) => [p.id, p.fen, p.moves, p.rating, p.themes.map(themeOf)]),
};
pack.themes = [...themeIndex.keys()];

mkdirSync(dirname(out), { recursive: true });
const json = JSON.stringify(pack);
writeFileSync(out, json);
console.log(`Scanned ${seen.toLocaleString()} puzzles.`);
console.log(report.join('\n'));
console.log(`Wrote ${picked.length} puzzles, ${(json.length / 1024).toFixed(0)} KB -> ${out}`);
