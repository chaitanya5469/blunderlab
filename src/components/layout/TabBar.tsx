import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, House, ListChecks, Puzzle, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

const TABS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/games', label: 'Games', icon: ListChecks },
  { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
];

/**
 * Bottom navigation. Nearly opaque instead of a backdrop blur: blurring the scrolling
 * content underneath costs every frame on a phone WebView.
 */
export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-line-soft bg-canvas/[0.97] pb-safe shadow-[0_-12px_32px_-12px_rgb(0_0_0/0.7)]"
    >
      <div className="pointer-events-none absolute inset-x-6 -top-px h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.08),transparent)]" aria-hidden />
      <ul className="flex h-tabbar items-stretch px-2">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              data-guide={`tab-${label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-full flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors',
                  isActive ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted active:text-fg-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-14 place-items-center transition-transform duration-150 group-active:scale-90">
                    {isActive && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-full bg-accent-soft shadow-[inset_0_1px_0_rgb(147_176_255/0.18),inset_0_0_0_1px_rgb(111_149_255/0.14)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className={cn('relative size-5', isActive && 'text-accent-strong')} strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
