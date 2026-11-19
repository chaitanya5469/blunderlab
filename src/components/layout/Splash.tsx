import { Logo } from './Logo';

/** Shown for the instant the local database is being opened. */
export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Logo className="size-12 animate-pulse" />
    </div>
  );
}
