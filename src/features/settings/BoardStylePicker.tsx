import { memo } from 'react';
import { Check } from 'lucide-react';
import { BOARD_THEMES, PIECE_SETS, piecesFor, usePieces } from '../../lib/boardStyle';
import { cn } from '../../lib/cn';
import { settingsStore } from '../../lib/settings';
import { useSettings } from '../../hooks/useServices';
import { playMoveSound } from '../../lib/sound';

/** Italian Game after 4...Bc5, white's knight selected: shows squares, pieces, last-move and selection tints. */
const PREVIEW_FEN = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R';
const PREVIEW_LAST = ['f8', 'c5'];
const PREVIEW_SELECTED = 'f3';
const PREVIEW_TARGETS = ['g5', 'h4', 'd2', 'g1'];

const squareName = (r: number, c: number) => `${'abcdefgh'[c]}${8 - r}`;

/** Live preview of the chosen board theme and piece set (plain squares, no react-chessboard). */
const BoardPreview = memo(function BoardPreview() {
  const pieces = usePieces();
  const rows = PREVIEW_FEN.split('/').map((rank) => [...rank].flatMap((ch) => (/\d/.test(ch) ? Array<null>(Number(ch)).fill(null) : [`${ch === ch.toUpperCase() ? 'w' : 'b'}${ch.toUpperCase()}`])));
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[260px] grid-cols-8 overflow-hidden rounded-[10px] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)] ring-1 ring-white/5" aria-label="Board preview" role="img">
      {rows.flatMap((row, r) =>
        row.map((piece, c) => {
          const sq = squareName(r, c);
          const tint = PREVIEW_LAST.includes(sq) ? 'var(--color-board-highlight)' : sq === PREVIEW_SELECTED ? 'var(--color-board-select)' : null;
          const Piece = piece ? pieces[piece] : undefined;
          return (
            <div
              key={sq}
              className={cn('relative', (r + c) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark')}
              style={tint ? { backgroundImage: `linear-gradient(${tint}, ${tint})` } : undefined}
            >
              {PREVIEW_TARGETS.includes(sq) && <span className="absolute inset-0 bg-[radial-gradient(circle,rgb(12_14_18/0.32)_17%,transparent_19%)]" />}
              {Piece && <div className="relative scale-[0.9]">{Piece({ svgStyle: { width: '100%', height: '100%', display: 'block' } })}</div>}
            </div>
          );
        }),
      )}
    </div>
  );
});

/** Board theme swatches and piece-set tiles with the live preview above them. */
export function BoardStylePicker() {
  const settings = useSettings();
  return (
    <div className="space-y-4">
      <BoardPreview />

      <div>
        <p className="mb-2 px-1 text-xs font-semibold text-fg-muted">Board</p>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Board colours">
          {BOARD_THEMES.map((t) => {
            const active = settings.boardTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => settingsStore.set({ boardTheme: t.id })}
                className={cn('flex flex-col items-center gap-1 rounded-[12px] p-1.5 transition-colors', active ? 'bg-accent-soft ring-2 ring-accent-strong' : 'hover:bg-surface-3')}
              >
                <span className="relative grid size-11 grid-cols-2 overflow-hidden rounded-[8px] ring-1 ring-white/10" aria-hidden>
                  <span style={{ background: t.light }} />
                  <span style={{ background: t.dark }} />
                  <span style={{ background: t.dark }} />
                  <span style={{ background: t.light }} />
                  {active && (
                    <span className="absolute inset-0 grid place-items-center">
                      <Check className="size-4 rounded-full bg-accent p-0.5 text-accent-ink" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center text-2xs font-medium">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-semibold text-fg-muted">Pieces</p>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Piece set">
          {PIECE_SETS.map((p) => {
            const active = settings.pieceSet === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  settingsStore.set({ pieceSet: p.id });
                  playMoveSound('move');
                }}
                className={cn('flex flex-col items-center gap-1 rounded-[12px] p-1.5 transition-colors', active ? 'bg-accent-soft ring-2 ring-accent-strong' : 'hover:bg-surface-3')}
              >
                <span className="flex h-11 w-full max-w-16 items-center overflow-hidden rounded-[8px] bg-board-light px-0.5 ring-1 ring-white/10" aria-hidden>
                  <PieceThumb set={p.id} code="wN" />
                  <PieceThumb set={p.id} code="bQ" />
                </span>
                <span className="w-full truncate text-center text-2xs font-medium">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** One piece of a set, on a light square (the set's SVG is fetched only here and when chosen). */
function PieceThumb({ set, code }: { set: string; code: string }) {
  return <span className="block size-full">{piecesFor(set)[code]?.({ svgStyle: { width: '100%', height: '100%', display: 'block' } })}</span>;
}
