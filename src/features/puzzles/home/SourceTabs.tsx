import { useNavigate } from 'react-router';
import { Globe, Puzzle } from 'lucide-react';
import { Tabs } from '../../../components/ui';
import { cn } from '../../../lib/cn';

export type PuzzleSourceTab = 'own' | 'lichess';

const OPTIONS = [
  { value: 'own' as const, label: 'From your games' },
  { value: 'lichess' as const, label: 'Lichess' },
];

/** Switches between the owner's own puzzles and Lichess puzzles (two separate screens). */
export function SourceTabs({ value }: { value: PuzzleSourceTab }) {
  const navigate = useNavigate();
  return (
    <Tabs
      label="Puzzle source"
      options={OPTIONS}
      value={value}
      onChange={(v) => v !== value && navigate(v === 'lichess' ? '/puzzles/lichess' : '/puzzles', { replace: true })}
      indicatorClassName={value === 'lichess' ? 'border-lichess/45 bg-lichess/22!' : 'border-blunder/40 bg-blunder/18!'}
    />
  );
}

/** Small source label: "From your games" (red) or "Lichess" (violet). */
export function SourceMark({ source, className }: { source: PuzzleSourceTab; className?: string }) {
  const lichess = source === 'lichess';
  const Icon = lichess ? Globe : Puzzle;
  return (
    <span
      className={cn(
        'inline-flex min-h-6 shrink-0 items-center gap-1 rounded-chip px-2 text-2xs font-semibold edge-current',
        lichess ? 'bg-lichess-soft text-lichess' : 'bg-blunder/14 text-blunder',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {lichess ? 'Lichess' : 'From your games'}
    </span>
  );
}
