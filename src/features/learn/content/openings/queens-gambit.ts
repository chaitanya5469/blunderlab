import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'queens-gambit',
  name: "Queen's Gambit",
  side: 'white',
  order: 2,
  eco: 'D06–D69',
  thumb: 3,
  tagline: 'Offer the c-pawn to pull Black away from the centre.',
  match: ['d4 d5 c4'],
  overview: {
    ideas:
      "White attacks d5 from the side with c4. It is not a real gambit: if Black takes, White wins the pawn back with e3 and Bxc4. Usually Black declines, and White builds pressure with Nc3, Nf3, Bg5 and e3.",
    plans: [
      'Develop with Nc3, Nf3, Bg5 and e3, then castle.',
      'Use the half-open c-file after cxd5, pressing on c7.',
      'Against ...dxc4, win the pawn back with e3 and Bxc4.',
    ],
    structure: 'd4 against d5, with the c-file as the main battleground. After cxd5 exd5, the Carlsbad structure.',
    suits: 'Classical players who want principled positions and a lasting, low-risk edge.',
  },
  lines: [
    {
      id: 'qgd',
      name: 'Declined: Tartakower',
      summary: "The classical main line against 2...e6.",
      moves: `1.d4 {Takes the centre and opens the c1 bishop.}
        1...d5
        2.c4 {The Queen's Gambit: attacks d5 from the side.}
        2...e6 {Declines and supports d5.}
        3.Nc3 {Adds pressure on d5.}
        3...Nf6
        4.Bg5 {Pins the knight that defends d5.}
        4...Be7
        5.e3 {Opens the f1 bishop and supports d4.}
        5...O-O
        6.Nf3 {Develops.}
        6...h6
        7.Bh4 {Keeps the pin.}
        7...b6 {The Tartakower: Black prepares ...Bb7.}
        8.cxd5 {Releases the tension to simplify on White's terms.}
        8...Nxd5
        9.Bxe7 {Trades the bishops.}
        9...Qxe7
        10.Nxd5 {Trades knights.}
        10...exd5
        11.Rc1 {The rook takes the half-open c-file, pressing on c7.}`,
    },
    {
      id: 'qga',
      from: 'qgd',
      name: 'Accepted: 3.e3',
      summary: 'White wins the pawn back with Bxc4 and develops smoothly.',
      moves: `2...dxc4 {Black accepts the gambit.}
        3.e3 {Opens the f1 bishop to win c4 back.}
        3...Nf6
        4.Bxc4 {White has the pawn back and a pleasant centre.}
        4...e6
        5.Nf3 {Develops.}
        5...c5
        6.O-O {Castles.}
        6...a6
        7.Bb3 {Moves the bishop before ...b5 hits it.}
        7...b5
        8.a4 {Strikes at b5.}
        8...b4
        9.Nbd2 {The knight heads for c4. White is comfortable.}`,
    },
    {
      id: 'qga-b5',
      from: 'qga',
      name: 'Accepted: holding on with ...b5',
      summary: 'Black tries to keep the pawn and loses material on the long diagonal.',
      punishes: true,
      moves: `3...b5 {Black tries to keep the extra pawn.}
        4.a4 {Undermines b5 at once.}
        4...c6
        5.axb5 {Takes on b5.}
        5...cxb5 {A mistake: the diagonal from f3 to a8 is now open.}
        6.Qf3 {Attacks the rook on a8.}
        6...Nc6
        7.Qxc6+ {Takes the knight with check.}
        7...Bd7
        8.Qe4 {White is a piece up.}`,
    },
    {
      id: 'slav',
      from: 'qgd',
      name: 'Slav: 2...c6',
      summary: 'White wins back c4 and builds a broad centre with e4.',
      moves: `2...c6 {The Slav: supports d5 without blocking the c8 bishop.}
        3.Nf3 {Develops.}
        3...Nf6
        4.Nc3 {More pressure on d5.}
        4...dxc4
        5.a4 {Stops ...b5, so Black can't keep the pawn.}
        5...Bf5
        6.e3 {Opens the bishop.}
        6...e6
        7.Bxc4 {Wins the pawn back.}
        7...Bb4
        8.O-O {Castles.}
        8...O-O
        9.Qe2 {Prepares e4.}
        9...Nbd7
        10.e4 {Takes the centre with tempo on the bishop.}
        10...Bg6
        11.Bd3 {Supports e4. White has a broad centre.}`,
    },
    {
      id: 'albin',
      from: 'qgd',
      name: 'Albin Countergambit',
      summary: 'Take the pawn, avoid 4.e3, and keep the extra pawn safely.',
      punishes: true,
      moves: `2...e5 {The Albin Countergambit.}
        3.dxe5 {Takes the pawn.}
        3...d4 {The pawn cramps White.}
        4.Nf3 {Develops and avoids 4.e3, which allows the Lasker Trap.}
        4...Nc6
        5.g3 {Prepares the bishop on the long diagonal.}
        5...Be6
        6.Nbd2 {Develops and covers c4 and e4.}
        6...Qd7
        7.Bg2 {The bishop aims down the long diagonal.}
        7...O-O-O
        8.O-O {Castles. White is a pawn up with a safe king.}`,
    },
  ],
};

export default opening;
