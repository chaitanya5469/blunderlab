import { useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CircleAlert, ClipboardPaste, Copy, FlipVertical2, Lock, RotateCcw, ScanSearch, SlidersHorizontal, Sparkles, Trash2, Undo2, X } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Screen, ScreenFooter } from '../../../components/layout/Screen';
import { Button, Sheet } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { copyText } from '../model/clipboard';
import { dismissConfidence, edit, flip, loadPosition, undo, useEditor } from '../model/editorStore';
import { emptyPosition, epCandidates, possibleCastling, startPosition, toFen, validate, type Castling } from '../model/position';
import { EditorBoard } from './EditorBoard';
import { FenSheet } from './FenSheet';

/**
 * Board editor: set up or correct a position, validated on every change, then analyse it.
 * A fixed full-height screen (no page scroll): board, tray and tools on top, status and Analyse
 * in a bottom bar, the less used settings (castling, en passant, FEN, start / clear) in a sheet.
 */
export function EditorPage() {
  const s = useEditor();
  const navigate = useNavigate();
  const { pos } = s;
  const issues = useMemo(() => validate(pos), [pos]);
  const fen = useMemo(() => toFen(pos), [pos]);
  const valid = issues.length === 0;
  const [fenOpen, setFenOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const can = possibleCastling(pos.board);
  const eps = epCandidates(pos.board, pos.turn);
  const unsure = s.confidence ? Object.keys(s.confidence).length : 0;

  const analyse = () => {
    if (!valid) return;
    navigate(`/analyse/board?fen=${encodeURIComponent(fen)}&o=${s.orientation}`);
  };

  const copy = async () => {
    if (await copyText(fen)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <Screen>
      <PageHeader
        backTo="/analyse"
        title="Set up position"
        subtitle="Edit the board, then analyse it"
        className="shrink-0 pb-2"
        actions={
          <button
            type="button"
            aria-label="Position settings"
            onClick={() => setSettingsOpen(true)}
            className="grid size-11 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <SlidersHorizontal className="size-5" />
          </button>
        }
      />

      <AnimatePresence initial={false}>
        {s.confidence && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="mb-2 flex items-start gap-2.5 rounded-control border border-inaccuracy/30 bg-inaccuracy/10 py-2 pr-1 pl-3">
              <ScanSearch className="mt-0.5 size-4 shrink-0 text-inaccuracy" aria-hidden />
              <p className="min-w-0 flex-1 text-sm leading-snug">
                <span className="font-semibold">Recognised from your image.</span>{' '}
                <span className="text-fg-muted">
                  {unsure
                    ? `Check the ${unsure} outlined square${unsure === 1 ? '' : 's'}, the scanner was unsure there. Also check side to move and castling.`
                    : 'Compare it with your image, then set side to move and castling.'}
                </span>
              </p>
              <button type="button" aria-label="Dismiss" onClick={dismissConfidence} className="grid size-9 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditorBoard
        board={pos.board}
        orientation={s.orientation}
        confidence={s.confidence}
        loadId={s.loadId}
        status={pos.turn === 'w' ? 'White to move' : 'Black to move'}
        tools={
          <>
            <IconTool label="Undo" icon={<Undo2 />} onClick={undo} disabled={!s.history.length} />
            <IconTool label="Flip board" icon={<FlipVertical2 />} onClick={flip} />
            <TurnToggle turn={pos.turn} onChange={(turn) => edit((p) => ({ ...p, turn }))} />
          </>
        }
      />

      <ScreenFooter className="space-y-2">
        <StatusLine issues={issues.map((i) => i.message)} onDetails={() => setSettingsOpen(true)} />
        <Button variant="primary" size="lg" className="w-full" disabled={!valid} onClick={analyse} icon={valid ? <Sparkles className="size-5" aria-hidden /> : <Lock className="size-5" aria-hidden />}>
          {valid ? 'Analyse position' : 'Fix the position to analyse'}
        </Button>
      </ScreenFooter>

      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Position settings"
        actions={
          <Button variant="primary" onClick={() => setSettingsOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="-mx-1 max-h-[60dvh] space-y-4 overflow-y-auto overscroll-contain px-1">
          {!valid && <ValidationPanel issues={issues.map((i) => i.message)} />}
          <div>
            <Label>Castling rights</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  ['K', 'White O-O'],
                  ['Q', 'White O-O-O'],
                  ['k', 'Black O-O'],
                  ['q', 'Black O-O-O'],
                ] as [keyof Castling, string][]
              ).map(([key, label]) => {
                const on = pos.castling[key];
                const possible = can[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    disabled={!possible && !on}
                    onClick={() => edit((p) => ({ ...p, castling: { ...p.castling, [key]: !on } }), { sanitize: false })}
                    title={possible ? undefined : 'King or rook not on its starting square'}
                    className={cn(
                      'min-h-11 rounded-control px-1 text-xs leading-tight font-semibold transition-colors disabled:opacity-35',
                      on ? (possible ? 'bg-accent-soft text-accent-strong ring-1 ring-accent/40' : 'bg-blunder/14 text-blunder ring-1 ring-blunder/40') : 'bg-surface-3 text-fg-muted',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {(eps.length > 0 || pos.ep) && (
            <div>
              <Label>En passant</Label>
              <div className="flex flex-wrap gap-1.5">
                {[null, ...eps, ...(pos.ep && !eps.includes(pos.ep) ? [pos.ep] : [])].map((sq) => {
                  const on = pos.ep === sq;
                  return (
                    <button
                      key={sq ?? 'none'}
                      type="button"
                      aria-pressed={on}
                      onClick={() => edit((p) => ({ ...p, ep: sq }), { sanitize: false })}
                      className={cn(
                        'h-9 min-w-14 rounded-chip px-3 text-sm font-semibold transition-colors',
                        on ? 'bg-accent-soft text-accent-strong ring-1 ring-accent/40' : 'bg-surface-3 text-fg-muted hover:text-fg',
                      )}
                    >
                      {sq ?? 'None'}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-2xs text-fg-subtle">Only if the last move was a two-square pawn advance.</p>
            </div>
          )}
          <div>
            <Label>FEN</Label>
            <p className="mb-2 truncate px-1 font-mono text-2xs text-fg-subtle" title={fen}>
              {fen}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copy} icon={copied ? <Check className="size-4 text-best" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
                {copied ? 'Copied' : 'Copy FEN'}
              </Button>
              <Button
                onClick={() => {
                  setSettingsOpen(false);
                  setFenOpen(true);
                }}
                icon={<ClipboardPaste className="size-4" aria-hidden />}
              >
                Paste FEN
              </Button>
            </div>
          </div>
          <div>
            <Label>Board</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => loadPosition(startPosition())} icon={<RotateCcw className="size-4" aria-hidden />}>
                Start position
              </Button>
              <Button onClick={() => loadPosition(emptyPosition())} icon={<Trash2 className="size-4" aria-hidden />}>
                Clear board
              </Button>
            </div>
          </div>
        </div>
      </Sheet>

      <FenSheet open={fenOpen} onClose={() => setFenOpen(false)} onLoad={(p) => loadPosition(p)} />
    </Screen>
  );
}

function Label({ children }: { children: string }) {
  return <p className="mb-1.5 px-0.5 text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase">{children}</p>;
}

function IconTool({ label, icon, onClick, disabled }: { label: string; icon: ReactElement<{ className?: string }>; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 shrink-0 place-items-center rounded-chip bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg active:bg-surface-3 disabled:opacity-40 [&_svg]:size-[18px]"
    >
      {icon}
    </button>
  );
}

/** Compact white / black side-to-move switch. */
function TurnToggle({ turn, onChange }: { turn: 'w' | 'b'; onChange: (t: 'w' | 'b') => void }) {
  return (
    <div role="radiogroup" aria-label="Side to move" className="ml-auto flex shrink-0 gap-0.5 rounded-chip bg-ink/55 p-0.5 ring-1 ring-line-soft">
      {(['w', 'b'] as const).map((c) => {
        const on = turn === c;
        const label = c === 'w' ? 'White to move' : 'Black to move';
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => onChange(c)}
            className={cn('grid h-8 w-9 place-items-center rounded-[6px] transition-colors', on ? 'bg-surface-3 ring-1 ring-accent/50' : 'hover:bg-surface-2')}
          >
            <span className={cn('size-4 rounded-full ring-1', c === 'w' ? 'bg-eval-white ring-black/30' : 'bg-eval-black ring-white/40', !on && 'opacity-45')} />
          </button>
        );
      })}
    </div>
  );
}

/** One-line validation status for the bottom bar; the full list is in the settings sheet. */
function StatusLine({ issues, onDetails }: { issues: string[]; onDetails: () => void }) {
  if (!issues.length) {
    return (
      <p className="flex h-6 items-center gap-2 px-1 text-sm font-semibold" role="status">
        <Check className="size-4 shrink-0 text-best" aria-hidden />
        Legal position, ready to analyse
      </p>
    );
  }
  return (
    <button type="button" onClick={onDetails} className="flex h-6 w-full items-center gap-2 px-1 text-left text-sm" aria-live="polite">
      <CircleAlert className="size-4 shrink-0 text-blunder" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-semibold text-blunder">{issues[0]}</span>
      {issues.length > 1 && <span className="shrink-0 text-xs font-semibold text-fg-muted">+{issues.length - 1} more</span>}
    </button>
  );
}

function ValidationPanel({ issues }: { issues: string[] }) {
  return (
    <div className="rounded-control border border-blunder/30 bg-blunder/8 px-3 py-2.5" role="status">
      <p className="flex items-center gap-2 text-sm font-semibold text-blunder">
        <CircleAlert className="size-4 shrink-0" aria-hidden />
        {issues.length === 1 ? 'One thing to fix' : `${issues.length} things to fix`}
      </p>
      <ul className="mt-1.5 space-y-1 pl-6 text-sm text-fg-muted">
        {issues.map((m) => (
          <li key={m} className="list-disc marker:text-blunder/60">
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}
