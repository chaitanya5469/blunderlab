import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'london-system',
  name: 'London System',
  side: 'white',
  order: 3,
  eco: 'D02, A46',
  thumb: 3,
  tagline: 'One solid setup against almost anything.',
  match: [
    'd4 d5 Bf4',
    'd4 Nf6 Bf4',
    'd4 e6 Bf4',
    'd4 d5 Nf3 Nf6 Bf4',
    'd4 Nf6 Nf3 d5 Bf4',
    'd4 Nf6 Nf3 g6 Bf4',
    'd4 Nf6 Nf3 e6 Bf4',
  ],
  overview: {
    ideas:
      'White plays the same structure against almost any defence: d4, Bf4, e3, Nf3, c3, Bd3 and Nbd2. There is little theory, the position is very solid, and White can later attack with Ne5 and f4.',
    plans: [
      'Develop the bishop to f4 before playing e3, then build the d4-e3-c3 pyramid.',
      'Answer ...Bd6 with Bg3, so a trade opens the h-file for your rook.',
      'Use Ne5 and f4 for a kingside attack once developed.',
    ],
    structure: 'Pawns on c3, d4 and e3 with the dark-squared bishop outside on f4: very solid.',
    suits: 'Players who want one system against everything and prefer plans over memorised lines.',
  },
  lines: [
    {
      id: 'main',
      name: 'Against ...d5 and ...e6',
      summary: 'The standard setup, finishing with Ne5.',
      moves: `1.d4 {Takes the centre.}
        1...d5
        2.Bf4 {Develops the bishop before e3 shuts it in.}
        2...Nf6
        3.e3 {Supports d4 and opens the f1 bishop.}
        3...e6
        4.Nf3 {Develops.}
        4...c5
        5.c3 {Completes the pyramid and supports d4.}
        5...Nc6
        6.Nbd2 {Develops; the knight can support e4 or Ne5.}
        6...Bd6
        7.Bg3 {Avoids a trade on Black's terms: after ...Bxg3, hxg3 opens the h-file.}
        7...O-O
        8.Bd3 {Develops toward the kingside.}
        8...b6
        9.O-O {Castles.}
        9...Bb7
        10.Ne5 {The knight takes a strong outpost, eyeing c6 and f7.}`,
    },
    {
      id: 'qb6',
      from: 'main',
      name: 'Against ...c5 and ...Qb6',
      summary: 'Black hits b2 early; White defends calmly with Qb3.',
      moves: `2...c5 {Black challenges d4 at once.}
        3.e3 {Supports d4.}
        3...Nc6
        4.c3 {Holds d4 with a pawn.}
        4...Qb6 {Hits b2.}
        5.Qb3 {Defends b2 by offering a queen trade.}
        5...c4 {Kicks the queen.}
        6.Qc2 {The queen retreats and still defends b2.}
        6...Nf6
        7.Nd2 {Develops and prepares e4 to hit the centre.}
        7...Bg4
        8.Ngf3 {Develops.}
        8...e6
        9.Be2 {Breaks the pin and prepares to castle.}`,
    },
    {
      id: 'kid',
      name: "Against a King's Indian setup",
      summary: 'The same structure against ...g6; h3 gives the bishop a retreat.',
      moves: `1.d4 {Takes the centre.}
        1...Nf6
        2.Bf4 {The London setup works against ...Nf6 too.}
        2...g6
        3.e3 {Supports d4.}
        3...Bg7
        4.Nf3 {Develops.}
        4...d6
        5.h3 {Gives the bishop h2 as a retreat, so ...Nh5 is not a threat.}
        5...O-O
        6.Be2 {A modest but safe post for the bishop.}
        6...c5
        7.c3 {Supports d4.}
        7...Nc6
        8.O-O {Castles. A solid position with chances to expand later.}`,
    },
  ],
};

export default opening;
