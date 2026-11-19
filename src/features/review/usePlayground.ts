import { useCallback, useState } from 'react';
import type { ParsedPly } from '../../lib/types';
import { makeMove, type Variation } from './variation';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export interface Playground {
  /** Game ply on screen; inside a variation, the ply it branched from. */
  ply: number;
  variation: Variation | null;
  /** Variation moves applied on screen (0 = the branch point). */
  vIndex: number;
  fen: string;
  lastMove: { from: string; to: string } | null;
  canPrev: boolean;
  canNext: boolean;
  atStart: boolean;
  atEnd: boolean;
  /** Plays a move from the position on screen (follows the game when it is the game's move). */
  play: (uci: string) => void;
  /** Starts a variation after `base` game plies with `uci` (e.g. "Try best move"). */
  tryFrom: (base: number, uci: string) => void;
  /** Leaves any variation and shows game ply `p`. */
  goGame: (p: number) => void;
  /** Within the variation: shows the position after `i` of its moves. */
  goVar: (i: number) => void;
  exit: () => void;
  first: () => void;
  prev: () => void;
  next: () => void;
  last: () => void;
}

/**
 * Review navigation plus a single in-memory variation. Nothing here is persisted:
 * leaving the screen discards the variation.
 */
export function usePlayground(plies: ParsedPly[], initialPly: number): Playground {
  const [ply, setPly] = useState(initialPly);
  const [variation, setVariation] = useState<Variation | null>(null);
  const [vIndex, setVIndex] = useState(0);
  const total = plies.length;

  const gameFen = useCallback((p: number) => (p > 0 ? plies[p - 1]?.fenAfter : plies[0]?.fenBefore) ?? START_FEN, [plies]);
  const clamp = useCallback((p: number) => Math.max(0, Math.min(total, p)), [total]);

  const goGame = useCallback(
    (p: number) => {
      setVariation(null);
      setVIndex(0);
      setPly(clamp(p));
    },
    [clamp],
  );

  const tryFrom = useCallback(
    (base: number, uci: string) => {
      const m = makeMove(gameFen(base), uci);
      if (!m) return;
      setPly(base);
      setVariation({ base, moves: [m] });
      setVIndex(1);
    },
    [gameFen],
  );

  const onVar = variation !== null;
  const fen = onVar && vIndex > 0 ? variation.moves[vIndex - 1]!.fenAfter : gameFen(ply);
  const shownMove = onVar && vIndex > 0 ? variation.moves[vIndex - 1] : ply > 0 ? plies[ply - 1] : undefined;
  const lastMove = shownMove ? { from: shownMove.from, to: shownMove.to } : null;

  const play = (uci: string) => {
    const m = makeMove(fen, uci);
    if (!m) return;
    // At a game position (on the game line or the variation's branch point): the game's own move just follows the game.
    if (!onVar || vIndex === 0) {
      const gameMove = plies[ply];
      if (gameMove && gameMove.uci === m.uci) return goGame(ply + 1);
      setVariation({ base: ply, moves: [m] });
      setVIndex(1);
      return;
    }
    if (variation.moves[vIndex]?.uci === m.uci) {
      setVIndex(vIndex + 1);
      return;
    }
    setVariation({ base: variation.base, moves: [...variation.moves.slice(0, vIndex), m] });
    setVIndex(vIndex + 1);
  };

  const len = variation?.moves.length ?? 0;
  return {
    ply,
    variation,
    vIndex,
    fen,
    lastMove,
    canPrev: onVar || ply > 0,
    canNext: onVar ? vIndex < len : ply < total,
    atStart: onVar ? vIndex === 0 : ply === 0,
    atEnd: onVar ? vIndex >= len : ply >= total,
    play,
    tryFrom,
    goGame,
    goVar: (i: number) => setVIndex(Math.max(0, Math.min(len, i))),
    exit: () => goGame(ply),
    first: () => (onVar ? setVIndex(0) : setPly(0)),
    // Stepping back past the branch point leaves the variation and keeps walking back through the game.
    prev: () => (onVar ? (vIndex > 0 ? setVIndex(vIndex - 1) : goGame(ply - 1)) : setPly(clamp(ply - 1))),
    next: () => (onVar ? setVIndex(Math.min(len, vIndex + 1)) : setPly(clamp(ply + 1))),
    last: () => (onVar ? setVIndex(len) : setPly(total)),
  };
}
