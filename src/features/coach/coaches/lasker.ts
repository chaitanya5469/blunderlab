import type { Coach } from '../types';

/** Practical and psychological: pose problems, fight on in bad positions, judge a move by its effect. */
export const lasker: Coach = {
  id: 'lasker',
  name: 'Emanuel Lasker',
  short: 'Lasker',
  born: 1868,
  died: 1941,
  style: 'Practical, psychological, a born fighter',
  bio: [
    'World Champion for 27 years, from 1894 to 1921, the longest reign in history.',
    'Also a mathematician with a doctorate; he lost the title to Capablanca in Havana in 1921.',
  ],
  avatar: { initials: 'EL', from: '#7da26f', to: '#1f3020', ink: '#eef7e8' },
  quotes: [
    {
      text: 'On the chessboard, lies and hypocrisy do not survive long.',
      source: "Lasker's Manual of Chess (1925), p. 235 of the 1960 Dover edition.",
      verified: 'Wikiquote, Emanuel Lasker, sourced Quotes section, checked 18 Nov 2026.',
      slots: ['blunder', 'loss', 'puzzleSolved'],
    },
  ],
  lines: {
    intro: [
      'A new fight. Remember: your opponent is a person, with nerves of their own.',
      'The {opening}. Know its ideas, not just its moves.',
      'Shall we? Look for the moments where the fight was decided.',
    ],
    own: {
      book: [
        'Book. Fine, but remember: methods, not memory.',
        'A known move. The fight starts soon enough.',
        'Theory. Your opponent knows it too; the game is decided later.',
        'In the {opening}. Steer toward positions you understand.',
      ],
      brilliant: ['{san}! A sacrifice that also puts a hard problem in front of your opponent.', 'Strong, and that is what makes it beautiful.', 'A real fighting move. {san} works.'],
      great: ["{san}, the only move under pressure. That is a fighter's move.", 'Found when it mattered. Good nerves.', 'Precise in a critical moment.'],
      best: [
        '{san}. Strong and practical.',
        'The best move. Keep posing problems.',
        'Correct. Make your opponent work.',
        'Good. Effective is beautiful.',
        '{san} asks the right question.',
      ],
      excellent: ['Very good. Practical chess.', '{san} keeps the fight going your way.', 'A strong, sensible move.', 'Not quite the top move, but it does the job.'],
      good: [
        '{san} is fine. {best} was a little more effective.',
        'Reasonable. {best} asked a harder question.',
        'Playable. {best} would have made your opponent think harder.',
      ],
      inaccuracy: [
        "{san} eases your opponent's task. {best} kept the pressure.",
        'An imprecision. {best} was more testing.',
        'A slip. Fight for every small edge.',
      ],
      mistake: [
        '{san} is a mistake. {best} held. Do not lose heart; the game goes on.',
        'An error. The fight is not over; make the next move a good one.',
        'This hurts. {best} was the practical choice.',
      ],
      miss: [
        'You had {best}. Opportunities must be taken when they appear.',
        'A chance went by. {best} would have decided.',
        "Missed {best}. Look for your opponent's weak spot each move.",
      ],
      blunder: [
        '{san} is a blunder. {best} was needed. Now fight on; resilience wins games.',
        'A serious slip. Even so, make your opponent prove it.',
        'This costs about {drop} of your chances. {best} held.',
      ],
      checkmate: ['Checkmate. The fight is won.', 'Mate. Well fought.'],
    },
    opp: {
      book: ['Your opponent is on familiar ground. Soon they will have to think.', 'Book from your opponent. Plan where to take them off it.'],
      brilliant: ['Your opponent sacrificed with {san}. Stay calm; they are also nervous.', 'A strong blow by your opponent. Find the practical defence.'],
      great: ['Your opponent found the one move. They are fighting too.', 'An accurate reply. Your opponent is not cracking.'],
      solid: [
        'Your opponent plays well. Give them harder questions.',
        'A good move from your opponent. Keep the tension.',
        'Your opponent keeps their footing.',
        'Solid from your opponent.',
      ],
      inaccuracy: ['Your opponent wavered with {san}. Press now.', 'An imprecision from your opponent. Nerves, perhaps. Test them.'],
      mistake: ['Your opponent erred with {san}. Now be practical: take the clear advantage.', 'A mistake from your opponent. The pressure told.'],
      miss: ['Your opponent missed their chance. Use the reprieve well.', 'You were let off. Find what they missed.'],
      blunder: ['Your opponent blundered with {san}. Take it calmly.', 'A big slip from your opponent. Do not relax now; finish the job.'],
      checkmate: ['Checkmate against you. Study where the fight turned.', 'Mate. Look for the moment you stopped fighting back.'],
    },
    phase: {
      opening: {
        good: ['Do not memorise; understand the method.', 'Get your pieces ready for a fight.'],
        bad: ['An opening is a method, not a list. Ask what each move is for.', 'Easy does it. A sound start leaves room for the fight.'],
      },
      middlegame: {
        good: ['Choose the move that is hardest for your opponent to meet.', 'Ask what your opponent wants, then deny it.'],
        bad: ['Before your own plan, ask what your opponent wants.', 'Under pressure, the simplest defence is often the best.'],
      },
      endgame: {
        good: ['Endings are won by patience and fight.', 'Keep posing problems, even with few pieces.'],
        bad: ['Endings punish haste. Take your time.', 'With few pieces, every tempo is a weapon.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. Strong, practical chess.', 'Very precise, {acc}%. Well fought.'],
        mid: ['A win earned by fighting. Good.', 'Well played. You made your opponent solve problems.'],
        low: ['A win. Note the moment your opponent cracked.', 'Won, though both sides wobbled. Practical chess, all the same.'],
      },
      draw: {
        high: ['A precise draw, {acc}%. Was there a way to keep the fight going?', 'Balanced and accurate. Next time, pose one more question.'],
        mid: ['A draw. Was there a way to keep the fight going?', 'Balanced. Next time, pose one more question.'],
        low: ['A draw from a scrappy fight. Steadier nerves next time.', 'Half a point. Look for where it might have been more.'],
      },
      loss: {
        high: ['A loss despite {acc}%. Find the one moment it turned.', 'You fought well. One question went unanswered; find it.'],
        mid: ['A loss. Find the moment and the method, not just the move.', 'A loss teaches. Find where you stopped asking questions.'],
        low: ['{acc}% accuracy. A scrappy fight. Steadier nerves next time.', 'Defeated, but not beaten for good. Learn and fight again.'],
      },
    },
    puzzle: {
      start: {
        mate: ['The king is in danger. Be decisive.', 'There is a forced win. Find it.', 'Mate in {n}. Calculate, then act.'],
        material: ['Something can be won. Look for the weak point.', 'Your opponent has left a gap. Exploit it.'],
        hanging: ['Something is left unprotected. Practical chess says: take it.', 'A loose piece. Find it.'],
        fork: ['Give your opponent two problems at once.', 'One move, two threats. Look for it.'],
        pin: ['A piece is frozen in place. Make use of it.', 'Something cannot move. Press on it.'],
        sacrifice: ['Giving something here creates a problem they cannot solve.', 'Material for a decisive initiative. Calculate it.'],
        discovered: ['One of your pieces is in the way of another.', 'Uncover the line.'],
        endgame: ['An ending. Patience and precision.', 'Few pieces. Every move must count.'],
        quiet: ['Defend with resolve. Find the stubborn move.', 'The threat is real. Meet it.'],
        promotion: ['A pawn is near the end of its road.', 'Find the way to promote.'],
        any: ['What is your opponent hoping for?', 'Find the move that solves the problem.', 'A concrete idea is here. Calculate.'],
      },
      wrong: ['No. Look for a better one.', 'Not it. What did that allow?', 'That fails. Fight on.'],
      wrongPlayed: ['{played} again. It failed in the game; find what it overlooks.', 'The game move. Think about what your opponent answers.'],
      solved: ['Well done. Practical and correct.', 'That is it. Good.', 'Found. Strong.'],
      assisted: ['Solved with help. Keep the method.', 'There. Next time without help.'],
      revealed: ['Here is the solution. Understand the method behind it.', 'Learn the idea, not the move.'],
      setEnd: {
        clean: ['A clean set. Steady nerves.', 'All found. Well fought.'],
        mixed: ['A fair set. The misses hold the method.', 'Decent. Study the ones that resisted.'],
        rough: ['A hard set. Slow down and fight each one.', 'Tough today. Come back to them.'],
      },
    },
  },
};
