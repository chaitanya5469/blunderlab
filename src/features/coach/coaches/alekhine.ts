import type { Coach } from '../types';

/** Fierce and ambitious: the initiative, deep combinations, objective self-criticism. */
export const alekhine: Coach = {
  id: 'alekhine',
  name: 'Alexander Alekhine',
  short: 'Alekhine',
  born: 1892,
  died: 1946,
  style: 'Fierce, ambitious, deep combinations',
  bio: [
    'Russian-born, later French; he took the world title from Capablanca in Buenos Aires in 1927.',
    'He lost it to Max Euwe in 1935, won it back in 1937, and died in 1946 still champion.',
  ],
  avatar: { initials: 'AA', from: '#c6584f', to: '#3a1210', ink: '#fdeceb' },
  quotes: [
    {
      text: 'Chess first of all teaches you to be objective.',
      source: 'Quoted in M. Yudovich and A. Kotov, The Soviet School of Chess, p. 42.',
      verified: 'Wikiquote, Alexander Alekhine, sourced Quotes section (not the Disputed section), checked 18 Nov 2026.',
      slots: ['blunder', 'loss', 'setEnd'],
    },
  ],
  lines: {
    intro: [
      'A new game. Look for the moment the initiative changed hands.',
      'The {opening}. Look for ways to take the initiative.',
      'Let us see whether you played with ambition.',
    ],
    own: {
      book: [
        'Book. Prepare the ground for the attack to come.',
        'A known move. Look already for where to fight.',
        'Theory. The real game starts when you leave it.',
        'In the {opening}. Prepare a fight.',
      ],
      brilliant: ['{san}! A deep, correct sacrifice. Magnificent.', 'This is chess as art. {san} works.', 'A combination of real depth. Bravo.'],
      great: ['{san}, the only move that keeps the initiative. Powerful.', 'Precise and ambitious. Well done.', 'The one move. You saw deep.'],
      best: [
        '{san}. The strongest move.',
        'Best. Keep the pressure constant.',
        'Correct. Now make the next one sharper still.',
        'Excellent. The initiative stays with you.',
        '{san}, and your opponent must keep finding answers.',
      ],
      excellent: ['Very good. The pressure holds.', '{san} keeps you pressing.', 'A strong move.', 'Good. Ambition, without recklessness.'],
      good: [
        '{san} is playable, but {best} was more ambitious.',
        'Adequate. {best} kept more fire.',
        'Fine. Yet {best} demanded more from your opponent.',
      ],
      inaccuracy: ['{san} loses some initiative. {best} was sharper.', 'An imprecision. With {best} you keep the attack.', 'Too timid. {best} was the move.'],
      mistake: ['{san} is a mistake. {best} kept your attack alive.', 'An error. Be objective about the danger.', 'This costs the initiative. {best} was needed.'],
      miss: ['A combination was there: {best}. Look deeper.', 'You missed {best}. The attack was ready.', 'A chance passed. Calculate every forcing move.'],
      blunder: ['{san} is a blunder. {best} was necessary.', 'A heavy error: about {drop} of your chances. {best} held.', 'A blunder. Calculate before you strike, every time.'],
      checkmate: ['Checkmate. A powerful finish.', 'Mate! The attack is complete.'],
    },
    opp: {
      book: ['Your opponent follows the book. Prepare to take the initiative.', 'Book from your opponent. Find where to unbalance it.'],
      brilliant: ['Your opponent struck with {san}, and it is sound. A deep idea.', 'A strong combination by your opponent. Study it closely.'],
      great: ['Your opponent found the only move. A worthy adversary.', 'Accurate defence. Your opponent is resisting.'],
      solid: ['Your opponent plays strongly. Do not yield the initiative.', 'A good move from your opponent.', 'Your opponent holds on.', 'Solid from your opponent. Raise the stakes.'],
      inaccuracy: ['Your opponent drifted with {san}. Attack!', 'An imprecision from your opponent. Take the initiative now.'],
      mistake: ['Your opponent erred with {san}. Now go for it with full force.', 'A mistake by your opponent. Calculate deeply and punish it.'],
      miss: ['Your opponent missed their combination. Fortunate.', 'You were spared. Find what they missed.'],
      blunder: ['Your opponent blundered with {san}. Strike decisively.', 'A gift from your opponent. Do not hesitate.'],
      checkmate: ['Checkmate against you. Find where the initiative was lost.', 'Mate. Study the attack you underestimated.'],
    },
    phase: {
      opening: {
        good: ['Leave the opening with the initiative.', 'Prepare the attack from the first moves.'],
        bad: ['A passive opening hands your opponent the initiative.', 'Even in the opening, every move must fight for something.'],
      },
      middlegame: {
        good: ['Calculate deeply. The combination may be closer than it looks.', 'Keep the initiative; never give it back for free.'],
        bad: ['Ambition needs calculation behind it.', 'You let your opponent breathe. Never do that.'],
      },
      endgame: {
        good: ['Even here, find the active plan.', 'Endings demand the same ambition, with precision.'],
        bad: ['In the ending, too, passivity loses.', 'Precision first; the ending forgives nothing.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. Powerful and precise.', 'Very precise: {acc}%. Ambitious and correct.'],
        mid: ['A strong win. The initiative paid.', 'Well played, with ambition.'],
        low: ['A win. Study where you could have struck sooner.', 'Won, but erratic. Ambition needs calculation behind it.'],
      },
      draw: {
        high: ['An accurate draw, {acc}%. Was there a combination you did not attempt?', 'Precise, but the fight ended early. Seek more.'],
        mid: ['A draw. Was there a combination you did not attempt?', 'Even. Fight harder for the initiative.'],
        low: ['A draw from an erratic game. Calculate before you strike.', 'Level, after too many errors on both sides.'],
      },
      loss: {
        high: ['A loss despite {acc}%. One moment decided it; analyse it honestly.', 'You played well and lost. Find the single turning point.'],
        mid: ['A loss. Analyse it honestly, move by move.', 'Defeat. Find where you lost the initiative.'],
        low: ['{acc}% accuracy. Ambition needs calculation behind it.', 'An erratic game. Calculate before you strike.'],
      },
    },
    puzzle: {
      start: {
        mate: ['The king is vulnerable. Find the attack.', 'A mating attack is here. Calculate it fully.', 'Mate in {n}. See it to the end.'],
        material: ['Material can be won by force. Look deeper.', 'There is a forcing win of material.'],
        hanging: ['Something is unprotected. Take it by force.', 'A loose piece. Find the forcing way.'],
        fork: ['A double attack is waiting.', 'Two targets. Strike both.'],
        pin: ['A pinned piece is a weakness. Exploit it.', 'Look along the lines through the pieces.'],
        sacrifice: ['A combination is waiting. Calculate.', 'Look deep. A sacrifice may open everything.'],
        discovered: ['A hidden battery. Unleash it.', 'One move uncovers another threat.'],
        endgame: ['An ending. Find the active plan.', 'Even with few pieces, there is a sharp idea.'],
        quiet: ['Defend precisely, then counter-attack.', 'Find the resource that holds.'],
        promotion: ['A pawn wants to promote. Force it through.', 'The pawn is the attacker here.'],
        any: ['Find the strongest move.', 'Look for the most forcing line.', 'Look deep. The idea is there.'],
      },
      wrong: ['No. Calculate further.', 'Not that. Look deeper.', 'That fails. Find the forcing move.'],
      wrongPlayed: ['{played}: the game move again. It was refuted then.', 'You repeat the game. Be objective; find the stronger move.'],
      solved: ['Precisely. A fine combination.', 'Exactly. Strong.', 'Found. Powerful.'],
      assisted: ['Solved, with help. Now see it alone next time.', 'There. Remember how deep it went.'],
      revealed: ['Study it to the end of the line.', 'Here is the combination. Learn its shape.'],
      setEnd: {
        clean: ['A clean set. Sharp work.', 'Every one found. Powerful.'],
        mixed: ['A fair set. Calculate further on the misses.', 'Good. Study the ones that escaped you.'],
        rough: ['A hard set. Calculate more before moving.', 'Tough. Return and look deeper.'],
      },
    },
  },
};
