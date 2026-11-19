import { Check, MessageSquareOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CoachAvatar } from './CoachAvatar';
import { COACHES } from './engine';
import type { CoachChoice } from './types';

/** The honesty note shown wherever a coach is chosen. */
export function CoachNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-fg-subtle', className)}>
      Dialogue is written in each player's style; only text in quotation marks is their real words. Coaches comment on the engine's findings; they did not
      analyse your games.
    </p>
  );
}

interface CoachPickerProps {
  value: CoachChoice;
  onChange: (v: CoachChoice) => void;
  /** Show the selected coach's short bio under his row. */
  showBio?: boolean;
}

/** "No coach" plus one row per coach: avatar, name, dates and style. */
export function CoachPicker({ value, onChange, showBio = true }: CoachPickerProps) {
  return (
    <div role="radiogroup" aria-label="Coach" className="space-y-1">
      {COACHES.map((c) => {
        const on = value === c.id;
        return (
          <div key={c.id} className={cn('rounded-control transition-colors', on ? 'bg-accent-soft ring-1 ring-accent/35' : '')}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(c.id)}
              className={cn('flex min-h-14 w-full items-center gap-3 rounded-control px-2 py-1.5 text-left', !on && 'press-row')}
            >
              <CoachAvatar coach={c} mood={on ? 'pleased' : 'neutral'} className="size-12" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {c.name} <span className="font-normal text-fg-subtle tnum">{c.born}–{c.died}</span>
                </span>
                <span className="block truncate text-xs text-fg-muted">{c.style}</span>
              </span>
              {on && <Check className="size-4.5 shrink-0 text-accent-strong" aria-hidden />}
            </button>
            {on && showBio && (
              <ul className="space-y-1 px-3 pb-2.5 pl-[4.25rem] text-xs text-fg-muted">
                {c.bio.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <button
        type="button"
        role="radio"
        aria-checked={value === 'none'}
        onClick={() => onChange('none')}
        className={cn(
          'flex min-h-14 w-full items-center gap-3 rounded-control px-2 py-1.5 text-left transition-colors',
          value === 'none' ? 'bg-accent-soft ring-1 ring-accent/35' : 'press-row',
        )}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-3 text-fg-muted">
          <MessageSquareOff className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">No coach</span>
          <span className="block text-xs text-fg-muted">Plain move notes, no dialogue</span>
        </span>
        {value === 'none' && <Check className="size-4.5 shrink-0 text-accent-strong" aria-hidden />}
      </button>
    </div>
  );
}
