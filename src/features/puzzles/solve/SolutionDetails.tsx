import { useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { ClassMarker } from '../../../components/chess/ClassMarker';
import { Badge, Card } from '../../../components/ui';
import { capitalize } from '../../../lib/format';
import { MOVE_CLASS_META } from '../../../lib/moveClass';
import { uciLineToSan } from '../../../lib/pgn';
import type { Puzzle } from '../../../lib/types';
import { formatScoreFor, motifLabel, movePrefix, numberLine, PHASE_LABEL } from '../model/labels';

/** Played move vs best move, the refutation, the eval swing, tags and a way into Game Review. */
export function SolutionDetails({ puzzle }: { puzzle: Puzzle }) {
  const owner = puzzle.ownerColor;
  const opponent = owner === 'white' ? 'black' : 'white';
  const solution = useMemo(() => {
    const line = puzzle.steps.flatMap((s) => (s.reply ? [s.accepted[0]!, s.reply] : [s.accepted[0]!]));
    return uciLineToSan(puzzle.fen, line, line.length);
  }, [puzzle]);
  // The refutation starts with the opponent's reply to the played move.
  const refutation = puzzle.refutation.length
    ? numberLine(puzzle.refutation, owner === 'white' ? puzzle.moveNumber : puzzle.moveNumber + 1, opponent)
    : null;
  const swing = Math.round(puzzle.winBest - puzzle.winPlayed);
  const meta = MOVE_CLASS_META[puzzle.source];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-control bg-best/8 px-3 py-2.5">
            <p className="text-2xs font-medium text-fg-subtle">Best</p>
            <p className="mt-0.5 truncate font-display text-lg font-semibold text-best">{movePrefix(puzzle.moveNumber, owner)}
              {solution[0]}
            </p>
            <p className="text-xs text-fg-muted tnum">{formatScoreFor(puzzle.evalBest, owner)}</p>
          </div>
          <div className="min-w-0 rounded-control bg-surface-2 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-2xs font-medium text-fg-subtle">
              You played <ClassMarker cls={puzzle.source} className="size-3.5 text-[0.5rem]" />
            </p>
            <p className={`mt-0.5 truncate font-display text-lg font-semibold ${meta.textClass}`}>
              {movePrefix(puzzle.moveNumber, owner)}
              {puzzle.played.san}
            </p>
            <p className="text-xs text-fg-muted tnum">{formatScoreFor(puzzle.evalPlayed, owner)}</p>
          </div>
        </div>

        <SwingMeter best={puzzle.winBest} played={puzzle.winPlayed} />
        <p className="-mt-2 text-xs text-fg-muted">
          Your winning chances went from <span className="font-semibold text-fg tnum">{Math.round(puzzle.winBest)}%</span> to{' '}
          <span className="font-semibold text-fg tnum">{Math.round(puzzle.winPlayed)}%</span>
          {swing > 0 && <span className={meta.textClass}> (−{swing})</span>}.
        </p>

        <div className="space-y-2.5 text-sm">
          <Line label="Solution" text={numberLine(solution, puzzle.moveNumber, owner)} />
          {refutation && <Line label={`Why ${puzzle.played.san} fails`} text={refutation} />}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone={puzzle.source}>{meta.label}</Badge>
          {puzzle.motifs.map((m) => (
            <Badge key={m} tone="accent">
              {motifLabel(m, puzzle)}
            </Badge>
          ))}
          <Badge>{PHASE_LABEL[puzzle.phase]}</Badge>
          <Badge>{capitalize(puzzle.timeClass)}</Badge>
        </div>

        <Link
          to={`/games/${encodeURIComponent(puzzle.gameId)}/review?ply=${puzzle.ply}`}
          className="-mx-1 -mb-1 flex h-11 items-center justify-between rounded-control px-1 text-sm font-medium text-accent-strong transition-colors hover:bg-surface-2"
        >
          Open move {puzzle.moveNumber} in Game Review
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </Card>
    </motion.div>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-fg-subtle">{label}</p>
      <p className="mt-0.5 font-medium text-fg tnum">{text}</p>
    </div>
  );
}

/** Owner win% for best play (green) and after the played move (class colour) on one track. */
function SwingMeter({ best, played }: { best: number; played: number }) {
  const lo = Math.min(best, played);
  const hi = Math.max(best, played);
  return (
    <div className="relative h-2.5 rounded-full bg-surface-3" role="img" aria-label={`Win chance ${Math.round(best)}% with best play, ${Math.round(played)}% after your move`}>
      <motion.div
        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-blunder/70 to-best/70"
        initial={{ left: `${hi}%`, right: `${100 - hi}%` }}
        animate={{ left: `${lo}%`, right: `${100 - hi}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      />
      <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-best ring-2 ring-surface-1" style={{ left: `${best}%` }} />
      <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blunder ring-2 ring-surface-1" style={{ left: `${played}%` }} />
      <span className="absolute top-1/2 left-1/2 h-4 w-px -translate-y-1/2 bg-fg-subtle/50" aria-hidden />
    </div>
  );
}
