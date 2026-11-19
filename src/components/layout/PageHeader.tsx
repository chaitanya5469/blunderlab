import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Show a back button (uses history, falls back to this path). */
  backTo?: string;
  actions?: ReactNode;
  className?: string;
  /** Small label above a top-level title (e.g. a count or context). */
  eyebrow?: ReactNode;
}

/** Large page title used by every top-level screen, including feature pages. */
export function PageHeader({ title, subtitle, backTo, actions, className, eyebrow }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className={cn('flex items-center gap-2', backTo ? 'pt-3 pb-3' : 'pt-5 pb-4', className)}>
      {backTo && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(backTo))}
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-fg-muted pressable hover:bg-surface-2 hover:text-fg active:bg-surface-3 active:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && !backTo && <p className="mb-1 text-2xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">{eyebrow}</p>}
        <h1
          className={cn(
            'truncate font-semibold',
            backTo ? 'text-xl tracking-[-0.02em]' : 'text-[2rem] leading-[1.1] tracking-[-0.035em]',
          )}
        >
          {title}
        </h1>
        {subtitle && <p className={cn('truncate text-sm text-fg-muted', backTo ? 'mt-0.5' : 'mt-1')}>{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
