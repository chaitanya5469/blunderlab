import { Check } from 'lucide-react';
import type { Profile } from '../../lib/types';
import { Avatar, Button, Card } from '../../components/ui';
import { RatingChips } from '../../components/RatingChips';

interface ProfileConfirmProps {
  profile: Profile;
  saving: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export function ProfileConfirm({ profile, saving, onConfirm, onBack }: ProfileConfirmProps) {
  return (
    <div>
      <p className="text-sm font-medium text-accent-strong">Found you</p>
      <h1 className="mt-1 text-3xl font-semibold">Is this your account?</h1>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar} name={profile.displayName} className="size-16 text-2xl" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold">{profile.displayName}</p>
            {profile.name && <p className="truncate text-sm text-fg-muted">{profile.name}</p>}
          </div>
        </div>
        <RatingChips ratings={profile.ratings} className="mt-5" />
      </Card>

      <div className="mt-8 flex flex-col gap-2">
        <Button variant="primary" size="lg" onClick={onConfirm} loading={saving} icon={<Check className="size-5" />}>
          Yes, sync my games
        </Button>
        <Button variant="ghost" size="lg" onClick={onBack} disabled={saving}>
          Not me
        </Button>
      </div>
    </div>
  );
}
