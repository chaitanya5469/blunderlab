import { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { playMoveSound, type MoveSound } from '../lib/sound';
import type { Color, MoveClass } from '../lib/types';

/**
 * Plays a move sound when the board's position advances by the move in `lastMove`.
 * Stepping back one move plays the sound of the move now last on the board; jumps and new positions stay silent.
 * `own` is the colour whose moves sound as "yours" (other moves sound as the opponent's); omitted = all yours.
 * `cue` adds the great / brilliant chime (Game Review).
 */
export function useMoveSound(fen: string, lastMove: { from: string; to: string } | null | undefined, cue?: MoveClass | null, enabled = true, own?: Color | null) {
  const prev = useRef(fen);
  const latest = useRef({ lastMove, cue, enabled, own });
  /** Sound each position was reached with, so a take-back can replay the move now on the board. */
  const reached = useRef(new Map<string, MoveSound>());
  // Runs before the effect below in the same commit, so it sees this render's props.
  useEffect(() => {
    latest.current = { lastMove, cue, enabled, own };
  });
  useEffect(() => {
    const before = prev.current;
    prev.current = fen;
    const { lastMove: lm, cue: c, enabled: on, own: side } = latest.current;
    if (!on || before === fen) return;
    const kind = lm ? moveSoundFor(before, fen, lm, side) : null;
    if (kind) {
      reached.current.set(fen, kind);
      playMoveSound(kind, c);
      return;
    }
    // Stepping back one move: play the sound of the move that is now the last one on the board
    // (e.g. undoing a king's escape replays the opponent's check). No chimes; silent at the start.
    if (!undoneSoundFor(before, fen) || !lm) return;
    playMoveSound(reached.current.get(fen) ?? soundFromPosition(fen, lm, side));
  }, [fen]);
}

/**
 * Best guess at the sound of the move `lastMove` that produced `fen`, from that position alone
 * (used when it was never reached by stepping forward). Captures and promotions can't be told
 * apart from ordinary moves afterwards, so they fall back to a plain move.
 */
function soundFromPosition(fen: string, lastMove: { from: string; to: string }, own?: Color | null): MoveSound {
  try {
    const chess = new Chess(fen);
    if (chess.isCheckmate()) return 'mate';
    if (chess.inCheck()) return 'check';
    const piece = chess.get(lastMove.to as Parameters<Chess['get']>[0]);
    const fileGap = Math.abs(lastMove.from.charCodeAt(0) - lastMove.to.charCodeAt(0));
    if (piece?.type === 'k' && fileGap === 2) return 'castle';
    if (own && piece && (piece.color === 'w' ? 'white' : 'black') !== own) return 'opponent';
  } catch {
    /* fall through */
  }
  return 'move';
}

/**
 * Sound for the change `before` -> `after` when `lastMove` explains it (one legal move);
 * null otherwise (stepping back, jumps, a new position), which stays silent.
 */
function moveSoundFor(before: string, after: string, lastMove?: { from: string; to: string }, own?: Color | null): MoveSound | null {
  let chess: Chess;
  try {
    chess = new Chess(before);
  } catch {
    return null;
  }
  const [placement, turn] = after.split(' ');
  for (const m of chess.moves({ verbose: true })) {
    if (lastMove && (m.from !== lastMove.from || m.to !== lastMove.to)) continue;
    chess.move(m);
    const [p2, t2] = chess.fen().split(' ');
    if (p2 === placement && (lastMove || t2 === turn)) {
      if (chess.isCheckmate()) return 'mate';
      if (chess.inCheck()) return 'check';
      if (m.isPromotion()) return 'promote';
      if (m.isKingsideCastle() || m.isQueensideCastle()) return 'castle';
      if (m.isCapture()) return 'capture';
      return own && (m.color === 'w' ? 'white' : 'black') !== own ? 'opponent' : 'move';
    }
    chess.undo();
  }
  return null;
}


/** Sound of the move that led from `after` to `before` (i.e. what was undone), if one legal move explains it. */
function undoneSoundFor(before: string, after: string): MoveSound | null {
  return moveSoundFor(after, before);
}
