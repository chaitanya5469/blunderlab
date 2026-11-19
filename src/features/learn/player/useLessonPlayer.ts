import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { recordActivity } from '../../../lib/activity';
import type { Playable } from '../types';
import type { SquarePair } from '../board/LessonBoard';
import { recordRun, touch, type LineProgress, type Mode } from '../lib/progress';

export type Phase = 'auto' | 'input' | 'wrong' | 'done';

export interface PlayerState {
  /** Plies played so far; `plies[index]` is the next move. */
  index: number;
  fen: string;
  lastMove: SquarePair | null;
  phase: Phase;
  flash: { square: string; tone: 'good' | 'bad' } | null;
  /** The learner's last wrong try at the current move. */
  wrong: { san: string } | null;
  mistakes: number;
  hints: number;
  /** Practice hints for the current move: 1 shows the piece and the idea, 2 adds the arrow. */
  hintLevel: 0 | 1 | 2;
  /** Stored progress once the run is finished. */
  result: LineProgress | null;
}

/** Pacing (ms): first automatic move, opponent replies, and how long a wrong move stays on the board. */
const FIRST_MS = 500;
const REPLY_MS = 700;
const WRONG_MS = 800;

const squares = (uci: string): SquarePair => ({ from: uci.slice(0, 2), to: uci.slice(2, 4) });

function initial(playable: Playable): PlayerState {
  return {
    index: 0,
    fen: playable.plies[0]!.fenBefore,
    lastMove: null,
    phase: playable.plies[0]!.color === playable.learner ? 'input' : 'auto',
    flash: null,
    wrong: null,
    mistakes: 0,
    hints: 0,
    hintLevel: 0,
    result: null,
  };
}

/**
 * Plays one lesson line. The opponent's moves play themselves; the learner must find each of
 * their own moves (guided by an arrow in Learn mode, from memory in Practice). A wrong move is
 * shown briefly, then taken back. The finished run is stored exactly once.
 */
export function useLessonPlayer(lessonId: string, playable: Playable, mode: Mode) {
  const [state, setState] = useState(() => initial(playable));
  const ref = useRef(state);
  const timers = useRef<number[]>([]);

  const update = useCallback((fn: (s: PlayerState) => PlayerState) => {
    ref.current = fn(ref.current);
    setState(ref.current);
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Moves on to ply `index`: finish, auto-play the opponent, or wait for the learner. */
  const advance = useCallback(
    (index: number, delay: number) => {
      const { plies, learner } = playable;
      if (index >= plies.length) {
        const s = ref.current;
        const result = recordRun(lessonId, playable.key, mode, s.mistakes === 0 && s.hints === 0);
        // Every finished line counts as lesson activity (first play and later reviews alike) for streaks.
        recordActivity('lesson', 'completed', `${lessonId}/${playable.key}`).catch((e) => console.warn('Activity log failed', e));
        update((cur) => ({ ...cur, phase: 'done', result }));
        return;
      }
      const ply = plies[index]!;
      if (ply.color === learner) {
        update((cur) => ({ ...cur, index, phase: 'input' }));
        return;
      }
      update((cur) => ({ ...cur, index, phase: 'auto' }));
      later(delay, () => {
        update((cur) => ({ ...cur, fen: ply.fenAfter, lastMove: squares(ply.uci), flash: null, index: index + 1 }));
        advance(index + 1, REPLY_MS);
      });
    },
    [playable, lessonId, mode, update, later],
  );

  const start = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    update(() => initial(playable));
    touch(lessonId, playable.key, mode);
    advance(0, FIRST_MS);
  }, [playable, lessonId, mode, update, advance]);

  useEffect(() => {
    start();
    return () => timers.current.forEach(clearTimeout);
  }, [start]);

  const move = (uci: string) => {
    const s = ref.current;
    if (s.phase !== 'input') return;
    const ply = playable.plies[s.index]!;
    if (uci === ply.uci) {
      update(() => ({
        ...s,
        fen: ply.fenAfter,
        lastMove: squares(uci),
        flash: { square: ply.to, tone: 'good' },
        wrong: null,
        hintLevel: 0,
        index: s.index + 1,
      }));
      advance(s.index + 1, REPLY_MS);
      return;
    }
    const chess = new Chess(s.fen);
    const san = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
    const before = { fen: s.fen, lastMove: s.lastMove };
    update(() => ({
      ...s,
      fen: chess.fen(),
      lastMove: squares(uci),
      flash: { square: uci.slice(2, 4), tone: 'bad' },
      phase: 'wrong',
      wrong: { san },
      mistakes: s.mistakes + 1,
    }));
    later(WRONG_MS, () => update((cur) => (cur.phase === 'wrong' ? { ...cur, ...before, flash: null, phase: 'input' } : cur)));
  };

  const hint = () =>
    update((s) => (s.phase !== 'input' || s.hintLevel === 2 ? s : { ...s, hintLevel: (s.hintLevel + 1) as 1 | 2, hints: s.hints + 1 }));

  return { state, move, hint, restart: start };
}
