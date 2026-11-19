import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'sicilian-najdorf',
  name: 'Sicilian Defence: Najdorf',
  side: 'black',
  order: 2,
  eco: 'B90–B99',
  thumb: 10,
  tagline: 'Trade a wing pawn for a centre pawn and fight for the win.',
  match: ['e4 c5'],
  overview: {
    ideas:
      'Black answers 1.e4 with 1...c5 and trades the c-pawn for White\'s d-pawn. That leaves Black with two central pawns against one and a half-open c-file. The Najdorf move 5...a6 keeps White\'s pieces off b5 and prepares ...e5 or ...e6 and queenside expansion with ...b5.',
    plans: [
      'Play ...e5 to claim the centre, then ...Be6, ...Be7, ...O-O and ...Nbd7.',
      'Use the half-open c-file and ...b5-b4 for queenside play.',
      'Against anti-Sicilians (2.c3, 3.Bb5+) develop simply and strike back with ...d5.',
    ],
    structure: 'After the Open Sicilian: Black pawns on d6 and e5 (or e6) against White\'s e4, with a hole on d5 that both sides fight over.',
    suits: 'Ambitious players who want unbalanced positions and winning chances with Black, and are willing to learn some theory.',
  },
  lines: [
    {
      id: 'english-attack',
      name: 'Najdorf vs 6.Be3',
      summary: 'White castles long and pushes the kingside pawns; Black races on the queenside.',
      moves: `1.e4 1...c5 {Fights for d4 from the side and unbalances the game from move one.}
        2.Nf3 2...d6 {Controls e5 and keeps the e-pawn flexible.}
        3.d4 3...cxd4 {Trades a wing pawn for a centre pawn.}
        4.Nxd4 4...Nf6 {Develops with tempo on e4, so White must spend a move defending it.}
        5.Nc3 5...a6 {The Najdorf: covers b5 and prepares ...e5 or ...b5.}
        6.Be3 {The English Attack setup: f3, Qd2, long castling and g4.}
        6...e5 {Kicks the d4 knight and grabs central space.}
        7.Nb3 7...Be6 {Develops and fights for d5, the key square in front of the d6 pawn.}
        8.f3 8...Be7 {Prepares to castle before the kingside pawns arrive.}
        9.Qd2 9...O-O {Castles; Black's king is safer than it looks, because White needs time for g4-g5.}
        10.O-O-O 10...Nbd7 {Covers c5 and f6 and keeps the option of ...Nb6.}
        11.g4 11...b5 {Starts the counterattack: ...b4 will chase the c3 knight away from d5 and e4.}`,
    },
    {
      id: 'be2',
      from: 'english-attack',
      name: 'Najdorf vs 6.Be2',
      summary: 'The classical approach; Black takes the centre with ...e5 and develops calmly.',
      moves: `6.Be2 {A quiet, classical development.}
        6...e5 {Gains central space with tempo on the d4 knight.}
        7.Nb3 7...Be7 {Develops and prepares to castle.}
        8.O-O 8...O-O {Black castles; the king is safe and the position is balanced.}
        9.Be3 9...Be6 {Fights for d5 and prepares ...Nbd7 and ...Rc8.}
        10.Qd2 10...Nbd7 {Supports ...b5 and keeps the f6 knight protected.}
        11.a4 {Stops ...b5.}
        11...Rc8 {The rook takes the half-open c-file. Black has a sound, active position.}`,
    },
    {
      id: 'moscow',
      from: 'english-attack',
      name: 'Moscow: 3.Bb5+',
      summary: 'White avoids the Open Sicilian; Black trades bishops and strikes with ...d5.',
      moves: `3.Bb5+ {White checks to trade pieces and avoid theory.}
        3...Bd7 {Blocks and offers a trade of light-squared bishops.}
        4.Bxd7+ 4...Qxd7 {Recaptures; the knight can still develop to c6 and the light-squared bishops are gone.}
        5.O-O 5...Nc6 {Develops and watches d4.}
        6.c3 6...Nf6 {Develops with pressure on e4.}
        7.Re1 7...e6 {Opens the f8 bishop and prepares ...d5.}
        8.d4 8...cxd4 {Releases the tension before White can push d5.}
        9.cxd4 9...d5 {Hits the centre. After e5 Black's knight gets a fine square on e4.}
        10.e5 10...Ne4 {The knight lands in the centre. A balanced French-like position.}`,
    },
    {
      id: 'alapin',
      from: 'english-attack',
      name: 'Alapin: 2.c3',
      summary: 'White prepares d4; Black hits the centre at once with ...d5.',
      moves: `2.c3 {The Alapin: White wants to recapture on d4 with a pawn.}
        2...d5 {Strike before White can build the centre.}
        3.exd5 3...Qxd5 {The queen is safe in the centre: the c3 pawn stops White gaining time with Nc3.}
        4.d4 4...Nf6 {Develops and keeps an eye on d5 and e4.}
        5.Nf3 5...Bg4 {Pins the knight and adds pressure on d4.}
        6.Be2 6...e6 {Opens the f8 bishop and supports the queen.}
        7.O-O 7...Nc6 {More pressure on d4.}
        8.Be3 8...cxd4 {Releases the tension: White must accept an isolated d-pawn.}
        9.cxd4 9...Be7 {Develops and prepares to castle.}
        10.Nc3 10...Qd6 {The queen steps away from the knight and keeps watching d4. Black's plan is to pile up on the isolated pawn.}`,
    },
  ],
};

export default opening;
