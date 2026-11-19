import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'slav-defence',
  name: 'Slav Defence',
  side: 'black',
  order: 6,
  eco: 'D10–D19',
  thumb: 4,
  tagline: 'Hold d5 with ...c6 and get the light bishop out first.',
  match: ['d4 d5 c4 c6'],
  overview: {
    ideas:
      'Black supports d5 with the c-pawn, so the c8 bishop is not shut in by ...e6. The bishop comes to f5 or g4, then Black plays ...e6 and gets a solid, healthy position. In the main line Black takes on c4 and uses the time White spends to win it back.',
    plans: [
      'Develop the c8 bishop to f5 before ...e6.',
      'Take on c4 when White plays Nc3 and Nf3, then develop quickly while White regains the pawn.',
      'Against slow lines, keep the structure and break with ...c5 or ...e5 later.',
    ],
    structure: 'c6, d5 and e6 against c4 and d4: a sturdy triangle with no bad bishop.',
    suits: 'Solid players who want a reliable defence and do not like passive bishops.',
  },
  lines: [
    {
      id: 'main',
      name: 'Main line: 4...dxc4',
      summary: 'Black takes on c4, develops the bishop to f5 and gives the pawn back for easy play.',
      moves: `1.d4 1...d5 {Claims the centre.}
        2.c4 2...c6 {The Slav: supports d5 without blocking the c8 bishop.}
        3.Nf3 3...Nf6 {Develops and guards d5.}
        4.Nc3 4...dxc4 {Takes the pawn now that the knights block White's quick e4 ideas.}
        5.a4 {Stops ...b5, so Black cannot keep the pawn.}
        5...Bf5 {Develops the bishop outside the pawn chain, its whole point in the Slav.}
        6.e3 6...e6 {Now ...e6 is free: the bishop is already out.}
        7.Bxc4 7...Bb4 {Pins the c3 knight and slows down e4.}
        8.O-O 8...O-O {Castles.}
        9.Qe2 9...Nbd7 {Covers e5 and prepares ...Bg6 or ...e5.}
        10.e4 10...Bg6 {Retreats from e4's attack and stays on the useful diagonal.}
        11.Bd3 11...Bh5 {Pins the f3 knight so e4-e5 is harder to support. Balanced.}`,
    },
    {
      id: 'slow',
      from: 'main',
      name: 'Slow Slav: 4.e3',
      summary: 'White chases the bishop with Nh4; Black accepts doubled pawns that open the h-file.',
      moves: `4.e3 {White keeps the c1 bishop at home for solidity.}
        4...Bf5 {Develops the bishop before ...e6.}
        5.Nc3 5...e6 {Completes the pawn triangle.}
        6.Nh4 {Hunts the bishop.}
        6...Bg6 {Retreats and keeps the diagonal.}
        7.Nxg6 7...hxg6 {Recaptures toward the centre; the h-file opens for Black's rook.}
        8.Bd3 8...Nbd7 {Develops and keeps the e5 break possible.}
        9.O-O 9...Bd6 {Aims at h2 together with the rook on h8. Solid and equal.}`,
    },
    {
      id: 'exchange',
      from: 'main',
      name: 'Exchange: 3.cxd5',
      summary: 'A symmetrical structure; Black copies sensibly and has no weaknesses.',
      moves: `3.cxd5 3...cxd5 {Recaptures; the c-file is open for both sides.}
        4.Nc3 4...Nf6 {Develops and guards d5.}
        5.Bf4 5...Nc6 {Develops and adds pressure on d4.}
        6.e3 6...Bf5 {The bishop takes its best diagonal.}
        7.Nf3 7...e6 {Opens the f8 bishop.}
        8.Qb3 {Hits b7.}
        8...Bb4 {Pins the c3 knight and gets ready to castle.}
        9.Bb5 9...O-O {Castles; Black is fully developed in a balanced, symmetrical position.}`,
    },
  ],
};

export default opening;
