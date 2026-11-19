import type { Coach } from '../types';

/** Quirky and systematic: prophylaxis, blockade, overprotection, key squares. */
export const nimzowitsch: Coach = {
  id: 'nimzowitsch',
  name: 'Aron Nimzowitsch',
  short: 'Nimzowitsch',
  born: 1886,
  died: 1935,
  style: 'Quirky: blockade, prophylaxis, overprotection',
  bio: [
    'Born in Riga, he later settled in Copenhagen; a leading figure of the hypermodern school.',
    'His book My System (1925) is a classic, and the Nimzo-Indian Defence bears his name.',
  ],
  avatar: { initials: 'AN', from: '#9a80de', to: '#24183f', ink: '#f1ecff' },
  quotes: [
    {
      text: 'The threat is stronger than the execution.',
      source: 'Skakbladet 9 (1933), p. 137 (on the effect of a queen).',
      verified: 'Wikiquote, Aron Nimzowitsch, Quotes section, checked 18 Nov 2026.',
      slots: ['puzzleStart', 'great'],
    },
    {
      text: 'The beauty of a move lies not in its appearance but in the thought behind it.',
      source: 'Quoted in Fred Reinfeld, Nimzovich the Hypermodern (1948).',
      verified: 'Wikiquote, Aron Nimzowitsch, Quotes section, checked 18 Nov 2026.',
      slots: ['brilliant', 'puzzleSolved'],
    },
  ],
  lines: {
    intro: [
      'Ah, a new game. Tell me: which squares did you care about?',
      'The {opening}. Mind the key squares.',
      'Let us see whose plans were restrained, and whose ran free.',
    ],
    own: {
      book: [
        'Book. But do you know which squares this move controls?',
        'Theory, yes. The centre can be controlled from afar, too.',
        'A known move. Now find the key square.',
        'In the {opening}. Control matters more than occupation.',
      ],
      brilliant: ['{san}! A sacrifice with a deep idea behind it.', 'A splendid stroke. The thought behind it is sound.', 'Remarkable. Material given, and a square won.'],
      great: ['{san}, the only move. Prophylaxis of the highest order.', 'Precisely the move the position needed.', "The only one. You saw the opponent's idea first."],
      best: [
        '{san}. Exactly. The key square is yours.',
        'Best. Strong points must be overprotected.',
        'Correct. Prevent before you act.',
        'Good. A move with a thought behind it.',
        '{san}: quiet, and quietly strong.',
      ],
      excellent: ['Very good. Restraint is a virtue.', '{san} keeps everything under control.', 'A fine positional move.', 'A sound move. The blockade holds.'],
      good: [
        '{san} is acceptable. {best} was more prophylactic.',
        "Fine, but {best} stopped your opponent's idea first.",
        'Playable. {best} guarded the strong point better.',
      ],
      inaccuracy: [
        '{san} allows your opponent an idea. {best} would have prevented it.',
        'An imprecision. Think first: what does my opponent want?',
        'Slightly careless. {best} kept the blockade.',
      ],
      mistake: ['{san} is a mistake. {best} was the prophylactic move.', 'An error. You forgot your opponent also has plans.', 'This gives up a key square. {best} kept it.'],
      miss: ['There was {best}. You looked at your plans and not the board.', 'A chance missed: {best}.', 'You missed {best}. Every capture deserves a glance.'],
      blunder: [
        '{san} is a blunder. {best} was necessary.',
        'A blunder. Ask first what your opponent threatens. Always.',
        'This is costly, about {drop} of your chances. {best} would have held.',
      ],
      checkmate: ['Checkmate. Well done.', 'Mate. The pieces cooperated beautifully.'],
    },
    opp: {
      book: ['Your opponent occupies the centre. Perhaps let them, then undermine it.', 'Book from your opponent. Note their pawn chain; its base is the target.'],
      brilliant: ['Your opponent sacrificed with {san}. A deep thought; study it.', 'A fine idea by your opponent. Which square did you neglect?'],
      great: ['Your opponent found the only move. Annoying, but correct.', 'Accurate from your opponent. They see your plans.'],
      solid: [
        'Your opponent plays correctly. Restrain their plans.',
        'A good move from your opponent. What are they planning?',
        'Your opponent keeps a firm position.',
        'Solid from your opponent. Look for a square to occupy.',
      ],
      inaccuracy: ['Your opponent loosened their grip with {san}. Occupy the square.', 'An imprecision from your opponent. Blockade the weakness.'],
      mistake: ['Your opponent erred with {san}. Restrain, blockade, then destroy.', 'A mistake from your opponent. Their weakness is now permanent.'],
      miss: ['Your opponent missed something. Shore up your strong points.', 'You escaped. Overprotect next time.'],
      blunder: ['Your opponent blundered with {san}. Take it, and keep the blockade.', 'A gift from your opponent. Accept it, calmly.'],
      checkmate: ['Checkmate against you. The defenders were not overprotected.', 'Mate. Prophylaxis would have stopped it earlier.'],
    },
    phase: {
      opening: {
        good: ['Control the centre, even from a distance.', 'A pawn chain: attack its base.'],
        bad: ['The centre is not only for occupying. Control it.', 'Mind the key squares before the pieces arrive.'],
      },
      middlegame: {
        good: ['First restrain, then blockade, then destroy.', 'Ask what your opponent wants, then prevent it.'],
        bad: ['Prophylaxis! What was your opponent planning?', 'An unguarded strong point invites the enemy.'],
      },
      endgame: {
        good: ['A passed pawn must be blockaded. Or pushed.', 'The king is a strong piece now. Centralise it.'],
        bad: ['A passed pawn left free is a criminal on the loose.', 'In the ending, the blockade decides. Mind it.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. A systematic game.', 'Very precise, {acc}%. Admirable control.'],
        mid: ["A win. Your opponent's plans were held in check.", 'Well played. Restraint paid.'],
        low: ['A win. Look at which prophylactic moves would have made it easy.', 'Won, but loosely. There is a system in your errors; find it.'],
      },
      draw: {
        high: ['An accurate draw, {acc}%. Perhaps one more prophylactic move would have done it.', 'Precise and level. Find the square both of you neglected.'],
        mid: ['A draw. Perhaps one more prophylactic move would have done it.', 'Even. Find the square both of you neglected.'],
        low: ["A loose draw. Think about your opponent's plans first.", 'Level, but untidy. Overprotect your strong points.'],
      },
      loss: {
        high: ['A loss despite {acc}%. One square decided it; find it.', 'Narrowly lost. Which plan of theirs went unrestrained?'],
        mid: ['A loss. Ask, at each turning point: what did my opponent want?', "Defeat. Your opponent's plans went unrestrained."],
        low: ['{acc}% accuracy. Too little prophylaxis.', 'A loss. Study it; there is a system in your errors.'],
      },
    },
    puzzle: {
      start: {
        mate: ["The king's defenders are too few. Find it.", 'A mating idea is here. Find it.', 'Mate in {n}. Count the defenders.'],
        material: ['A piece is under-protected. Exploit it.', 'Something stands without guard.'],
        hanging: ['A piece is not overprotected. Not protected at all, in fact.', 'Something hangs. Take note, and take it.'],
        fork: ['The pieces are poorly coordinated. Find the double attack.', 'Two weak points, one move.'],
        pin: ['A pinned piece cannot defend. Exploit it.', 'A piece is chained to its post.'],
        sacrifice: ['Give a little, gain a square. Find the idea.', 'A sacrifice with a thought behind it.'],
        discovered: ['A piece stands in its own line. Move it with effect.', 'Something is hidden behind one of your pieces.'],
        endgame: ['An ending. Blockade or push?', 'The king and the passed pawn decide.'],
        quiet: ['Prophylaxis first. What is the threat?', 'Find the move that prevents.'],
        promotion: ['The passed pawn has a lust to expand. Let it.', 'A pawn is near the eighth rank. Escort it.'],
        any: ['What is the key square?', 'Find the move with a thought behind it.', 'The pieces are poorly coordinated. Find the trick.'],
      },
      wrong: ['No. What does your opponent threaten?', 'Not it. Think about the key square.', 'That fails. Look again, more carefully.'],
      wrongPlayed: ['{played}, as in the game. The same thought, the same flaw.', 'You repeat the game move. Ask what it allows.'],
      solved: ['Exactly. A thought behind it.', 'Correct. Very good.', 'Found. Splendid.'],
      assisted: ['Solved with help. Note the key square.', 'There. Remember the idea.'],
      revealed: ['Study the thought behind the solution.', 'Here is the idea. It will return.'],
      setEnd: {
        clean: ['A clean set. Systematic.', 'All found. Admirable.'],
        mixed: ['A fair set. The misses show a pattern.', 'Decent. Study the errors systematically.'],
        rough: ['A hard set. Ask about threats first.', 'Difficult. Return to them.'],
      },
    },
  },
};
