import { useState } from 'react';
import { cn } from '../../lib/cn';

/** Round avatar with an initial fallback (also used offline when the image can't load). */
export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        'relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface-3 font-display font-semibold text-fg-muted',
        className,
      )}
    >
      {src && !failed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
