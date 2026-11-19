import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Standard page padding inside the app column. Every routed screen should use it. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-gutter pb-8', className)}>{children}</div>;
}
