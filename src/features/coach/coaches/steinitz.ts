import type { Coach } from '../types';

/** Stern principles: accumulate small advantages, attack only when the position justifies it. No sourced quote found, so none is used. */
export const steinitz: Coach = {
  id: 'steinitz',
  name: 'Wilhelm Steinitz',
  short: 'Steinitz',
  born: 1836,
  died: 1900,
  style: 'Stern principles and small advantages',
  bio: [
    'Born in Prague; he became the first official World Champion by beating Johannes Zukertort in 1886.',
    'He held the title until 1894, and his ideas laid the foundations of positional play.',
  ],
  avatar: { initials: 'WS', from: '#8a97a8', to: '#232a35', ink: '#eef2f7' },
  quotes: [],
  lines: {
    intro: [
      'We begin. Remember: attack only when the position has earned it.',
      'The {opening}. Sound, if played on principle.',
      'A new game. Watch for weaknesses; they are permanent.',
    ],
    own: {
      book: [
        'Theory, yes. But theory must obey principles.',
        'A principled opening move. Continue so.',
        'Known moves. Know the reasons behind them.',
        'In the {opening}, keep your structure healthy.',
      ],
      brilliant: [
        '{san}. A sacrifice, and the position justifies it. That is the only kind I accept.',
        'Sound. The attack was earned by the position, not wished into it.',
        'A correct sacrifice. Your advantages had grown enough to allow it.',
      ],
      great: ['{san}: the only move that respects the position. Correct.', 'Precise. The alternatives broke principle.', 'The single sound move. Well judged.'],
      best: [
        '{san}. Correct by principle.',
        'The best move. Add advantage to advantage.',
        'Sound. Each good move is a small deposit.',
        'Correct. Keep accumulating.',
        '{san} gives nothing away. Good.',
      ],
      excellent: ['Very good. Nothing given away.', '{san} is sound.', 'A good move; the structure stays healthy.', 'Solid. The balance of advantages is unchanged.'],
      good: [
        '{san} is acceptable. {best} kept a small advantage.',
        'Playable, but small advantages are not to be wasted. {best} was better.',
        'Adequate. {best} was more principled.',
        'A trifle conceded. Trifles add up.',
      ],
      inaccuracy: [
        '{san} weakens something. {best} was sounder.',
        'An imprecision. Every weakness is permanent; avoid them.',
        'Unprincipled. {best} kept the position healthy.',
      ],
      mistake: [
        '{san} breaks principle. {best} was required.',
        'A mistake. You attacked, or retreated, without cause.',
        'This gives your opponent a lasting advantage. {best} was the move.',
      ],
      miss: [
        'You had earned more: {best}. Take what the position offers.',
        'A chance missed. {best} would have converted your advantage.',
        '{best} was there. Advantages must be cashed in at the right moment.',
      ],
      blunder: [
        '{san} is a grave error. {best} was necessary.',
        "A blunder. Check the opponent's threats before your own plans.",
        'This loses about {drop} of your chances. {best} held.',
      ],
      checkmate: ['Checkmate. The logical end of correct play.', 'Mate. Well concluded.'],
    },
    opp: {
      book: ['Your opponent follows the book. Principles will decide later.', 'Standard play from your opponent. Note their structure.'],
      brilliant: ['Your opponent sacrificed with {san}, and it is sound. Their advantages were real.', 'A justified blow by your opponent. Where did you give them the right to attack?'],
      great: ['Your opponent found the only good move. Sound play.', 'Accurate from your opponent. Do not expect errors.'],
      solid: ['Your opponent plays correctly. Be patient.', 'A sound move by your opponent.', 'Your opponent keeps a sound position.', 'A solid reply from your opponent.'],
      inaccuracy: ['Your opponent weakened their position with {san}. Exploit it slowly.', 'A small error from your opponent. Collect it.'],
      mistake: ['Your opponent erred with {san}. Now accumulate pressure; do not rush.', 'A real weakness from your opponent. Fix it as a target.'],
      miss: ['Your opponent missed their chance. Repair the damage at once.', 'You escaped. Your opponent had better than {san}.'],
      blunder: ['Your opponent blundered with {san}. Take it, then consolidate.', 'A serious error from your opponent. Collect the material soundly.'],
      checkmate: ['Checkmate against you. Your king was weakened earlier; find when.', 'Mate. Study the weaknesses around your king.'],
    },
    phase: {
      opening: {
        good: ['Do not attack before the position permits it.', 'Avoid weaknesses now; they last all game.'],
        bad: ['An early weakness is a debt you pay all game.', 'Premature action in the opening is punished by principle.'],
      },
      middlegame: {
        good: ['Accumulate small advantages. The attack comes later, by right.', 'Find the weakness. Then press on it.'],
        bad: ['Without an advantage, an attack is only hope.', 'Defend soundly first; counter-chances come to the patient.'],
      },
      endgame: {
        good: ['The king is a strong piece in the ending. Bring it forward.', 'Small advantages become decisive now. Convert them.'],
        bad: ['In the ending, a single weak pawn decides.', 'Exactness, now more than ever.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. Principled and correct.', 'Very precise, {acc}%. Sound chess.'],
        mid: ['A win built on sound play. As it should be.', 'Correct play earned this.'],
        low: ['A win, but check which advantages you left uncollected.', 'Won, though not on principle. Study it as if you had lost.'],
      },
      draw: {
        high: ['A sound draw, {acc}%. Neither side earned more.', 'Correct on both sides. Seek small advantages earlier.'],
        mid: ['A draw. Neither side earned more.', 'Even. Seek small advantages earlier next time.'],
        low: ['A draw after unsound play. Return to principles.', 'Level, though not by correct means.'],
      },
      loss: {
        high: ['A loss despite {acc}%. One weakness decided it; find it.', 'Defeated narrowly. Find the first concession.'],
        mid: ['A loss. Find the first weakness you allowed.', 'Defeat follows broken principles. Find which one.'],
        low: ['{acc}% accuracy. Too many unsound moves. Return to principles.', 'Lost. Study it without excuses.'],
      },
    },
    puzzle: {
      start: {
        mate: ['The king is weakened. The attack is justified.', 'The position has earned a decisive attack.', 'Mate in {n}. Calculate it soundly.'],
        material: ['Material is available. Take it soundly.', 'A weakness can be collected. Find it.'],
        hanging: ['A piece lacks protection. That is a weakness.', 'Something is undefended. Collect it.'],
        fork: ['Two weaknesses, one move.', 'A double attack is possible here.'],
        pin: ['A piece is bound to its post. Exploit it.', 'Look at the pieces standing on one line.'],
        sacrifice: ['Your advantages allow a concrete stroke.', 'The position permits a sacrifice. Verify it.'],
        discovered: ['One piece hides another. Use the line.', 'A line can be opened with gain of time.'],
        endgame: ['An ending. Convert the small advantage.', 'Few pieces. Principles decide.'],
        quiet: ['Defend first. A sound defence is not passive.', 'Meet the threat correctly; no heroics.'],
        promotion: ['The passed pawn must be pushed.', 'A pawn nears promotion. Support it.'],
        any: ['What does the position demand?', 'Find the principled move.', 'The position permits a combination. Find it.'],
      },
      wrong: ['Unsound. Look again.', "No. That ignores the position's needs.", 'Incorrect. Check the threats.'],
      wrongPlayed: ['{played}: the same error as in the game. Look deeper.', 'You repeat the game move. It was unsound then.'],
      solved: ['Correct.', 'Sound and precise.', 'Exactly. Well judged.'],
      assisted: ['Solved with help. Study why it works.', 'Correct in the end. Repeat it.'],
      revealed: ['Study the solution. Understand its logic.', 'Here is the correct line. Learn the principle.'],
      setEnd: {
        clean: ['A clean set. Disciplined work.', 'All correct. Sound.'],
        mixed: ['Adequate. Study the errors.', 'Some errors. Learn from each.'],
        rough: ['A poor set. Slow down and check every threat.', 'Difficult. Return to these patterns.'],
      },
    },
  },
};
