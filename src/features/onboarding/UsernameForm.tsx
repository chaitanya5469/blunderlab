import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { fetchPlayer, fetchRatings, NotFoundError } from '../../lib/chesscom';
import type { Profile } from '../../lib/types';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';

/** Username input validated against the Chess.com public API. */
export function UsernameForm({ onFound }: { onFound: (p: Profile) => void }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const username = value.trim().toLowerCase();
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const [player, ratings] = await Promise.all([fetchPlayer(username), fetchRatings(username).catch(() => ({}))]);
      onFound({
        id: 'owner',
        username,
        displayName: player.username,
        name: player.name,
        avatar: player.avatar,
        url: player.url,
        ratings,
        createdAt: Date.now(),
        ratingsFetchedAt: Date.now(),
      });
    } catch (err) {
      setError(
        err instanceof NotFoundError
          ? `No Chess.com player called “${value.trim()}”. Check the spelling and try again.`
          : err instanceof Error
            ? err.message
            : 'Something went wrong. Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="username" className="mb-2 block text-sm font-medium text-fg-muted">
        Your Chess.com username
      </label>
      <div
        className={cn(
          'flex h-13 items-center rounded-control border bg-surface-1 pl-4 transition-colors focus-within:border-accent',
          error ? 'border-blunder/60' : 'border-line',
        )}
      >
        <span className="text-fg-subtle" aria-hidden>
          @
        </span>
        <input
          id="username"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="username"
          aria-invalid={!!error}
          aria-describedby={error ? 'username-error' : undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-base text-fg outline-none placeholder:text-fg-subtle"
        />
      </div>
      <p id="username-error" role="alert" className={cn('mt-2 min-h-5 text-sm text-blunder', !error && 'invisible')}>
        {error ?? ' '}
      </p>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-2 w-full"
        loading={loading}
        disabled={!value.trim()}
      >
        {loading ? 'Looking you up' : 'Find my games'}
        {!loading && <ArrowRight className="size-5" aria-hidden />}
      </Button>
      <p className="mt-3 text-center text-xs text-fg-subtle">Stored only on this device. No account, no server.</p>
    </form>
  );
}
