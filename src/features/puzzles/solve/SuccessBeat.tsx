import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/cn';

/** Brief confirmation laid over the board when a puzzle is solved: a soft green wash and a "Solved" pill. */
export function SuccessBeat({ clean }: { clean: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-end justify-center pb-4" aria-hidden>
      <motion.div
        className="absolute inset-0 bg-best/14"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.25, 1] }}
      />
      <motion.div
        className={cn(
          'relative flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-[0_8px_24px_-6px_rgb(0_0_0/0.6)] [&_svg]:size-4.5',
          clean ? 'bg-best text-canvas' : 'bg-inaccuracy text-canvas',
        )}
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      >
        {clean ? <Sparkles /> : <Check />}
        Solved
      </motion.div>
    </div>
  );
}
