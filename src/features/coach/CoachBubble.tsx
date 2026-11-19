import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Sheet } from '../../components/ui';
import { useSettings } from '../../hooks/useServices';
import { cn } from '../../lib/cn';
import { settingsStore } from '../../lib/settings';
import { CoachAvatar } from './CoachAvatar';
import { CoachNote, CoachPicker } from './CoachPicker';
import type { Coach, CoachChoice, CoachLine } from './types';

interface CoachBubbleProps {
  coach: Coach;
  line: CoachLine;
  /** Clamp long lines to two rows until tapped (for the small review panel). */
  compact?: boolean;
  /** Avatar size override (e.g. 'size-20' for the game summary). */
  avatarClassName?: string;
  /** Plain follow-up sentences shown under the line (e.g. the game summary's facts). */
  notes?: string[];
  className?: string;
}

/**
 * The coach's avatar and a speech bubble. Tapping the avatar opens a quick coach switch.
 * Real quotes appear in quotation marks with "in his own words"; written lines never do.
 */
export function CoachBubble({ coach, line, compact, avatarClassName, notes, className }: CoachBubbleProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Coach: ${coach.name}. Change coach`}
        className="shrink-0 rounded-full pressable focus-visible:outline-2 focus-visible:outline-accent"
      >
        <CoachAvatar coach={coach} mood={line.mood} className={avatarClassName ?? (compact ? 'size-10' : 'size-12')} />
      </button>
      <div className={cn('relative min-w-0 flex-1 rounded-[14px] rounded-tl-[5px] border border-line-soft bg-surface-2 px-3', compact ? 'py-1.5' : 'py-2')}>
        {!compact && (
          <p className="text-2xs font-semibold text-fg-subtle">
            {coach.short}
            {line.quote && <span className="font-normal"> · in his own words</span>}
          </p>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={line.text}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={compact ? () => setExpanded((e) => !e) : undefined}
            className={cn('text-sm leading-snug text-fg', compact && !expanded && 'line-clamp-2', compact && 'cursor-pointer')}
          >
            {compact && (
              <span className="mr-1.5 text-xs font-semibold text-fg-subtle">
                {coach.short}
                {line.quote && <span className="font-normal"> in his own words</span>}
              </span>
            )}
            <span className={cn(line.quote && 'italic')}>{line.quote ? `“${line.text}”` : line.text}</span>
          </motion.p>
        </AnimatePresence>
        {notes && notes.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-line-soft pt-2">
            {notes.map((n) => (
              <li key={n} className="text-sm leading-snug text-fg-muted">
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>
      <CoachSwitchSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/** Bottom sheet for switching coach (or turning coaching off) from anywhere a bubble shows. */
export function CoachSwitchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const choose = (coach: CoachChoice) => {
    settingsStore.set({ coach });
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Choose your coach"
      description={<CoachNote />}
      actions={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="-mx-2 max-h-[48vh] overflow-y-auto overscroll-contain px-2">
        <CoachPicker value={(settings.coach as CoachChoice) ?? 'none'} onChange={choose} showBio={false} />
      </div>
    </Sheet>
  );
}
