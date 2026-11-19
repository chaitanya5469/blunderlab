import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'queens-gambit-declined',
  name: "Queen's Gambit Declined",
  side: 'black',
  order: 5,
  eco: 'D30–D69',
  thumb: 4,
  tagline: 'Hold d5 with ...e6, castle, and free your game with trades.',
  match: ['d4 d5 c4 e6', 'd4 Nf6 c4 e6 Nc3 d5', 'd4 d5 Bf4', 'd4 d5 Nf3 Nf6 Bf4'],
  overview: {
    ideas:
      'Black keeps a pawn on d5 and supports it with ...e6 and ...Nf6. Development is quick and safe; the price is a slightly passive c8 bishop, which Black frees later with ...b6 and ...Bb7, or with ...c5 or ...e5 breaks.',
    plans: [
      'Develop with ...Nf6, ...Be7 and ...O-O before anything else.',
      'Ease the pressure with trades: ...h6, ...Ne4 or ...Nxd5 ideas.',
      'Free the c8 bishop with ...b6 and ...Bb7, or play ...c5 to challenge the centre.',
    ],
    structure: 'd5 and e6 against d4 and c4. After cxd5 exd5 Black gets the Carlsbad structure with an open e-file.',
    suits: 'Classical, solid players who want a reliable defence against 1.d4 that has stood the test of time.',
  },
  lines: [
    {
      id: 'tartakower',
      name: 'Orthodox: Tartakower',
      summary: 'Black meets Bg5 with ...h6 and ...b6, then trades into a sound structure.',
      moves: `1.d4 1...d5 {Claims the centre and stops e4.}
        2.c4 2...e6 {Declines the gambit and keeps a solid pawn on d5.}
        3.Nc3 3...Nf6 {Defends d5 again and develops.}
        4.Bg5 4...Be7 {Unpins the knight calmly.}
        5.e3 5...O-O {Castles early; the king is safe before the centre opens.}
        6.Nf3 6...h6 {Asks the bishop to decide: keep the pin or give up the bishop pair.}
        7.Bh4 7...b6 {The Tartakower: the c8 bishop will come to b7 and watch the long diagonal.}
        8.cxd5 8...Nxd5 {Recapturing with the knight offers trades that free Black's game.}
        9.Bxe7 9...Qxe7 {The queen recaptures and stays active.}
        10.Nxd5 10...exd5 {Opens the c8 bishop's diagonal along c8-h3.}
        11.Rc1 11...Be6 {Develops the last minor piece; next ...c5 or ...c6 blunts the pressure on the c-file. Balanced.}`,
    },
    {
      id: 'exchange',
      from: 'tartakower',
      name: 'Exchange: 4.cxd5',
      summary: 'White fixes the Carlsbad structure early; Black develops harmoniously.',
      moves: `4.cxd5 4...exd5 {Recaptures with the pawn; the c8 bishop is now free.}
        5.Bg5 5...c6 {Supports d5 and gives the queen access to b6 or a5.}
        6.e3 6...Be7 {Breaks the pin.}
        7.Bd3 7...Nbd7 {Develops toward f8, where the knight can defend the kingside.}
        8.Qc2 8...O-O {Castles.}
        9.Nf3 9...Re8 {The rook takes the half-open e-file and frees f8 for the knight.}
        10.O-O 10...Nf8 {The knight guards h7 and can come to g6 or e6. A standard, balanced Carlsbad.}`,
    },
    {
      id: 'london',
      from: 'tartakower',
      name: 'Against the London: 2.Bf4',
      summary: 'Black meets the London with the same calm setup and ...c5.',
      moves: `2.Bf4 {The London System.}
        2...Nf6 {Develops and keeps options open.}
        3.e3 3...e6 {Supports d5 and opens the f8 bishop.}
        4.Nf3 4...c5 {Challenges d4 from the side.}
        5.c3 5...Nc6 {More pressure on d4.}
        6.Nbd2 6...Bd6 {Offers to trade White's best minor piece.}
        7.Bg3 7...O-O {Castles; ...Bxg3 would open the h-file for White's rook.}
        8.Bd3 8...b6 {Prepares ...Bb7 so the light bishop has a good diagonal.}
        9.O-O 9...Bb7 {Development is complete. Black is fully equal.}`,
    },
  ],
};

export default opening;
