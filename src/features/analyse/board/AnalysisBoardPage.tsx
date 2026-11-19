import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Copy, FlipVertical2, PencilLine, ShieldAlert } from 'lucide-react';
import { EvalBar } from '../../../components/chess/EvalBar';
import { InteractiveBoard } from '../../../components/chess/InteractiveBoard';
import { Page } from '../../../components/layout/Page';
import { Screen } from '../../../components/layout/Screen';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, EmptyState } from '../../../components/ui';
import { useBoardFit } from '../../../hooks/useBoardFit';
import { cn } from '../../../lib/cn';
import type { Color, Score } from '../../../lib/types';
import { ReviewControls } from '../../review/ReviewControls';
import { useLiveAnalysis } from '../../review/useLiveAnalysis';
import { makeMove, moveLabel, terminalState, type VarMove } from '../../review/variation';
import { EngineLines } from '../../review/VariationPanel';
import { copyText } from '../model/clipboard';
import { loadPosition } from '../model/editorStore';
import { engineSafeFen, parseFen } from '../model/position';

/** Eval bar (w-5) plus gap beside the board. */
const BOARD_SIDE = 28;
/** Height kept for the scrolling panel under the board on short screens. */
const PANEL_MIN = 150;

/**
 * Live Stockfish analysis of a set-up position. The FEN from the URL is validated again here and
 * the engine never sees it unless it passes; every later position comes from legal moves.
 */
export function AnalysisBoardPage() {
  const [params] = useSearchParams();
  const rootFen = useMemo(() => engineSafeFen(params.get('fen') ?? ''), [params]);
  const [orientation, setOrientation] = useState<Color>(params.get('o') === 'black' ? 'black' : 'white');
  if (!rootFen) {
    return (
      <Page>
        <PageHeader title="Analysis" backTo="/analyse" />
        <EmptyState icon={<ShieldAlert />} title="This position can't be analysed" body="It isn't a legal chess position. Open it in the editor to fix it." />
      </Page>
    );
  }
  return <AnalysisBoard key={rootFen} rootFen={rootFen} orientation={orientation} onFlip={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} />;
}

function AnalysisBoard({ rootFen, orientation, onFlip }: { rootFen: string; orientation: Color; onFlip: () => void }) {
  const navigate = useNavigate();
  const [line, setLine] = useState<VarMove[]>([]);
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const fen = index > 0 ? line[index - 1]!.fenAfter : rootFen;
  const live = useLiveAnalysis(fen);
  const terminal = useMemo(() => terminalState(fen), [fen]);
  const fresh = live.fen === fen ? live.lines[0] : undefined;
  const score: Score | null = terminal?.score ?? fresh?.score ?? null;
  const best = terminal ? null : (fresh?.pv[0] ?? null);
  const shown = index > 0 ? line[index - 1] : undefined;

  const play = (uci: string) => {
    const m = makeMove(fen, uci);
    if (!m) return;
    if (line[index]?.uci === m.uci) return setIndex(index + 1);
    setLine([...line.slice(0, index), m]);
    setIndex(index + 1);
  };

  const editHere = () => {
    const r = parseFen(fen);
    if (r.ok) loadPosition(r.pos, { orientation });
    navigate('/analyse/edit');
  };

  const copy = async () => {
    if (await copyText(fen)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  const turn = fen.split(' ')[1] === 'b' ? 'Black' : 'White';
  const fit = useBoardFit({ side: BOARD_SIDE, minRest: PANEL_MIN });

  return (
    <Screen>
      <PageHeader
        backTo="/analyse/edit"
        title="Analysis"
        subtitle={terminal ? 'Game over in this position' : `${turn} to move`}
        className="shrink-0 pb-2"
        actions={
          <button type="button" aria-label="Flip board" onClick={onFlip} className="grid size-11 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">
            <FlipVertical2 className="size-5" />
          </button>
        }
      />

      <div ref={fit.area} className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div ref={fit.block} className="mx-auto flex w-full shrink-0 touch-none gap-2" style={fit.size ? { width: fit.size + BOARD_SIDE } : undefined}>
          <EvalBar score={score} orientation={orientation} />
          <div ref={fit.board} className="min-w-0 flex-1">
            <InteractiveBoard
              id="analysis-board"
              framed
              fen={fen}
              orientation={orientation}
              onMove={play}
              lastMove={shown ? { from: shown.from, to: shown.to } : null}
              arrows={best ? [{ from: best.slice(0, 2), to: best.slice(2, 4) }] : undefined}
            />
          </div>
        </div>

        <div className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-1">
          <section className="space-y-3 rounded-card surface-raised px-3 pt-2.5 pb-3" aria-label="Engine analysis">
            <MoveChips line={line} index={index} onSelect={setIndex} />
            <EngineLines fen={fen} live={live} onPlay={play} />
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={editHere} icon={<PencilLine className="size-4" aria-hidden />}>
              Edit position
            </Button>
            <Button onClick={copy} icon={copied ? <Check className="size-4 text-best" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
              {copied ? 'Copied' : 'Copy FEN'}
            </Button>
          </div>
        </div>
      </div>

      <ReviewControls
        canPrev={index > 0}
        canNext={index < line.length}
        atStart={index === 0}
        atEnd={index >= line.length}
        onFirst={() => setIndex(0)}
        onPrev={() => setIndex(Math.max(0, index - 1))}
        onNext={() => setIndex(Math.min(line.length, index + 1))}
        onLast={() => setIndex(line.length)}
      />
    </Screen>
  );
}

function MoveChips({ line, index, onSelect }: { line: VarMove[]; index: number; onSelect: (i: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index]);
  if (!line.length) return <p className="pt-0.5 text-sm text-fg-muted">Move a piece, or tap an engine line to play it.</p>;
  return (
    <div ref={box} className="-mx-1 flex max-h-[4.75rem] flex-wrap gap-0.5 overflow-y-auto overscroll-contain">
      <button
        type="button"
        data-i={0}
        onClick={() => onSelect(0)}
        className={cn('h-8 rounded-chip px-1.5 text-sm font-medium transition-colors', index === 0 ? 'bg-accent-soft text-fg ring-1 ring-accent/40' : 'text-fg-muted hover:text-fg')}
      >
        Start
      </button>
      {line.map((m, i) => {
        const active = i + 1 === index;
        return (
          <button
            key={i}
            type="button"
            data-i={i + 1}
            onClick={() => onSelect(i + 1)}
            className={cn(
              'h-8 rounded-chip px-1.5 text-sm font-medium tnum transition-colors',
              active ? 'bg-accent-soft text-fg ring-1 ring-accent/40' : i + 1 > index ? 'text-fg-subtle hover:text-fg-muted' : 'text-fg-muted hover:text-fg',
            )}
          >
            {i === 0 || m.color === 'white' ? moveLabel(m.moveNumber, m.color, m.san) : m.san}
          </button>
        );
      })}
    </div>
  );
}
