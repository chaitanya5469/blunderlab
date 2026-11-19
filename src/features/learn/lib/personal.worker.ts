import { db } from '../../../lib/db';
import type { GameRecord } from '../../../lib/types';
import type { MatchSpec, OpeningGroup, PersonalStats, TrapHits } from './personal';

/**
 * Reads every game and matches its opening moves against the lesson lines.
 * Only SAN tokens are extracted from the PGN (no board replay), so thousands of games
 * take well under a second.
 */

/** First `max` SAN moves of a PGN, without check marks or annotations. */
function sanTokens(pgn: string, max: number): string[] {
  const body = pgn
    .replace(/^\s*\[[^\]]*\]\s*$/gm, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\$\d+/g, ' ');
  const out: string[] = [];
  for (const raw of body.split(/\s+/)) {
    if (out.length >= max) break;
    const tok = raw.replace(/^\d+\.(\.\.)?/, '');
    if (!tok || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok)) continue;
    out.push(tok.replace(/[+#!?]/g, ''));
  }
  return out;
}

const commonLength = (a: string[], b: string[]) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

const TERMINAL = new Set(['Defense', 'Defence', 'Game', 'Opening', 'Gambit', 'Attack', 'System', 'Countergambit']);
const PRETTY: [RegExp, string][] = [
  [/\bQueens\b/g, "Queen's"],
  [/\bKings\b/g, "King's"],
  [/\bBishops\b/g, "Bishop's"],
  [/\bPetrovs\b/g, "Petrov's"],
  [/\bCaro Kann\b/g, 'Caro-Kann'],
  [/\bDefense\b/g, 'Defence'],
];

/** 'Sicilian Defense Alapin Variation' -> 'Sicilian Defence'. */
function familyName(game: GameRecord): string {
  const words = (game.openingName ?? '').split(' ').filter(Boolean);
  if (!words.length) return game.eco ? `ECO ${game.eco}` : 'Other openings';
  const end = words.findIndex((w) => TERMINAL.has(w));
  let name = words.slice(0, end >= 0 && end < 5 ? end + 1 : Math.min(words.length, 3)).join(' ');
  for (const [re, to] of PRETTY) name = name.replace(re, to);
  return name;
}

const RANK = { none: 0, chances: 1, dodged: 2, sprung: 3, fell: 3 } as const;
type Outcome = keyof typeof RANK;

self.onmessage = async (e: MessageEvent<MatchSpec>) => {
  const spec = e.data;
  const maxPlies = Math.max(16, ...spec.traps.flatMap((t) => t.lines.map((l) => l.keys.length)), ...spec.openings.flatMap((o) => o.prefixes.map((p) => p.length)));
  const groups = new Map<string, OpeningGroup & { lessons: Map<string, number> }>();
  const traps: Record<string, TrapHits> = {};
  let games = 0;

  await db.games.each((game) => {
    games++;
    const moves = sanTokens(game.pgn, maxPlies);
    const color = game.ownerColor;

    // Openings: group by family name; link to the lesson with the longest matching prefix.
    let lessonId: string | undefined;
    let best = 0;
    for (const o of spec.openings) {
      if (o.side !== color) continue;
      for (const p of o.prefixes) {
        if (p.length > best && commonLength(moves, p) === p.length) {
          best = p.length;
          lessonId = o.id;
        }
      }
    }
    const name = familyName(game);
    const key = `${color}|${name}`;
    const g = groups.get(key) ?? { name, color, games: 0, wins: 0, draws: 0, losses: 0, lessons: new Map<string, number>() };
    g.games++;
    if (game.result === 'win') g.wins++;
    else if (game.result === 'draw') g.draws++;
    else g.losses++;
    if (lessonId) g.lessons.set(lessonId, (g.lessons.get(lessonId) ?? 0) + 1);
    groups.set(key, g);

    // Traps: the strongest outcome over the trap's lines counts once per game.
    for (const t of spec.traps) {
      let outcome: Outcome = 'none';
      for (const line of t.lines) {
        const n = commonLength(moves, line.keys);
        const setter = color === t.side;
        let o: Outcome = 'none';
        if (n > line.mistake) o = setter ? 'sprung' : 'fell';
        // Dodged only when the game left the line on one of the owner's own moves.
        else if (n > line.bait && !setter && n % 2 === (color === 'white' ? 0 : 1)) o = 'dodged';
        else if (n === line.bait && setter) o = 'chances';
        if (RANK[o] > RANK[outcome]) outcome = o;
      }
      if (outcome === 'none') continue;
      const hits = (traps[t.id] ??= { fell: 0, sprung: 0, dodged: 0, chances: 0 });
      hits[outcome]++;
    }
  });

  const openings: OpeningGroup[] = [...groups.values()]
    .map(({ lessons, ...g }) => ({ ...g, lessonId: [...lessons].sort((a, b) => b[1] - a[1])[0]?.[0] }))
    .sort((a, b) => b.games - a.games);
  const result: PersonalStats = { games, openings, traps };
  self.postMessage(result);
};
