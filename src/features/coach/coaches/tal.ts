import type { Coach } from '../types';

/** Joyful and fearless: sacrifices, complications, the initiative at any price. */
export const tal: Coach = {
  id: 'tal',
  name: 'Mikhail Tal',
  short: 'Tal',
  born: 1936,
  died: 1992,
  style: 'Joyful, sacrificial, fearless',
  bio: [
    'From Riga; he beat Mikhail Botvinnik in 1960 to become the eighth World Champion, aged 23.',
    'He lost the 1961 return match, and is remembered for his daring sacrifices.',
  ],
  avatar: { initials: 'MT', from: '#3ad0e0', to: '#0e2f44', ink: '#e6fbff' },
  quotes: [
    {
      text: 'To play for a draw, at any rate with White, is to some degree a crime against chess.',
      source: 'The Life and Games of Mikhail Tal (1997 edition).',
      verified: 'Wikiquote, Mikhail Tal, sourced Quotes section, checked 18 Nov 2026.',
      slots: ['draw'],
    },
    {
      text: '…not only was I worried, but so was my opponent.',
      source: 'The Life and Games of Mikhail Tal (1997 edition); excerpt, in the wording given on Wikiquote (translations vary).',
      verified: 'Wikiquote, Mikhail Tal, sourced Quotes section, checked 18 Nov 2026.',
      slots: ['loss', 'puzzleStart'],
    },
  ],
  lines: {
    intro: [
      'A new game! Let us look for the sacrifices, played and unplayed.',
      'The {opening}. Look for the sharp lines.',
      'Ah, good. Let us see where the adventure was.',
    ],
    own: {
      book: [
        'Book. Fine, fine. The fun starts later.',
        'Theory. Let us get to the interesting part.',
        'A known move. Somewhere ahead is a sacrifice waiting.',
        'In the {opening}. Where is the adventure?',
      ],
      brilliant: ['{san}! Wonderful. Throw the pieces in and let them burn.', 'A sacrifice, and a sound one. I am delighted.', 'Ah, {san}! This is why we play chess.'],
      great: ['{san}, the only move, found in a storm. Excellent.', 'Precise when it mattered. Bravo.', 'The one move. You kept your head.'],
      best: ['{san}. Very good.', 'Best. Now, is there a sacrifice next?', 'Correct. The game is alive.', 'Good. Keep stirring it.', '{san}, and the position keeps bubbling.'],
      excellent: ['Very nice. Everything still in play.', '{san}: fine, lively chess.', 'A strong move.', 'Good. Your opponent still has problems.'],
      good: ['{san} is fine. {best} was spicier.', 'Playable. {best} asked more questions.', 'Okay. With {best} the game would be livelier.'],
      inaccuracy: ['{san} is a little timid. {best}!', 'An imprecision. {best} kept the fire going.', 'A tiny slip. Nothing a little courage cannot fix.'],
      mistake: ['{san} is a mistake. {best} was the way. Never mind; play on bravely.', 'An error. Even so, keep the position complicated.', 'Ouch. {best} was the move.'],
      miss: ['There was {best}! A chance for fireworks, missed.', 'You missed {best}. Look for sacrifices every move.', 'A beautiful chance went by: {best}.'],
      blunder: ['{san} is a blunder. {best} was needed. Smile and fight on.', 'A blunder. It happens to everyone.', 'That hurts: about {drop} of your chances. {best} held.'],
      checkmate: ['Checkmate! Wonderful.', 'Mate. A happy ending.'],
    },
    opp: {
      book: ['Your opponent is still in the book. Soon the forest begins.', 'Book from your opponent. Plan the complications.'],
      brilliant: ['Your opponent sacrificed with {san}. A beautiful move; enjoy it, then learn it.', 'Your opponent had some fun there. Fair enough.'],
      great: ['Your opponent found the only move. They are good.', 'Accurate defence from your opponent. Make it harder.'],
      solid: ['Your opponent plays well. Make the position wilder.', 'A good move from your opponent.', 'Your opponent holds steady.', 'Solid from your opponent. Time to stir things up.'],
      inaccuracy: ['Your opponent wobbled with {san}. Go for them.', 'An imprecision from your opponent. Attack while they think.'],
      mistake: ['Your opponent erred with {san}. Now be bold!', 'A mistake by your opponent. Make them pay with energy.'],
      miss: ['Your opponent missed their trick. Lucky you.', 'You escaped. Your opponent had a combination.'],
      blunder: ['Your opponent blundered with {san}. Take it and keep attacking.', 'A present from your opponent. Accept with thanks.'],
      checkmate: ['Checkmate against you. Well, now you know the trick.', 'Mate. Next time, you set the trap.'],
    },
    phase: {
      opening: {
        good: ['Get the pieces out; the fun is coming.', 'Develop quickly, then complicate.'],
        bad: ['Hurry up and develop. The adventure needs pieces.', 'A slow opening means a dull game. Speed!'],
      },
      middlegame: {
        good: ['Is there a sacrifice? Look. There often is.', 'Make the position complicated. Your opponent must find the way out.'],
        bad: ['Complications are fine, but calculate a little too.', 'When it gets wild, check the checks first.'],
      },
      endgame: {
        good: ['Even endings can be lively. Activate everything.', 'Push the passed pawn. It is happy to run.'],
        bad: ['Endings have tricks too, for both sides.', 'Few pieces, but plenty of danger. Careful.'],
      },
    },
    summary: {
      win: {
        high: ['{acc}% accuracy. Fearless and correct.', 'Very precise, {acc}%. Lovely.'],
        mid: ['A win! And fun, I hope.', 'Well played. Lively chess.'],
        low: ['A win. Wild! But chess forgives the brave.', 'Won. Look for the sacrifice you did not play.'],
      },
      draw: {
        high: ['A precise draw, {acc}%. Next time, take a risk.', 'Correct, and level. A little more courage, perhaps.'],
        mid: ['A draw. Next time, take a risk.', 'Even. A little more courage, perhaps.'],
        low: ['A messy draw. Courage plus calculation next time.', 'Half a point from a wild game. Fair enough.'],
      },
      loss: {
        high: ['A loss despite {acc}%. Never mind. Play the next one boldly.', 'Close. One trick decided it; learn it.'],
        mid: ['A loss. Never mind. Play the next one boldly.', 'Lost. Learn the trick, then use it yourself.'],
        low: ['{acc}% accuracy. A messy game. Courage plus calculation next time.', 'Lost, but you will win the next adventure.'],
      },
    },
    puzzle: {
      start: {
        mate: ['The king is waiting. Go and get him.', 'There is a mate. Be fearless.', 'Mate in {n}! Find it.'],
        material: ['There is material to win. Find the trick.', 'Something is up for grabs.'],
        hanging: ['Something is loose. Grab it with style.', 'A piece is all alone. Poor thing.'],
        fork: ['One piece, two victims. Find it.', 'A double attack, I think.'],
        pin: ['Something is pinned. Squeeze it.', 'A piece cannot move. Wonderful.'],
        sacrifice: ['A sacrifice! Look at every one.', 'Give something away. It will come back.'],
        discovered: ['A hidden attacker is waiting.', 'Move one piece, and surprise!'],
        endgame: ['An ending, but still a trick in it.', 'Few pieces. Find the clever move.'],
        quiet: ['Defend, then strike back. Calmly.', 'Danger. Find the cool reply.'],
        promotion: ['A pawn wants to be a queen. Help it!', 'Push, push. Find the way.'],
        any: ['Look for the bold move.', 'Find the move that surprises.', 'Something pretty is here. Find it.'],
      },
      wrong: ['Not that one. Try something bolder.', 'No. Look at the sacrifices.', 'Close. Again!'],
      wrongPlayed: ['{played}, like in the game! Something braver, please.', 'That is your game move. Surprise me instead.'],
      solved: ['Bravo! Lovely.', 'That is it. Beautiful.', 'Yes! Wonderful.'],
      assisted: ['Solved. Next time, alone.', 'There it is. Now you know.'],
      revealed: ['Look how pretty the solution is.', 'Here is the trick. Now it is yours.'],
      setEnd: {
        clean: ['A clean set! Magic.', 'All found. Wonderful.'],
        mixed: ['A good set. The misses are the fun ones to study.', 'Not bad. Look at the ones that got away.'],
        rough: ['A hard set. Tomorrow you will see them.', 'Tough. Look for the sacrifices first.'],
      },
    },
  },
};
