import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { playSound } from '../../../lib/sound';
import type { Puzzle } from '../../../lib/types';
import type { AttemptInput } from '../model/schedule';

/**
 * What the solver needs from a puzzle. The owner's puzzles fit as they are; Lichess puzzles are
 * converted (see lichess/model/solvable.ts). `played` is the move from the owner's game, if any.
 */
export type SolvablePuzzle = Pick<Puzzle, 'fen' | 'lastMove' | 'steps'> & { played?: { uci: string } };

export type SolvePhase = 'play' | 'wrong' | 'reply' | 'solved' | 'revealing' | 'revealed';

export type Feedback =
  | { kind: 'start' }
  | { kind: 'wrong'; san: string; wasPlayed: boolean }
  | { kind: 'good'; san: string }
  | { kind: 'solved'; san: string; clean: boolean }
  | { kind: 'revealed' };

export interface LastMove {
  from: string;
  to: string;
}

export interface SolverState {
  /** Position on the board. */
  fen: string;
  /** Position at the start of the current step (owner to move). */
  stepFen: string;
  step: number;
  phase: SolvePhase;
  lastMove: LastMove | null;
  stepLastMove: LastMove | null;
  /** Square tinted after a move: correct or wrong. */
  flash: { square: string; tone: 'good' | 'bad' } | null;
  feedback: Feedback;
  wrongMoves: number;
  /** 0 none, 1 piece shown, 2 piece and square shown (for the current step). */
  hintLevel: 0 | 1 | 2;
  hints: number;
}

/** Delays (ms) that pace the board: wrong move shown before it is taken back, opponent reply, solution replay. */
const WRONG_RESET_MS = 850;
const REPLY_MS = 520;
const REVEAL_STEP_MS = 700;

const toMove = (uci: string): LastMove => ({ from: uci.slice(0, 2), to: uci.slice(2, 4) });

function play(fen: string, uci: string) {
  const chess = new Chess(fen);
  const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  return { fen: chess.fen(), san: m.san };
}

function initial(puzzle: SolvablePuzzle): SolverState {
  const last = puzzle.lastMove ? toMove(puzzle.lastMove) : null;
  return {
    fen: puzzle.fen,
    stepFen: puzzle.fen,
    step: 0,
    phase: 'play',
    lastMove: last,
    stepLastMove: last,
    flash: null,
    feedback: { kind: 'start' },
    wrongMoves: 0,
    hintLevel: 0,
    hints: 0,
  };
}

/**
 * Puzzle state machine. The owner plays a move; an accepted move either finishes the puzzle
 * (last step, or an accepted alternative to the main line) or triggers the opponent's reply;
 * any other move is shown briefly, then taken back. `onFinish` fires exactly once.
 */
export function usePuzzleSolver(puzzle: SolvablePuzzle, onFinish: (attempt: AttemptInput) => void) {
  const [state, setState] = useState(() => initial(puzzle));
  // The source of truth, updated synchronously so two quick inputs cannot both act on a stale phase.
  const ref = useRef(state);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const update = useCallback((fn: (s: SolverState) => SolverState) => {
    ref.current = fn(ref.current);
    setState(ref.current);
  }, []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const finish = (revealed: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const { wrongMoves, hints } = ref.current;
    onFinish({ result: revealed ? 'failed' : wrongMoves || hints ? 'assisted' : 'solved', wrongMoves, hints });
  };

  const move = (uci: string) => {
    const s = ref.current;
    if (s.phase !== 'play') return;
    const step = puzzle.steps[s.step]!;
    const r = play(s.stepFen, uci);
    const lastMove = toMove(uci);

    if (!step.accepted.includes(uci)) {
      update(() => ({
        ...s,
        fen: r.fen,
        lastMove,
        phase: 'wrong',
        flash: { square: lastMove.to, tone: 'bad' },
        feedback: { kind: 'wrong', san: r.san, wasPlayed: s.step === 0 && uci === puzzle.played?.uci },
        wrongMoves: s.wrongMoves + 1,
      }));
      playSound('puzzle-wrong', 0.12);
      later(WRONG_RESET_MS, () =>
        update((cur) => (cur.phase === 'wrong' ? { ...cur, fen: cur.stepFen, lastMove: cur.stepLastMove, flash: null, phase: 'play' } : cur)),
      );
      return;
    }

    const flash = { square: lastMove.to, tone: 'good' } as const;
    // An accepted alternative to the main move also finishes the puzzle.
    if (s.step === puzzle.steps.length - 1 || uci !== step.accepted[0] || !step.reply) {
      update(() => ({ ...s, fen: r.fen, lastMove, flash, phase: 'solved', hintLevel: 0, feedback: { kind: 'solved', san: r.san, clean: !s.wrongMoves && !s.hints } }));
      playSound('puzzle-correct-2', 0.12);
      finish(false);
      return;
    }

    update(() => ({ ...s, fen: r.fen, lastMove, flash, phase: 'reply', hintLevel: 0, feedback: { kind: 'good', san: r.san } }));
    const reply = step.reply;
    const after = play(r.fen, reply);
    later(REPLY_MS, () =>
      update((cur) => ({
        ...cur,
        fen: after.fen,
        stepFen: after.fen,
        step: cur.step + 1,
        lastMove: toMove(reply),
        stepLastMove: toMove(reply),
        flash: null,
        phase: 'play',
      })),
    );
  };

  const hint = () => update((s) => (s.phase !== 'play' || s.hintLevel === 2 ? s : { ...s, hintLevel: (s.hintLevel + 1) as 1 | 2, hints: s.hints + 1 }));

  /** Plays the rest of the main line on the board and marks the attempt as failed. */
  const reveal = () => {
    const s = ref.current;
    if (s.phase !== 'play' && s.phase !== 'wrong') return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const line = puzzle.steps.slice(s.step).flatMap((st) => (st.reply ? [st.accepted[0]!, st.reply] : [st.accepted[0]!]));
    update(() => ({ ...s, fen: s.stepFen, lastMove: s.stepLastMove, flash: null, phase: 'revealing', feedback: { kind: 'revealed' }, hintLevel: 0 }));
    playSound('puzzle-wrong');
    finish(true);
    let fen = s.stepFen;
    line.forEach((uci, i) => {
      const r = play(fen, uci);
      fen = r.fen;
      later(REVEAL_STEP_MS * (i + 1) - 350, () =>
        update((cur) => ({
          ...cur,
          fen: r.fen,
          lastMove: toMove(uci),
          flash: i % 2 === 0 ? { square: uci.slice(2, 4), tone: 'good' } : null,
          phase: i === line.length - 1 ? 'revealed' : 'revealing',
        })),
      );
    });
  };

  const main = puzzle.steps[state.step]?.accepted[0];
  const hintSquares = main && state.phase === 'play' && state.hintLevel > 0 ? { from: main.slice(0, 2), to: state.hintLevel === 2 ? main.slice(2, 4) : null } : null;

  return { state, move, hint, reveal, hintSquares };
}
