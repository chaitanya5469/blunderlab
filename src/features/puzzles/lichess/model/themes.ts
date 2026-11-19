/** Lichess tags about length rather than the idea; not shown. */
const HIDDEN = new Set(['short', 'long', 'veryLong', 'oneMove', 'master', 'masterVsMaster', 'superGM']);

const NAMED: Record<string, string> = {
  advantage: 'Advantage',
  crushing: 'Crushing',
  equality: 'Equality',
  attackingF2F7: 'Attacking f2/f7',
  enPassant: 'En passant',
  xRayAttack: 'X-ray',
  kingsideAttack: 'Kingside attack',
  queensideAttack: 'Queenside attack',
  queenRookEndgame: 'Queen & rook endgame',
};

/** Lichess theme key -> label: 'mateIn2' -> 'Mate in 2', 'backRankMate' -> 'Back rank mate'. */
export function themeLabel(key: string): string {
  if (NAMED[key]) return NAMED[key];
  const mate = /^mateIn(\d)$/.exec(key);
  if (mate) return `Mate in ${mate[1]}`;
  const words = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The themes worth showing, most specific first (motifs before phase and evaluation tags). */
export function visibleThemes(themes: string[], max = 3): string[] {
  const broad = new Set(['opening', 'middlegame', 'endgame', 'advantage', 'crushing', 'equality', 'mate']);
  const shown = themes.filter((t) => !HIDDEN.has(t));
  return [...shown.filter((t) => !broad.has(t)), ...shown.filter((t) => broad.has(t))].slice(0, max);
}
