import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Footer actions, laid out full-width. */
  actions?: ReactNode;
}

/** Bottom sheet dialog (used for confirmations and small forms). */
export function Sheet({ open, onClose, title, description, children, actions }: SheetProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-app rounded-t-sheet border border-b-0 border-line bg-surface-2 bg-[linear-gradient(180deg,rgb(255_255_255/0.04),rgb(255_255_255/0)_120px)] px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_-20px_60px_rgb(0_0_0/0.5)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
            {actions && <div className="mt-5 flex flex-col gap-2">{actions}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
