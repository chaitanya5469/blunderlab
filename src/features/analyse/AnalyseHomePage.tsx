import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronRight, ClipboardPaste, Crown, Grid3x3, ScanLine, SquarePen } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { FenSheet } from './editor/FenSheet';
import { loadPosition, useEditor } from './model/editorStore';
import { emptyPosition, startPosition, type EditorPosition } from './model/position';

/** Entry to the position scanner: scan an image, or set a position up by hand. */
export function AnalyseHomePage() {
  const navigate = useNavigate();
  const editor = useEditor();
  const [fenOpen, setFenOpen] = useState(false);
  const hasDraft = editor.pos.board.some(Boolean);

  const open = (pos: EditorPosition) => {
    loadPosition(pos);
    navigate('/analyse/edit');
  };

  return (
    <Page className="space-y-6">
      <PageHeader backTo="/" title="Analyse a position" subtitle="From a photo, a screenshot or by hand" />

      <Link
        to="/analyse/scan"
        className="group relative flex min-h-40 flex-col overflow-hidden rounded-card border-accent/25 bg-[radial-gradient(120%_100%_at_0%_0%,rgb(111_149_255/0.22),transparent_62%)] p-5 pressable surface-raised"
      >
        <span className="grid size-12 place-items-center rounded-[14px] bg-accent-soft text-accent-strong edge-current">
          <ScanLine className="size-6" aria-hidden />
        </span>
        <span className="mt-auto pt-5 font-display text-xl leading-tight font-semibold">Scan a photo</span>
        <span className="mt-1 text-sm text-fg-muted">Screenshot, diagram or a photo of a real board. Recognised on this device; the image never leaves it.</span>
        <ChevronRight className="absolute top-5 right-5 size-5 text-fg-subtle" aria-hidden />
      </Link>

      <section className="space-y-2">
        <p className="px-1 text-2xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">Set up manually</p>
        {hasDraft && <Row icon={<SquarePen className="size-5" aria-hidden />} title="Continue editing" line="The position you were last setting up" onClick={() => navigate('/analyse/edit')} />}
        <Row icon={<Grid3x3 className="size-5" aria-hidden />} title="Empty board" line="Place every piece yourself" onClick={() => open(emptyPosition())} />
        <Row icon={<Crown className="size-5" aria-hidden />} title="Starting position" line="Start from the initial setup and adjust" onClick={() => open(startPosition())} />
        <Row icon={<ClipboardPaste className="size-5" aria-hidden />} title="Paste a FEN" line="Load a position from text" onClick={() => setFenOpen(true)} />
      </section>

      <FenSheet open={fenOpen} onClose={() => setFenOpen(false)} onLoad={(p) => open(p)} />
    </Page>
  );
}

function Row({ icon, title, line, onClick }: { icon: ReactNode; title: string; line: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 rounded-card p-3.5 text-left pressable surface-raised">
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-fg-muted edge-current">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-fg-muted">{line}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
    </button>
  );
}
