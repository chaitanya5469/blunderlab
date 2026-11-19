#!/usr/bin/env node
/**
 * Validates every Learn lesson under src/features/learn/content.
 *
 *   npm run validate:lessons              structure + engine checks
 *   npm run validate:lessons -- --no-engine   structure only (fast)
 *
 * Structure: replays every line with chess.js and fails on illegal, ambiguous or
 * non-canonical SAN, wrong move numbers (side to move), duplicate ids, missing
 * teaching notes and malformed trap definitions.
 *
 * Engine (Stockfish 19 NNUE, Node build from the `stockfish` package):
 * - Opening lines: the final position is within normal opening bounds for the learner
 *   (-100..+150 cp; gambit lines may be down to -175; `punishes` lines must end >= +80),
 *   and no learner move throws away more than 10 win-percent points.
 * - Trap lines: after the punishing sequence the trap-setter has a decisive advantage
 *   (>= +200 cp, the conventional "decisive" threshold) or mates; the punishing moves
 *   do not throw away more than 10 win-percent points.
 * - Decline lines ("they don't fall for it"): the setter is not badly worse (>= -150 cp)
 *   unless the trap is marked unsound, and the defender's avoiding move is sound.
 * Engine results are cached in node_modules/.cache so re-runs are quick.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { Chess } from 'chess.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src', 'features', 'learn', 'content');
const { buildLine, mistakeIndexOf, plyIndexOf, parseMovetext, LessonError } = await import(
  pathToFileURL(join(root, 'src', 'features', 'learn', 'lib', 'lines.ts')).href
);

const useEngine = !process.argv.includes('--no-engine');
const errors = [];
const flagged = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

// ---------------------------------------------------------------- load content
const lessons = [];
for (const group of ['openings', 'traps']) {
  const dir = join(contentDir, group);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts')).sort()) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const items = Array.isArray(mod.default) ? mod.default : [mod.default];
    for (const l of items) lessons.push({ ...l, file: `${group}/${file}`, group });
  }
}

// ---------------------------------------------------------------- structure
// The app only sees lessons registered in content/index.ts.
const registry = readFileSync(join(contentDir, 'index.ts'), 'utf8');
for (const { file } of lessons) {
  const spec = `'./${file.replace(/\.ts$/, '')}'`;
  if (!registry.includes(spec)) fail(file, `not imported in content/index.ts`);
}

const ids = new Map();
const resolved = [];
for (const lesson of lessons) {
  const kindOk = (lesson.group === 'openings' && lesson.kind === 'opening') || (lesson.group === 'traps' && lesson.kind === 'trap');
  if (!kindOk) fail(lesson.id, `kind "${lesson.kind}" does not belong in ${lesson.group}/`);
  if (ids.has(lesson.id)) fail(lesson.id, `duplicate lesson id (also in ${ids.get(lesson.id)})`);
  ids.set(lesson.id, lesson.file);
  const lineIds = new Set();
  for (const line of lesson.lines) {
    if (lineIds.has(line.id)) fail(`${lesson.id}/${line.id}`, 'duplicate line id');
    lineIds.add(line.id);
  }

  const built = new Map();
  for (const line of lesson.lines) {
    try {
      built.set(line.id, buildLine(lesson, line.id));
    } catch (e) {
      if (!(e instanceof LessonError)) throw e;
      fail(lesson.id, e.message.replace(`${lesson.id}: `, ''));
    }
  }
  const entry = { lesson, built, lines: [] };
  resolved.push(entry);

  for (const line of lesson.lines) {
    const plies = built.get(line.id);
    if (!plies) continue;
    const where = `${lesson.id}/${line.id}`;
    // Openings: about 6 to 12 moves. Traps: short setups, but a punishing sequence may run longer.
    const [minPly, maxPly] = lesson.kind === 'opening' ? [11, 26] : [7, 36];
    if (plies.length < minPly || plies.length > maxPly) fail(where, `${plies.length} plies; expected ${minPly} to ${maxPly}`);

    if (lesson.kind === 'opening') {
      if (line.role) fail(where, 'opening lines have no role');
      for (const p of plies) if (p.color === lesson.side && !p.note) fail(where, `learner move ${label(p)} has no teaching note`);
      entry.lines.push({ line, plies, kind: 'opening' });
      continue;
    }

    // Traps
    if (line.role !== 'trap' && line.role !== 'decline') {
      fail(where, 'trap lines need role "trap" or "decline"');
      continue;
    }
    if (line.role === 'trap') {
      const m = mistakeIndexOf(plies, lesson.side);
      if (m === undefined) fail(where, 'trap line has no victim move marked ? or ??');
      else if (m === plies.length - 1) fail(where, 'trap line ends at the mistake; add the punishing sequence');
      const marked = plies.filter((p) => p.color !== lesson.side && (p.glyph === '?' || p.glyph === '??'));
      if (marked.length > 1) fail(where, `more than one victim move marked as the mistake (${marked.map(label).join(', ')})`);
      for (const p of plies) if (p.color === lesson.side && !p.note) fail(where, `setter move ${label(p)} has no teaching note`);
      entry.lines.push({ line, plies, kind: 'trap', mistake: m });
    } else {
      const parent = lesson.lines.find((l) => l.id === line.from);
      const parentPlies = parent && built.get(parent.id);
      if (!parent || parent.role !== 'trap' || !parentPlies) {
        fail(where, 'a decline line must branch ("from") from a trap line');
        continue;
      }
      const first = parseMovetext(line.moves)[0];
      const branch = plyIndexOf(first.number.n, first.number.black);
      const m = mistakeIndexOf(parentPlies, lesson.side);
      if (branch % 2 === (lesson.side === 'white' ? 0 : 1)) fail(where, 'a decline line must branch at a move of the receiving side');
      if (m !== undefined && branch > m) fail(where, 'a decline line must branch at or before the mistake');
      for (const p of plies) if (!p.note) fail(where, `${label(p)} has no note (decline lines are also played from the defending side)`);
      entry.lines.push({ line, plies, kind: 'decline', branch });
    }
  }

  if (lesson.kind === 'opening') {
    const first = built.get(lesson.lines[0]?.id);
    if (first && (lesson.thumb < 1 || lesson.thumb > first.length)) fail(lesson.id, `thumb ${lesson.thumb} outside the first line`);
    for (const prefix of lesson.match) {
      const c = new Chess();
      try {
        for (const san of prefix.split(' ')) c.move(san);
      } catch {
        fail(lesson.id, `match prefix "${prefix}" is not a legal move sequence`);
      }
    }
    for (const k of ['ideas', 'structure', 'suits']) if (!lesson.overview?.[k]) fail(lesson.id, `overview.${k} missing`);
    if (!lesson.overview?.plans?.length) fail(lesson.id, 'overview.plans missing');
  } else {
    if (!lesson.lines.some((l) => l.role === 'trap')) fail(lesson.id, 'no trap line');
    if (!lesson.lines.some((l) => l.role === 'decline')) fail(lesson.id, 'no decline line');
    const trapLine = lesson.lines.find((l) => l.role === 'trap');
    const plies = trapLine && built.get(trapLine.id);
    if (plies) {
      const bait = plies.find((p) => label(p) === lesson.bait);
      if (!bait) fail(lesson.id, `bait ${lesson.bait} is not a move of ${trapLine.id}`);
      else if (bait.color !== lesson.side) fail(lesson.id, `bait ${lesson.bait} is not a move of the setter`);
    }
    if (!lesson.avoid) fail(lesson.id, 'avoid text missing');
  }
}

function label(p) {
  return `${p.moveNumber}${p.color === 'white' ? '.' : '...'}${p.san}`;
}

const lineCount = resolved.reduce((n, r) => n + r.lines.length, 0);
console.log(`Structure: ${lessons.length} lessons, ${lineCount} lines, ${errors.length} problems.`);

// ---------------------------------------------------------------- engine
if (useEngine && errors.length === 0) await engineChecks();

if (flagged.length) {
  console.log('\nEngine notes (informational):');
  for (const f of flagged) console.log(`  - ${f}`);
}
if (errors.length) {
  console.log('\nFAILED:');
  for (const e of errors) console.log(`  x ${e}`);
  process.exit(1);
}
console.log('\nAll lessons valid.');

async function engineChecks() {
  const SCAN_DEPTH = 14;
  const DEEP_DEPTH = 20;
  const MAX_DROP = 10;
  const engine = await createPool();
  const t0 = Date.now();
  const tasks = [];

  const pov = (score, color) => (color === 'white' ? score : -score);
  const show = (cp) => (Math.abs(cp) >= 9000 ? `mate (${cp > 0 ? 'White' : 'Black'})` : `${cp > 0 ? '+' : ''}${(cp / 100).toFixed(2)}`);

  /** Win% drop for the mover of ply p: best play before vs. after the move, confirmed at depth 20. */
  async function moveDrop(p) {
    const drop = async (d) => {
      const [before, after] = await Promise.all([engine.eval(p.fenBefore, d), engine.eval(p.fenAfter, d)]);
      return winPct(pov(before, p.color)) - winPct(pov(after, p.color));
    };
    const quick = await drop(SCAN_DEPTH);
    return quick <= MAX_DROP ? quick : drop(DEEP_DEPTH);
  }

  for (const { lesson, lines } of resolved) {
    for (const { line, plies, kind, mistake, branch } of lines) {
      const where = `${lesson.id}/${line.id}`;
      const final = plies.at(-1).fenAfter;
      tasks.push(
        (async () => {
          const white = await engine.eval(final, DEEP_DEPTH);
          const v = pov(white, lesson.side);
          if (kind === 'opening') {
            const lo = line.gambit ? -175 : -100;
            if (v < lo) fail(where, `final position ${show(white)} is too bad for the learner (${lesson.side}); bound ${lo / 100}`);
            if (!line.punishes && v > 150) fail(where, `final position ${show(white)}: learner clearly better; mark the line "punishes" if the opponent erred`);
            if (line.punishes && v < 80) fail(where, `marked "punishes" but ends only ${show(white)}`);
            if (line.gambit) flagged.push(`${where}: gambit line ends ${show(white)}`);
            const checks = plies.filter((p) => p.color === lesson.side).map(async (p) => {
              const d = await moveDrop(p);
              if (d > MAX_DROP) fail(where, `learner move ${label(p)} loses ${d.toFixed(1)} win% (engine prefers another move)`);
            });
            await Promise.all(checks);
          } else if (kind === 'trap') {
            if (v < 200) fail(where, `after the punishment the setter is only ${show(white)} (needs a decisive advantage, >= +2.00 for ${lesson.side})`);
            const before = await engine.eval(plies[mistake].fenBefore, DEEP_DEPTH);
            flagged.push(`${where}: before the mistake ${show(before)}, after the punishment ${show(white)}`);
            const checks = plies.slice(mistake + 1).filter((p) => p.color === lesson.side).map(async (p) => {
              const d = await moveDrop(p);
              if (d > MAX_DROP) fail(where, `punishing move ${label(p)} loses ${d.toFixed(1)} win%`);
            });
            await Promise.all(checks);
          } else {
            if (v < -150) {
              if (lesson.sound) fail(where, `the setter ends badly worse (${show(white)}) although the trap is marked sound`);
              else flagged.push(`${where}: unsound trap, setter ends ${show(white)} when it is declined`);
            } else flagged.push(`${where}: declined, ends ${show(white)}`);
            const avoiding = plies[branch];
            const d = await moveDrop(avoiding);
            if (d > MAX_DROP) fail(where, `the avoiding move ${label(avoiding)} loses ${d.toFixed(1)} win%`);
            const checks = plies.slice(branch + 1).filter((p) => p.color === lesson.side).map(async (p) => {
              const dd = await moveDrop(p);
              if (dd > MAX_DROP) fail(where, `setter move ${label(p)} after the decline loses ${dd.toFixed(1)} win%`);
            });
            await Promise.all(checks);
          }
        })(),
      );
    }
  }
  await Promise.all(tasks);
  engine.close();
  console.log(`Engine: ${engine.stats()} in ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
}

function winPct(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Pool of Stockfish processes with a persistent eval cache. Scores are White's point of view, mate = ±10000. */
async function createPool() {
  const require = createRequire(import.meta.url);
  const enginePath = require('stockfish').findEngine('single');
  const cacheDir = join(root, 'node_modules', '.cache', 'blunderlab-lessons');
  const cacheFile = join(cacheDir, 'evals-sf19.json');
  const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
  const inflight = new Map();
  const queue = [];
  let computed = 0;
  let hits = 0;

  const size = Math.max(1, Math.min(6, availableParallelism() - 2));
  const workers = Array.from({ length: size }, () => startWorker());
  await Promise.all(workers.map((w) => w.ready));

  function startWorker() {
    const proc = spawn(process.execPath, [enginePath], { stdio: ['pipe', 'pipe', 'inherit'] });
    let buf = '';
    let onLine = () => {};
    proc.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const lineText = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        onLine(lineText);
      }
    });
    const send = (cmd) => proc.stdin.write(`${cmd}\n`);
    const w = { proc, busy: false, send };
    w.ready = new Promise((resolve) => {
      onLine = (l) => l === 'readyok' && resolve();
      send('uci');
      send('setoption name Hash value 64');
      send('isready');
    });
    w.run = (fen, depth) =>
      new Promise((resolve) => {
        let score = 0;
        onLine = (l) => {
          const m = / score (cp|mate) (-?\d+)/.exec(l);
          if (l.startsWith('info') && m && !l.includes(' upperbound') && !l.includes(' lowerbound')) {
            score = m[1] === 'cp' ? Number(m[2]) : Math.sign(Number(m[2]) || -1) * 10000;
          }
          if (l.startsWith('bestmove')) resolve(fen.split(' ')[1] === 'w' ? score : -score);
        };
        send(`position fen ${fen}`);
        send(`go depth ${depth}`);
      });
    return w;
  }

  function pump() {
    for (const w of workers) {
      if (w.busy || !queue.length) continue;
      const job = queue.shift();
      w.busy = true;
      w.run(job.fen, job.depth).then((score) => {
        w.busy = false;
        computed++;
        cache[job.key] = score;
        job.resolve(score);
        pump();
      });
    }
  }

  return {
    eval(fen, depth) {
      const chess = new Chess(fen);
      if (chess.isCheckmate()) return Promise.resolve(chess.turn() === 'w' ? -10000 : 10000);
      if (chess.isStalemate() || chess.isInsufficientMaterial()) return Promise.resolve(0);
      const key = `${depth}|${fen}`;
      if (key in cache) {
        hits++;
        return Promise.resolve(cache[key]);
      }
      if (!inflight.has(key)) {
        inflight.set(key, new Promise((resolve) => queue.push({ key, fen, depth, resolve })));
        pump();
      }
      return inflight.get(key);
    },
    close() {
      for (const w of workers) {
        w.send('quit');
        w.proc.kill();
      }
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify(cache));
    },
    stats: () => `${computed} positions analysed, ${hits} cached`,
  };
}
