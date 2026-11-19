import type { ReactNode } from 'react';
import { Compass, Lightbulb, Route, Users } from 'lucide-react';
import { Card, SectionHeader } from '../../../components/ui';
import type { OpeningSource } from '../types';

/** Ideas, plans, pawn structure and who the opening suits. */
export function OpeningOverview({ source }: { source: OpeningSource }) {
  const o = source.overview;
  return (
    <section>
      <SectionHeader title="Overview" />
      <Card className="space-y-4">
        <Block icon={<Lightbulb />} title="The idea">
          <p>{o.ideas}</p>
        </Block>
        <Block icon={<Route />} title="Typical plans">
          <ul className="space-y-1.5">
            {o.plans.map((plan) => (
              <li key={plan} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <span>{plan}</span>
              </li>
            ))}
          </ul>
        </Block>
        <Block icon={<Compass />} title="Pawn structure">
          <p>{o.structure}</p>
        </Block>
        <Block icon={<Users />} title="Who it suits">
          <p>{o.suits}</p>
        </Block>
      </Card>
    </section>
  );
}

export function Block({ icon, title, children, tone = 'bg-accent-soft text-accent-strong' }: { icon: ReactNode; title: string; children: ReactNode; tone?: string }) {
  return (
    <div className="flex gap-3">
      <span className={`grid size-8 shrink-0 place-items-center rounded-control [&_svg]:size-4 ${tone}`}>{icon}</span>
      <div className="min-w-0 flex-1 text-sm text-fg-muted">
        <h3 className="mb-1 font-sans text-sm font-semibold text-fg">{title}</h3>
        {children}
      </div>
    </div>
  );
}
