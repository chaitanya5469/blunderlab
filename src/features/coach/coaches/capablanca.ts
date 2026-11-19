import type { Coach } from '../types';

/** Calm, effortless simplicity: clear plans, small edges, endgames. */
export const capablanca: Coach = {
  id: 'capablanca',
  name: 'José Raúl Capablanca',
  short: 'Capablanca',
  born: 1888,
  died: 1942,
  style: 'Effortless simplicity, clear plans, endgames',
  bio: [
    'Cuban World Champion from 1921 to 1927; he took the title from Emanuel Lasker in Havana.',
    'Famed for his clear style and endgame technique; author of Chess Fundamentals (1921).',
  ],
  avatar: { initials: 'JC', from: '#4b8fc8', to: '#16304a', ink: '#e7f1fb' },
  quotes: [
    {
      text: 'In order to improve your game you must study the endgame before anything else',
      source: "Capablanca's Last Chess Lectures (1966), p. 23 (opening words of a longer sentence).",
      verified: 'Wikiquote, José Raúl Capablanca, sourced Quotes section, checked 18 Nov 2026.',
      slots: ['endgame', 'setEnd', 'intro'],
    },
  ],
  lines: {
    intro: [
      'A new game. Let us look for the plan behind the moves.',
      'The {opening}. Know its plans and you will rarely be lost in it.',
      'Shall we? Keep it simple, and the mistakes will show themselves.',
    ],
    own: {
      book: [
        'Known ground. Play it, but know why each move is there.',
        'Theory is fine. Understanding it is better.',
        'A sensible opening move. Now think about the plan it serves.',
        'Still in the {opening}. Understanding matters more than memory here.',
      ],
      brilliant: [
        '{san}! A sacrifice, and a correct one. I prefer it simple, but this is simply strong.',
        'Beautiful, and more importantly, sound. {san} works.',
        'When the calculation is right, even a sacrifice is the simple move. {san} is.',
      ],
      great: [
        '{san} was the only good move, and you found it. Calmly done.',
        'Precise. The other moves were clearly worse.',
        'The position asked one question and {san} answered it.',
      ],
      best: [
        '{san}. Clean and correct.',
        'The natural move, and the best one. That is usually how it goes.',
        'Good. No complications, just the right move.',
        '{san}: exactly what the position wanted.',
        'Simple and strong. Nothing more is needed.',
      ],
      excellent: ['{san} is very good. Nearly the best, and perfectly playable.', 'A sound move. Keep it simple like this.', 'Solid. You lost nothing worth speaking of.', 'Good enough to win with, if the plan is clear.'],
      good: [
        '{san} is reasonable. {best} was a little more exact.',
        'Playable, though {best} kept things cleaner.',
        'Fine, but small edges add up. {best} was slightly better.',
        'A decent move. The cleaner path was there, though.',
      ],
      inaccuracy: [
        '{san} is a little loose. {best} kept the position simpler.',
        'An imprecision. With {best} the plan stays clear.',
        'Not a disaster, but {best} was the cleaner way.',
        'A small inexactness. These are what make endings difficult later.',
      ],
      mistake: [
        '{san} makes life hard. {best} kept everything under control.',
        'A mistake. Before moving, ask what your opponent threatens.',
        'This one costs something. {best} was the clear way.',
      ],
      miss: [
        'There was something better here: {best}. Look at every capture and check first.',
        'A chance slipped by. {best} would have made things easy.',
        'You missed {best}. Opportunities in chess rarely knock twice.',
      ],
      blunder: [
        '{san} gives too much away. {best} was needed.',
        'A blunder. Slow down when the position looks simple; that is when it bites.',
        'This changes the game: about {drop} of your chances gone. {best} held everything together.',
      ],
      checkmate: ['Checkmate. The cleanest ending there is.', 'Mate. Nothing more to say.', 'Mate, and neatly done.'],
    },
    opp: {
      book: ['Your opponent is still in the book. Nothing to fear yet.', 'Standard play from your opponent. Keep your pieces coordinated.'],
      brilliant: ['Your opponent found {san}, a real sacrifice. Respect it and study it.', 'A fine blow by your opponent. Ask yourself where you allowed it.'],
      great: ['Your opponent found the one move with {san}. Credit where due.', 'An accurate reply from your opponent. The position was holding by a thread.'],
      solid: [
        'Your opponent played a correct move. Stay patient.',
        'A good move from your opponent. Nothing changes much.',
        'Your opponent keeps things in order.',
        'Sound play from your opponent. Keep improving your pieces.',
      ],
      inaccuracy: ['Your opponent drifted with {san}. A clear plan now would punish it.', 'An imprecise move from your opponent. Look for the simple improvement.'],
      mistake: ['Your opponent erred with {san}. Now find the simple way to use it.', 'A real mistake from your opponent. Calm, accurate moves will make it count.'],
      miss: ['Your opponent missed a chance there. You got away with something; find out what.', 'Lucky. Your opponent had better than {san}.'],
      blunder: ['Your opponent blundered with {san}. Now take it cleanly, no hurry.', 'A big error from your opponent. Simplify and collect.'],
      checkmate: ['Checkmate against you. Go back and find the moment the danger began.', 'Mate. Look at where your king lost its defenders.'],
    },
    phase: {
      opening: {
        good: ['Develop, castle, connect the rooks. No need to be clever yet.', 'Every opening move should help the pieces work together.'],
        bad: ['In the opening, the simple developing move is rarely wrong.', 'Do not hurry. Develop first, then look for a plan.'],
      },
      middlegame: {
        good: ['Have a plan, even a simple one. A plan beats a bag of tricks.', 'Improve your worst piece; the rest often follows.'],
        bad: ['Without a plan, moves become guesses.', 'Ask what the position needs, not what looks active.'],
      },
      endgame: {
        good: ['Endgames reward precision. Activate the king.', 'Good technique. The ending is where games are really won.'],
        bad: ['In the ending, one careless move can undo the whole game.', 'Endings need patience. Count the tempi before moving.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. Clean, simple, strong.', 'Very precise play: {acc}%. Simplicity pays.'],
        mid: ['A win built on sound moves. That is the way.', 'Well played. Keep it this clear and the results follow.'],
        low: ['A good win, though harder than needed. Find the moments that made it so.', 'You won, but simpler play would have saved some nerves.'],
      },
      draw: {
        high: ['A clean draw, {acc}%. Balanced, and fairly so.', 'Accurate on both sides. Study the endgame part; points hide there.'],
        mid: ['A draw. Look for the moment the advantage could have been kept.', 'Level. A clearer plan may have tipped it.'],
        low: ['A draw from a ragged game. Fewer complications next time.', 'Level, though loose along the way.'],
      },
      loss: {
        high: ['A loss despite {acc}%. One moment decided it.', 'You played well. Find the single turning point.'],
        mid: ['A loss teaches more than a win. Find the turning point.', 'Not your day. Look at the biggest swing and understand it.'],
        low: ['{acc}% accuracy. Play the clear move; slow down and check the threats.', 'Losses happen. The cure is usually simpler play, not trickier play.'],
      },
    },
    puzzle: {
      start: {
        mate: ['The king is exposed. Find the forcing way.', 'There is a clean finish here. Checks first.', 'Mate in {n}. Calculate it to the end.'],
        material: ['Material is there to be won. Look at undefended pieces.', 'Count the attackers and defenders.'],
        hanging: ['Something is loose. Count the attackers and defenders.', 'A piece is not properly protected.'],
        fork: ['Two targets, one attacker. Look for it.', 'The pieces are placed for a double attack.'],
        pin: ['A piece cannot move without exposing another. Use that.', 'Look at the lines through the pieces.'],
        sacrifice: ['Sometimes the simple move gives something back.', 'Material is only worth what it does.'],
        discovered: ['A line is hidden behind one of your pieces.', 'Move one piece and let another speak.'],
        endgame: ['An ending. Precision matters more than speed.', 'Few pieces, so every tempo counts.'],
        quiet: ['First, see the danger. Then find the simple move.', 'Not every puzzle is an attack. A calm move may decide.'],
        promotion: ['A pawn is close to queening. Help it.', 'Clear the way for the pawn.'],
        any: ['Look at the whole board before touching a piece.', 'Find the move that makes everything simple.', 'A tactic is hiding. Look at how the pieces line up.'],
      },
      wrong: ['Not that. Check what your opponent can do in reply.', 'No. Look again, more simply.', 'That allows too much. Try another idea.'],
      wrongPlayed: ['{played} is the game move, and it was not right then either.', 'That repeats the game. Look for the cleaner idea.'],
      solved: ['Exactly. Clean.', 'Well found. Simple, once you see it.', 'Correct, and without fuss.'],
      assisted: ['Solved, with some help. It will be easier next time.', 'There it is. Remember the pattern.'],
      revealed: ['Study the line. Patterns come back.', 'This is the idea. It will look obvious next time.'],
      setEnd: {
        clean: ['A clean set. Steady, accurate work.', 'Every one first try. Very sound.'],
        mixed: ['A decent set. The misses are the ones worth studying.', 'Good work. Revisit the ones that needed help.'],
        rough: ['A hard set. Slow down and look at every check and capture.', 'Difficult today. Patterns stick with repetition.'],
      },
    },
  },
};
