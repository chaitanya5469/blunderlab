import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tinted' | 'lichess';
type Size = 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'tinted' is a quiet accent action (accent-soft fill) for secondary emphasis. */
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink font-semibold bg-[linear-gradient(180deg,rgb(255_255_255/0.16),rgb(255_255_255/0)_70%)] ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_1px_2px_rgb(0_0_0/0.4),0_10px_24px_-12px_rgb(111_149_255/0.7)] hover:bg-accent-strong active:brightness-95',
  secondary:
    'bg-surface-3 text-fg border border-line-strong/70 bg-[linear-gradient(180deg,rgb(255_255_255/0.05),rgb(255_255_255/0))] shadow-control hover:bg-line active:bg-line',
  ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2 active:bg-surface-3 active:text-fg',
  danger: 'bg-blunder/12 text-blunder hover:bg-blunder/20 active:bg-blunder/24 border border-blunder/30',
  tinted: 'bg-accent-soft text-accent-strong border border-accent/25 hover:bg-accent/20 active:bg-accent/24',
  /** The primary action of the Lichess puzzle screens, in their own colour. */
  lichess:
    'bg-lichess text-ink font-semibold bg-[linear-gradient(180deg,rgb(255_255_255/0.18),rgb(255_255_255/0)_70%)] ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_1px_2px_rgb(0_0_0/0.4),0_10px_24px_-12px_rgb(180_156_255/0.7)] hover:brightness-110 active:brightness-95',
};

// min-h, not h: a label that wraps under a large system text size grows the button instead of clipping.
const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'min-h-13 px-5 text-base gap-2.5',
  icon: 'size-11 justify-center',
};

export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium select-none pressable',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
