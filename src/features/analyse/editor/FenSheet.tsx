import { useEffect, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { Button, Sheet } from '../../../components/ui';
import { readText } from '../model/clipboard';
import { parseFen, type EditorPosition } from '../model/position';

/** Bottom sheet to paste a FEN; loads it into the editor (where the validator checks it). */
export function FenSheet({ open, onClose, onLoad }: { open: boolean; onClose: () => void; onLoad: (pos: EditorPosition) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setError(null);
    }
  }, [open]);

  const submit = (value = text) => {
    const r = parseFen(value);
    if (!r.ok) return setError(r.error);
    onLoad(r.pos);
    onClose();
  };

  const fromClipboard = async () => {
    const t = await readText();
    if (t === null) return setError('Clipboard access is not available here. Long-press the box and paste.');
    setText(t.trim());
    submit(t);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Load a FEN"
      description="Paste a position in FEN. Only the piece placement is required."
      actions={
        <>
          <Button variant="primary" onClick={() => submit()} disabled={!text.trim()}>
            Load position
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        rows={3}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="FEN"
        placeholder="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
        className="w-full resize-none rounded-control border border-line bg-ink/55 px-3 py-2.5 font-mono text-sm text-fg shadow-recessed outline-none placeholder:text-fg-subtle/70 focus:border-accent/60"
      />
      {error && (
        <p className="mt-2 text-sm text-blunder" role="alert">
          {error}
        </p>
      )}
      <Button variant="tinted" className="mt-3 w-full" icon={<ClipboardPaste className="size-4" aria-hidden />} onClick={fromClipboard}>
        Paste from clipboard
      </Button>
    </Sheet>
  );
}
