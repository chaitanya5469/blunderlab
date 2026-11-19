import type { Coach } from '../types';

/** Elegant and quick: rapid development, open lines, the initiative before material. */
export const morphy: Coach = {
  id: 'morphy',
  name: 'Paul Morphy',
  short: 'Morphy',
  born: 1837,
  died: 1884,
  style: 'Elegant: rapid development and open lines',
  bio: [
    'An American from New Orleans who won the First American Chess Congress in 1857.',
    'On his tour of Europe in 1858–59 he beat the leading masters, then gave up serious chess while still young.',
  ],
  avatar: { initials: 'PM', from: '#d4ac5a', to: '#4a3517', ink: '#fff6e2' },
  quotes: [
    {
      text: "It [chess] is eminently and emphatically the philosopher's game.",
      source: 'Testimonials to Paul Morphy: Presented at University Hall, New York (May 25, 1859), p. 13.',
      verified: 'Wikiquote, Paul Morphy, sourced Quotes section (and the Chess page, section M), checked 18 Nov 2026.',
      slots: ['intro', 'setEnd', 'win'],
    },
  ],
  lines: {
    intro: [
      "Let's begin. Pieces out quickly, king safe, and then we open the lines.",
      'The {opening}. A fine battlefield. Let us see who develops faster.',
      'A new game. Watch the tempo above all else.',
    ],
    own: {
      book: [
        'A good developing move. Bring the pieces out quickly.',
        'The opening is a race: pieces out, king safe, lines open.',
        'Sound theory. Now keep the tempo.',
        'Still in the {opening}. Develop briskly and look for open lines.',
        'In the {opening}, tempo is everything.',
      ],
      brilliant: [
        '{san}! Material is nothing when the pieces fly.',
        'Lovely. A sacrifice that opens the way for everything else.',
        'That is chess played with style. {san} is sound.',
        '{san} gives material for time, and time is worth more here.',
      ],
      great: [
        '{san}, the only move to keep the initiative. Well seen.',
        'Precise. The attack lives on.',
        'The single right path, found.',
        'Only {san} kept your pieces in the game. Bravo.',
      ],
      best: [
        '{san}. Quick and to the point.',
        'The best move. Keep the pieces active.',
        'Correct. Tempo matters, and you used it.',
        'Just right. The position flows.',
        '{san} brings another piece to life.',
      ],
      excellent: ['A fine move. The pieces stay lively.', '{san} keeps everything in harmony.', 'Very good. On to the next.', 'Nearly the best, and quite in the spirit of the position.'],
      good: [
        '{san} is fine, though {best} was more energetic.',
        'Reasonable. {best} would have opened the game more.',
        'Playable, yet slow. {best} was quicker.',
        'A modest move. The position wanted more activity.',
      ],
      inaccuracy: [
        '{san} loses a tempo. {best} kept the pieces flowing.',
        'Too slow. With {best} the lines would open for you.',
        'A small drift. Development first, always.',
        'An imprecision. Your pieces were asking to come out.',
      ],
      mistake: [
        '{san} lets the initiative slip. {best} was the move.',
        'A mistake. When behind in development, do not open the game for your opponent.',
        'This costs you. {best} kept your pieces in play.',
        'Here the game turns against you. {best} held the initiative.',
      ],
      miss: [
        'There was a blow here: {best}. Look for open lines toward the king.',
        'A chance passed. {best} would have struck.',
        'You missed {best}. When the pieces are out, look for the strike.',
      ],
      blunder: [
        '{san} hands over the game. {best} was necessary.',
        'A blunder. Look at every open line before you move.',
        'Too costly: about {drop} of your chances gone. {best} kept you standing.',
        'A painful slip. Even the quickest player must look once more.',
      ],
      checkmate: ['Checkmate. A fine finish.', 'Mate! The pieces worked together to the end.', 'Mate. Every piece played its part.'],
    },
    opp: {
      book: ['Your opponent develops too. Make sure you are a move ahead.', 'Book from your opponent. Watch which lines may open.'],
      brilliant: ['Your opponent sacrificed with {san}, and it works. Admire it, then learn it.', 'A fine stroke from your opponent. Open lines cut both ways.'],
      great: ['Your opponent found the one good move. The fight goes on.', 'Accurate defence from your opponent with {san}.'],
      solid: [
        'Your opponent plays well. Keep your development ahead.',
        'A good move by your opponent. Do not fall behind in tempo.',
        'A solid answer from your opponent.',
        'Your opponent holds steady.',
      ],
      inaccuracy: ['Your opponent hesitated with {san}. Strike while they are slow.', 'An imprecision from your opponent. Open a line before they recover.'],
      mistake: ['Your opponent erred with {san}. Now open the lines!', 'A mistake from your opponent. Bring every piece into the attack.'],
      miss: ['Your opponent missed something there. Close the door quickly.', 'Fortune smiled: your opponent did not see their chance.'],
      blunder: ['Your opponent blundered with {san}. Punish it with energy.', 'A gift from your opponent. Take it and keep developing.'],
      checkmate: ['Checkmate against you. See which line opened onto your king.', 'Mate. Too many of your pieces stayed at home.'],
    },
    phase: {
      opening: {
        good: ['Pieces out, king castled, then attack. In that order.', 'Every move should develop or open a line. This one does.'],
        bad: ['In the opening, a lost tempo is a lost game in miniature.', 'Develop first; adventures later.'],
      },
      middlegame: {
        good: ['Find the open file and put a rook on it.', 'Active pieces first; material can wait.'],
        bad: ['A passive piece is half a piece. Bring it into play.', 'When the lines open, every slow move is punished.'],
      },
      endgame: {
        good: ['Even in the endgame, the active piece is the strong one.', 'The king is a strong piece now. Use it.'],
        bad: ['In the ending every tempo counts double.', 'Activity, even here. The passive side suffers.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. Fluent, active chess.', 'A spirited win, and a precise one: {acc}%.'],
        mid: ['A win. Note the moments your pieces came alive.', 'Well played, and in good style.'],
        low: ['A win, though a scrappy one. Develop faster and it gets easier.', 'You won, but the pieces were slow at times.'],
      },
      draw: {
        high: ['A clean draw at {acc}%. Perhaps there was an open line to use.', 'Accurate and level. Next time, seize the initiative earlier.'],
        mid: ['A draw. Was there an open line you did not use?', 'Even. More energy in the opening may tip the next one.'],
        low: ['A draw from a ragged game. Development first, then the fight.', 'Level in the end, though loose along the way.'],
      },
      loss: {
        high: ['A loss despite {acc}%. A single moment decided it; find it.', 'You played well and still lost. Look at the one turning point.'],
        mid: ['A loss. Check whether you fell behind in development.', 'Defeat. Look for the moment your pieces became passive.'],
        low: ['{acc}% accuracy. Bring the pieces out and the rest grows easier.', 'It happens to all. Develop faster next time.'],
      },
    },
    puzzle: {
      start: {
        mate: ['The king has few defenders. Strike!', 'Open lines lead to the king. Find the blow.', 'Mate in {n}. Every check counts.'],
        material: ['Something can be won. Look for the loose piece.', 'Material is on offer. Be quick.'],
        hanging: ['A piece stands without support. Find it.', 'Something is hanging. Be quick.'],
        fork: ['One piece can strike two targets here.', 'Look for a double attack.'],
        pin: ['A piece is tied to a more valuable one behind it.', 'Look along the lines: something is pinned.'],
        sacrifice: ['Give something to open the way. It is worth it.', 'Material can be offered here. Time is worth more.'],
        discovered: ['Move one piece and another strikes behind it.', 'Unmask a line.'],
        endgame: ['An ending. Activity wins it.', 'Few pieces left. The active one decides.'],
        quiet: ['Not every good move is a capture.', 'A calm move can be the strongest one.'],
        promotion: ['A pawn is dreaming of becoming a queen.', 'Clear the path for the pawn.'],
        any: ['Find the most active move.', 'Look for the move that opens the game.', 'The pieces are poised. Look for the stroke.'],
      },
      wrong: ['No. Too slow; look for something sharper.', 'Not that. Where are the open lines?', 'That lets the opponent breathe. Try again.'],
      wrongPlayed: ['{played} again. It did not work in the game; something sharper does.', 'That was your game move. Look for a more forcing one.'],
      solved: ['Bravo. Quick and clean.', 'That is the stroke.', 'Lovely. Exactly so.'],
      assisted: ['Found in the end. Remember the shape of it.', 'There it is. Next time, faster.'],
      revealed: ['See how the lines open. Learn the pattern.', 'That is the idea. It will come again.'],
      setEnd: {
        clean: ['A fine set. Every blow landed.', 'All first try. Elegant work.'],
        mixed: ['Good. A few strokes still to learn.', 'Decent work. The misses hold the lesson.'],
        rough: ['A hard set. Look for checks and captures first.', 'Difficult. Patterns come with practice.'],
      },
    },
  },
};
