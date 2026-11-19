export type TipKind = 'history' | 'trivia' | 'tip' | 'app';

export interface Tip {
  kind: TipKind;
  text: string;
}

export const TIP_LABEL: Record<TipKind, string> = {
  history: 'Chess history',
  trivia: 'Did you know?',
  tip: 'Practical tip',
  app: 'BlunderLab tip',
};

/** Launch tips. Facts are well documented; anything uncertain was left out. */
export const TIPS: Tip[] = [
  // History
  { kind: 'history', text: 'Chess is generally traced to chaturanga, a game played in India by around the 6th or 7th century AD. It travelled through Persia, where it became shatranj, before reaching Europe.' },
  { kind: 'history', text: 'The word "checkmate" comes from the Persian "shāh māt", usually translated as "the king is helpless" or "the king is defeated".' },
  { kind: 'history', text: 'Before the late 15th century the queen could only step one square diagonally. Her modern long-range powers appeared in Spain and Italy, and the faster game was nicknamed "the mad queen\'s chess".' },
  { kind: 'history', text: 'The bishop descends from the alfil (elephant), which jumped exactly two squares diagonally. It became today\'s long-range bishop in the same reform that empowered the queen.' },
  { kind: 'history', text: 'En passant was added when pawns gained their two-square first move, so a pawn could not slip past an enemy pawn without risk of capture.' },
  { kind: 'history', text: 'The "Immortal Game" was played in London in 1851. Adolf Anderssen gave up a bishop, both rooks and his queen, then mated Lionel Kieseritzky with his minor pieces.' },
  { kind: 'history', text: 'Paul Morphy\'s "Opera Game" was played in 1858 in a box at the Paris Opera, against the Duke of Brunswick and Count Isouard. It is still a model of rapid development.' },
  { kind: 'history', text: 'The first official World Championship match was played in 1886. Wilhelm Steinitz beat Johannes Zukertort to become the first world champion.' },
  { kind: 'history', text: 'Vera Menchik became the first women\'s world champion in 1927 and held the title until her death in 1944.' },
  { kind: 'history', text: 'Alexander Alekhine is the only world champion to die while still holding the title, in 1946.' },
  { kind: 'history', text: 'Mikhail Tal, "the Magician from Riga", won the world title in 1960 with a daring, sacrificial style that still inspires attacking players.' },
  { kind: 'history', text: 'Bobby Fischer won the 1972 World Championship match against Boris Spassky in Reykjavik, at the height of the Cold War.' },
  { kind: 'history', text: 'Garry Kasparov beat IBM\'s Deep Blue 4–2 in 1996. In the 1997 rematch Deep Blue won 3½–2½, the first match win by a computer over a reigning world champion.' },
  { kind: 'history', text: 'Vladimir Kramnik used the Berlin Defence to neutralise Kasparov\'s 1.e4 in their 2000 World Championship match, and the "Berlin Wall" became a top-level favourite.' },
  { kind: 'history', text: 'The Elo rating system is named after Arpad Elo, a Hungarian-American physics professor. FIDE adopted it in 1970.' },

  // Trivia
  { kind: 'trivia', text: 'White has 20 possible first moves: 16 pawn moves and 4 knight moves. After one move by each side there are 400 possible positions.' },
  { kind: 'trivia', text: 'The fastest possible checkmate is Fool\'s Mate: 1.f3 e5 2.g4 Qh4#. Black mates on move two.' },
  { kind: 'trivia', text: 'In 1950 Claude Shannon estimated the number of possible chess games at around 10^120, far more than the number of atoms in the observable universe.' },
  { kind: 'trivia', text: '"Zugzwang" is German for "compulsion to move": a position where any move you make worsens it.' },
  { kind: 'trivia', text: '"Fianchetto" is Italian for "little flank". It means developing a bishop to the long diagonal after a pawn move like g3 or b6.' },
  { kind: 'trivia', text: '"J\'adoube" (French for "I adjust") is what you say over the board before straightening a piece, so touch-move does not apply.' },
  { kind: 'trivia', text: 'Magnus Carlsen reached a classical rating of 2882 in 2014, the highest in the history of the FIDE rating list.' },
  { kind: 'trivia', text: 'In 2021 Abhimanyu Mishra became the youngest grandmaster in history, at 12 years and 4 months.' },
  { kind: 'trivia', text: 'Judit Polgár is widely regarded as the strongest female player ever. She is the only woman to have reached the world\'s overall top ten.' },
  { kind: 'trivia', text: 'Bobby Fischer patented a chess clock that adds time after every move. That increment is the "+2" in a 3+2 game.' },
  { kind: 'trivia', text: 'Fischer also proposed Chess960, where the back-rank pieces are shuffled into one of 960 starting positions to take opening theory out of the game.' },
  { kind: 'trivia', text: 'Every position with seven pieces or fewer on the board has been solved: endgame tablebases give the perfect result for each one.' },
  { kind: 'trivia', text: 'King and two knights cannot force checkmate against a lone king, although a mate is possible if the defender blunders.' },
  { kind: 'trivia', text: 'King, bishop and knight against a lone king is a forced win, but it can take up to 33 moves with perfect play. Many players never learn it.' },
  { kind: 'trivia', text: 'Since 2014 FIDE rules end a game automatically after a fivefold repetition or 75 moves without a capture or pawn move.' },

  // Practical tips
  { kind: 'tip', text: 'Before every move, check checks, captures and threats, for both sides. It is the simplest way to stop hanging pieces.' },
  { kind: 'tip', text: 'After your opponent moves, ask what changed: what does the moved piece attack now, and what did it stop defending?' },
  { kind: 'tip', text: 'Loose pieces drop off. Undefended pieces are the targets of most forks and double attacks.' },
  { kind: 'tip', text: 'In the opening, develop knights and bishops, fight for the centre and castle. Avoid moving the same piece twice without a reason.' },
  { kind: 'tip', text: 'An early queen sortie can be chased around by developing moves. Against Qh5 and Bc4 aiming at f7, ...g6 or ...Qe7 holds.' },
  { kind: 'tip', text: 'Give your king some air. A pawn move like h3 (or ...h6) after castling can save you from a back-rank mate.' },
  { kind: 'tip', text: 'Rooks belong on open files. Two rooks doubled on an open file, or one on your opponent\'s second rank, are often decisive.' },
  { kind: 'tip', text: 'Put rooks behind passed pawns, yours or your opponent\'s. The rook gains scope as the pawn advances.' },
  { kind: 'tip', text: 'A knight on the rim is dim: from the edge it controls at most four squares, from the centre up to eight.' },
  { kind: 'tip', text: 'When you are ahead in material, trade pieces, not pawns. The fewer pieces left, the bigger your extra one matters.' },
  { kind: 'tip', text: 'In the endgame the king is a fighting piece. Bring it towards the centre once the queens are off.' },
  { kind: 'tip', text: 'Learn the rule of the square: if the defending king can step into the square of a passed pawn, it catches the pawn.' },
  { kind: 'tip', text: 'Bishop and rook pawn can be a draw: if the bishop cannot cover the promotion corner, the defending king just sits there.' },
  { kind: 'tip', text: 'Two famous rook endgames are worth knowing: the Lucena position (build a bridge to promote) and the Philidor position (defend from the third rank).' },
  { kind: 'tip', text: 'When you find a good move, look for a better one. A second look takes seconds and saves games.' },
  { kind: 'tip', text: 'Do not spend half your clock in the opening of a rapid game. Save time for the critical middlegame moments.' },
  { kind: 'tip', text: 'Promoting to a knight is sometimes best: it can come with check or a fork when a queen would not.' },

  // App
  { kind: 'app', text: 'Puzzles from your games come back on a schedule: solve one cleanly and it returns later; miss it and it returns soon. Due puzzles come first.' },
  { kind: 'app', text: 'In Game Review, try your own moves on the board. The playground shows the engine\'s view of your idea without leaving the game.' },
  { kind: 'app', text: 'Your Lichess puzzle rating starts from your Chess.com rating, then moves with every puzzle you solve or miss.' },
  { kind: 'app', text: 'Analysis runs on your phone with Stockfish. A deeper setting in Settings is more accurate but slower.' },
  { kind: 'app', text: 'Your streak allows one rest day a week. Miss a single day and the streak survives; miss two in a row and it starts over.' },
  { kind: 'app', text: 'Lessons are learned once with arrows, then practised from memory. A lesson counts as complete once every line is played cleanly.' },
];
