import type { SolverState } from '../puzzles/solve/usePuzzleSolver';
import { CoachBubble } from './CoachBubble';
import { puzzleLine, useCoach, type PuzzleMoment, type PuzzleTheme } from './engine';

interface PuzzleCoachProps {
  /** Stable id of the puzzle, e.g. its id with a source prefix. */
  puzzleKey: string;
  state: SolverState;
  theme: PuzzleTheme;
  /** The move from the owner's game (own puzzles), for "you played this before". */
  played?: string;
  className?: string;
}

/** The coach's line for the puzzle's current moment: a motif hint at the start (never the move), then wrong / solved / revealed. */
export function PuzzleCoach({ puzzleKey, state, theme, played, className }: PuzzleCoachProps) {
  const coach = useCoach();
  if (!coach) return null;
  const { feedback } = state;
  let moment: PuzzleMoment = 'start';
  let key = `${puzzleKey}:start`;
  if (feedback.kind === 'wrong') {
    moment = feedback.wasPlayed && played ? 'wrongPlayed' : 'wrong';
    key = `${puzzleKey}:wrong:${state.wrongMoves}`;
  } else if (feedback.kind === 'solved') {
    moment = feedback.clean ? 'solved' : 'assisted';
    key = `${puzzleKey}:${moment}`;
  } else if (feedback.kind === 'revealed') {
    moment = 'revealed';
    key = `${puzzleKey}:revealed`;
  }
  const line = puzzleLine(coach, moment, key, theme, played);
  return line ? <CoachBubble coach={coach} line={line} className={className} /> : null;
}
