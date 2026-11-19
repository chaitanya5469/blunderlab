import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
  /** Extra classes for the sliding indicator, e.g. to tint it for the selected value. */
  indicatorClassName?: string;
}

/** Segmented control with a sliding indicator on a recessed track. */
export function Tabs<T extends string>({ options, value, onChange, className, label, indicatorClassName }: TabsProps<T>) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex rounded-control border border-line-soft bg-ink/55 p-1 shadow-recessed', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative h-11 min-w-0 flex-1 rounded-[9px] px-2 text-sm transition-colors duration-150',
              active ? 'font-semibold text-fg' : 'font-medium text-fg-subtle hover:text-fg-muted active:bg-white/[0.04] active:text-fg-muted',
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${id}`}
                className={cn(
                  'absolute inset-0 rounded-[9px] border border-line-strong/80 bg-surface-3 bg-[linear-gradient(180deg,rgb(255_255_255/0.06),rgb(255_255_255/0))] shadow-control',
                  indicatorClassName,
                )}
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span className="relative block truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
