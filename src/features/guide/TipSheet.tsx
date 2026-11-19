import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Lightbulb, Sparkles, Landmark } from 'lucide-react';
import { Button, Sheet } from '../../components/ui';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/cn';
import { tipStore } from './launch';
import { TIP_LABEL, TIPS, type TipKind } from './tips';

const KIND_ICON: Record<TipKind, { icon: typeof Lightbulb; tone: string }> = {
  history: { icon: Landmark, tone: 'bg-inaccuracy/14 text-inaccuracy' },
  trivia: { icon: Sparkles, tone: 'bg-brilliant/14 text-brilliant' },
  tip: { icon: Lightbulb, tone: 'bg-best/14 text-best' },
  app: { icon: BookOpen, tone: 'bg-accent-soft text-accent-strong' },
};

/** The launch tip: one chess fact or tip per app launch, from the second launch on. */
export function TipSheet() {
  const { open, next } = useStore(tipStore);
  const [index, setIndex] = useState(0);

  // Pick this launch's tip when the sheet opens; the next launch continues from the following one.
  useEffect(() => {
    if (!open) return;
    const start = next >= 0 ? next % TIPS.length : Math.floor(Math.random() * TIPS.length);
    setIndex(start);
    tipStore.set({ next: (start + 1) % TIPS.length });
  }, [open]);

  const close = () => tipStore.set({ open: false });
  const showNext = () => {
    const i = (index + 1) % TIPS.length;
    setIndex(i);
    tipStore.set({ next: (i + 1) % TIPS.length });
  };
  const tip = TIPS[index]!;
  const { icon: Icon, tone } = KIND_ICON[tip.kind];

  return (
    <Sheet
      open={open}
      onClose={close}
      title={
        <span className="flex items-center gap-2.5">
          <span className={cn('grid size-9 place-items-center rounded-[11px] edge-current', tone)}>
            <Icon className="size-4.5" />
          </span>
          {TIP_LABEL[tip.kind]}
        </span>
      }
      actions={
        <>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={showNext}>
              Next tip
            </Button>
            <Button variant="primary" className="flex-1" onClick={close}>
              Got it
            </Button>
          </div>
          <button
            type="button"
            onClick={() => tipStore.set({ enabled: false, open: false })}
            className="mx-auto min-h-11 rounded-control px-3 text-xs font-medium text-fg-subtle hover:text-fg-muted"
          >
            Don't show tips again
          </button>
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={index}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[6.5rem] text-[0.975rem] leading-relaxed text-fg"
        >
          {tip.text}
        </motion.p>
      </AnimatePresence>
    </Sheet>
  );
}
