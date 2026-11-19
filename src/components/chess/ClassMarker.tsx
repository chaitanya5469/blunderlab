import { BookOpen, Check, Star, ThumbsUp, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { MOVE_CLASS_META } from '../../lib/moveClass';
import type { MoveClass } from '../../lib/types';

/**
 * The glyph inside a class marker: a star (best), thumbs-up (excellent), check (good), book (book),
 * cross (miss) or the annotation symbol. Icons size to `iconClassName` (default fits the 18px marker).
 */
export function ClassGlyph({ cls, iconClassName }: { cls: MoveClass; iconClassName?: string }) {
  const meta = MOVE_CLASS_META[cls];
  if (cls === 'best') return <Star className={cn('size-2.5 fill-current', iconClassName)} strokeWidth={0} aria-hidden />;
  if (cls === 'excellent') return <ThumbsUp className={cn('size-2.5 fill-current', iconClassName)} strokeWidth={2.5} aria-hidden />;
  if (cls === 'book') return <BookOpen className={cn('size-2.5', iconClassName)} strokeWidth={3} aria-hidden />;
  if (cls === 'good') return <Check className={cn('size-3', iconClassName)} strokeWidth={3.5} aria-hidden />;
  if (cls === 'miss') return <X className={cn('size-3', iconClassName)} strokeWidth={3.5} aria-hidden />;
  return meta.symbol ? <span aria-hidden>{meta.symbol}</span> : null;
}

/** Round move-quality marker (e.g. "??" on red for a blunder). */
export function ClassMarker({ cls, className }: { cls: MoveClass; className?: string }) {
  const meta = MOVE_CLASS_META[cls];
  return (
    <span
      title={meta.label}
      className={cn(
        'inline-grid size-4.5 shrink-0 place-items-center rounded-full text-[0.6rem] leading-none font-bold tracking-[-0.04em] text-canvas',
        meta.bgClass,
        className,
      )}
    >
      <ClassGlyph cls={cls} />
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}
