import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Chessboard } from 'react-chessboard';
import { Camera, ImagePlus, LoaderCircle, RefreshCw, RotateCw, ScanSearch, ShieldCheck, SquarePen } from 'lucide-react';
import { useBoardTheme } from '../../../components/chess/Board';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Screen, ScreenFooter } from '../../../components/layout/Screen';
import { Button, Tabs } from '../../../components/ui';
import { unsureSquareStyle } from '../editor/EditorBoard';
import { loadPosition } from '../model/editorStore';
import { placementOf } from '../model/position';
import { captureImage } from './capture';
import { CornerEditor } from './CornerEditor';
import { orderQuad, type Quad } from './geometry';
import { gridFromProbs, guessRotation, toEditor, type ImageGrid } from './interpret';
import { decodeImage, Scanner, type ScanMode } from './scanner';

type Step =
  | { kind: 'pick' }
  | { kind: 'adjust'; url: string; width: number; height: number; quad: Quad; found: boolean }
  | { kind: 'result'; url: string; width: number; height: number; quad: Quad; grid: ImageGrid; rotation: number };

const MODES: { value: ScanMode; label: string }[] = [
  { value: 'screen', label: 'Screenshot' },
  { value: 'photo', label: 'Real board' },
];

const inset = (w: number, h: number, f: number): Quad => {
  const s = Math.min(w, h) * (1 - 2 * f);
  const x = (w - s) / 2;
  const y = (h - s) / 2;
  return [
    { x, y },
    { x: x + s, y },
    { x: x + s, y: y + s },
    { x, y: y + s },
  ];
};

/** Scan a screenshot, diagram or photo: locate the board, let the user fix the corners, recognise the squares. */
export function ScanPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>('screen');
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const scanner = useRef<Scanner | null>(null);

  useEffect(() => {
    scanner.current = new Scanner();
    return () => scanner.current?.dispose();
  }, []);

  // Free the previous image's object URL whenever it is replaced.
  const url = step.kind === 'pick' ? null : step.url;
  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);

  const pick = async (source: 'camera' | 'gallery') => {
    setError(null);
    try {
      const blob = await captureImage(source);
      if (blob) await open(blob);
    } catch (e) {
      setError(e instanceof Error ? `Couldn't get an image: ${e.message}` : "Couldn't get an image.");
    }
  };

  // A pasted image (Ctrl+V / long-press paste on desktop or tablet) works like a picked one.
  const openRef = useRef<(b: Blob) => void>(() => {});
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
      if (file) {
        e.preventDefault();
        openRef.current(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const open = async (blob: Blob) => {
    setError(null);
    try {
      setBusy('Reading the image…');
      const { image, url } = await decodeImage(blob, mode);
      await scanner.current!.setImage(image);
      let quad: Quad | null = null;
      if (mode === 'screen') {
        setBusy('Looking for the board…');
        quad = await scanner.current!.locate();
      }
      setStep({ kind: 'adjust', url, width: image.width, height: image.height, quad: quad ?? inset(image.width, image.height, mode === 'photo' ? 0.12 : 0.05), found: !!quad });
    } catch (e) {
      setError(e instanceof Error ? `Couldn't read that image: ${e.message}` : "Couldn't read that image.");
    } finally {
      setBusy(null);
    }
  };
  useEffect(() => {
    openRef.current = (b) => void open(b);
  });

  const recognise = async () => {
    if (step.kind !== 'adjust') return;
    setError(null);
    setBusy('Recognising pieces…');
    try {
      const quad = orderQuad(step.quad);
      const { probs, classes, unsureBelow } = await scanner.current!.classify(quad, mode);
      const grid = gridFromProbs(probs, classes, unsureBelow);
      setStep({ kind: 'result', url: step.url, width: step.width, height: step.height, quad: step.quad, grid, rotation: guessRotation(grid, mode === 'photo') });
    } catch (e) {
      setError(e instanceof Error ? `Recognition failed: ${e.message}` : 'Recognition failed.');
    } finally {
      setBusy(null);
    }
  };

  const recognised = useMemo(() => (step.kind === 'result' ? toEditor(step.grid, step.rotation, turn) : null), [step, turn]);

  const toEditorPage = () => {
    if (!recognised) return;
    loadPosition(recognised.pos, { orientation: recognised.orientation, confidence: recognised.unsure });
    navigate('/analyse/edit');
  };

  const header = <PageHeader backTo="/analyse" title="Scan a position" subtitle="Recognised on this device, offline" className="shrink-0 pb-1" />;
  const errorNote = error && (
    <p className="rounded-control border border-blunder/30 bg-blunder/8 px-3 py-2.5 text-sm text-blunder" role="alert">
      {error}
    </p>
  );

  // Crop and result steps: a fixed screen (no page scroll), the image or board fitted between the
  // header and a bottom action bar.
  if (step.kind === 'adjust') {
    return (
      <Screen>
        {header}
        <p className="shrink-0 px-1 pt-1 pb-3 text-sm leading-snug text-fg-muted">
          {mode === 'screen'
            ? step.found
              ? 'Board found. Check the grid sits on the squares; drag a corner to adjust.'
              : 'Couldn’t find the board automatically. Drag the four corners onto the board’s outer corners.'
            : 'Drag the four corners onto the outer corners of the playing area (not the frame).'}
        </p>
        <CornerEditor src={step.url} width={step.width} height={step.height} quad={step.quad} onChange={(quad) => setStep({ ...step, quad })} />
        <ScreenFooter className="space-y-2 pt-3">
          {errorNote}
          <Button variant="primary" size="lg" className="w-full" onClick={recognise} loading={!!busy} icon={<ScanSearch className="size-5" aria-hidden />}>
            Recognise position
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep({ kind: 'pick' })} icon={<RefreshCw className="size-4" aria-hidden />}>
            Use a different image
          </Button>
        </ScreenFooter>
      </Screen>
    );
  }

  if (step.kind === 'result' && recognised) {
    const unsureCount = Object.keys(recognised.unsure).length;
    return (
      <Screen>
        {header}
        <div className="flex min-h-0 flex-1 touch-none items-center justify-center pt-2 [container-type:size]">
          <div style={{ width: 'min(100cqw, 100cqh)' }}>
            <ResultBoard placement={placementOf(recognised.pos.board)} orientation={recognised.orientation} unsure={recognised.unsure} />
          </div>
        </div>
        <ScreenFooter className="space-y-2">
          <p className="px-1 text-sm leading-snug text-fg-muted">
            {unsureCount
              ? `${unsureCount} outlined square${unsureCount === 1 ? '' : 's'} to check. You can fix everything in the editor.`
              : 'Compare with your image; you can fix anything in the editor.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button icon={<RotateCw className="size-4" aria-hidden />} onClick={() => setStep({ ...step, rotation: (step.rotation + (mode === 'photo' ? 1 : 2)) % 4 })}>
              {mode === 'photo' ? 'Rotate' : 'Swap sides'}
            </Button>
            <Button icon={<RefreshCw className="size-4" aria-hidden />} onClick={() => setStep({ kind: 'adjust', url: step.url, width: step.width, height: step.height, quad: step.quad, found: true })}>
              Adjust corners
            </Button>
          </div>
          <Tabs
            label="Side to move"
            options={[
              { value: 'w', label: 'White to move' },
              { value: 'b', label: 'Black to move' },
            ]}
            value={turn}
            onChange={setTurn}
          />
          {errorNote}
          <Button variant="primary" size="lg" className="w-full" onClick={toEditorPage} icon={<SquarePen className="size-5" aria-hidden />}>
            Check & analyse
          </Button>
        </ScreenFooter>
      </Screen>
    );
  }

  return (
    <Page className="space-y-4">
      {header}

      <Tabs label="What are you scanning?" options={MODES} value={mode} onChange={setMode} />
      <p className="px-1 text-sm text-fg-muted">
        {mode === 'screen'
          ? 'A screenshot or a printed / digital diagram. The board is found automatically; you can adjust it.'
          : 'A photo of a physical board. Shoot from White’s or Black’s side, the whole board in frame, then mark its four corners.'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <PickButton icon={<ImagePlus className="size-6" aria-hidden />} label="Choose image" onClick={() => pick('gallery')} disabled={!!busy} />
        <PickButton icon={<Camera className="size-6" aria-hidden />} label="Take photo" onClick={() => pick('camera')} disabled={!!busy} />
      </div>
      <p className="flex items-center gap-2 px-1 text-xs text-fg-subtle">
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
        Images never leave your device.
      </p>

      {busy && (
        <p className="flex items-center justify-center gap-2 py-4 text-sm text-fg-muted" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          {busy}
        </p>
      )}
      {errorNote}
    </Page>
  );
}

function PickButton({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-32 flex-col items-center justify-center gap-2.5 rounded-card border-accent/20 bg-[radial-gradient(120%_100%_at_50%_0%,rgb(111_149_255/0.16),transparent_65%)] p-4 pressable surface-raised disabled:opacity-50"
    >
      <span className="grid size-12 place-items-center rounded-[14px] bg-accent-soft text-accent-strong edge-current">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function ResultBoard({ placement, orientation, unsure }: { placement: string; orientation: 'white' | 'black'; unsure: Record<string, number> }) {
  const theme = useBoardTheme();
  const squareStyles = useMemo(() => Object.fromEntries(Object.entries(unsure).map(([sq, c]) => [sq, unsureSquareStyle(c)])), [unsure]);
  return (
    <div className="overflow-hidden rounded-[10px] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)] ring-1 ring-white/5">
      <Chessboard options={{ ...theme, id: 'scan-result', position: placement, boardOrientation: orientation, squareStyles, allowDragging: false, showAnimations: false }} />
    </div>
  );
}
