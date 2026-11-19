import { Fish, ShieldCheck, Swords, TriangleAlert, Undo2 } from 'lucide-react';
import { Card, SectionHeader } from '../../../components/ui';
import { moveLabel, sideName, type TrapLesson } from '../lib/catalog';
import { Block } from './OpeningOverview';

const Move = ({ children }: { children: string }) => <span className="font-semibold text-fg tnum">{children}</span>;

/** The anatomy of a trap: bait, mistake, punishment, the safe alternative, and the defence. */
export function TrapOverview({ lesson }: { lesson: TrapLesson }) {
  const s = lesson.source;
  const trap = lesson.playables.find((p) => p.line.role === 'trap')!;
  const decline = lesson.playables.find((p) => p.line.role === 'decline' && !p.defend);
  const mistake = trap.mistakeIndex !== undefined ? trap.plies[trap.mistakeIndex] : undefined;
  const victim = sideName(s.side === 'white' ? 'black' : 'white');

  return (
    <section>
      <SectionHeader title="How it works" />
      <Card className="space-y-4">
        <Block icon={<Fish />} title="The bait">
          <p>
            {sideName(s.side)} plays <Move>{s.bait}</Move> in the {s.opening}.
          </p>
        </Block>
        {mistake && (
          <Block icon={<TriangleAlert />} title="The natural mistake" tone="bg-blunder/14 text-blunder">
            <p>
              <Move>{moveLabel(mistake.moveNumber, mistake.color, mistake.san + (mistake.glyph ?? ''))}</Move> {mistake.note}
            </p>
          </Block>
        )}
        <Block icon={<Swords />} title="The punishment" tone="bg-best/14 text-best">
          <p>{trap.line.summary}</p>
        </Block>
        {decline && (
          <Block icon={<Undo2 />} title={`If ${victim} doesn't fall for it`}>
            <p>{decline.line.summary}</p>
          </Block>
        )}
        <Block icon={<ShieldCheck />} title="On the receiving end">
          <p>{s.avoid}</p>
        </Block>
        {!s.sound && (
          <p className="rounded-control bg-inaccuracy/10 px-3 py-2.5 text-sm text-fg-muted">
            <span className="font-semibold text-inaccuracy">Objectively dubious. </span>
            Against accurate defence the trap-setter usually ends up worse. Fun in fast games; risky in serious ones.
          </p>
        )}
      </Card>
    </section>
  );
}
