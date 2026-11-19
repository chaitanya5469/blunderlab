import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  side: 'black',
  order: 4,
  eco: 'B12–B19',
  thumb: 4,
  tagline: 'Support ...d5 with the c-pawn and keep the light bishop free.',
  match: ['e4 c6'],
  overview: {
    ideas:
      'Black prepares ...d5 with 1...c6 instead of 1...e6, so the c8 bishop can come out to f5 or g4 before ...e6. The result is a very solid structure with few weaknesses and easy development.',
    plans: [
      'Develop the light-squared bishop before playing ...e6.',
      'In the Classical, meet h4-h5 by keeping the bishop safe on g6 or h7 and trade it with ...Bxd3.',
      'In the Advance, hit d4 with ...c5 and ...Nc6.',
    ],
    structure: 'Black pawns on c6 and e6 around the centre; after ...dxe4 Black often has a 4 vs 3 kingside majority.',
    suits: 'Players who value solid positions, a sound structure and long-term endgame chances.',
  },
  lines: [
    {
      id: 'classical',
      name: 'Classical: 4...Bf5',
      summary: 'Black develops the bishop with tempo and meets the h-pawn advance calmly.',
      moves: `1.e4 1...c6 {Prepares ...d5 while keeping the c8 bishop's diagonal open.}
        2.d4 2...d5 {Challenges e4.}
        3.Nc3 3...dxe4 {Gives up the centre for a moment to free the bishop.}
        4.Nxe4 4...Bf5 {Develops with tempo on the knight.}
        5.Ng3 5...Bg6 {Keeps the bishop on the long diagonal toward White's queenside.}
        6.h4 {Threatens h5 to trap the bishop.}
        6...h6 {Gives the bishop h7 as a retreat.}
        7.Nf3 7...Nd7 {Covers e5 so the knight cannot jump in to hit g6.}
        8.h5 8...Bh7 {Retreats; the bishop stays on the b1-h7 diagonal.}
        9.Bd3 9...Bxd3 {Trades White's best attacking piece.}
        10.Qxd3 10...e6 {Now ...e6 costs nothing: the bishop is already outside the chain.}
        11.Bd2 11...Ngf6 {Develops and guards h7 and d5.}
        12.O-O-O 12...Be7 {Prepares to castle. A solid position with a long-term edge in structure.}`,
    },
    {
      id: 'advance',
      from: 'classical',
      name: 'Advance: 3.e5',
      summary: 'Black develops the bishop to f5, then attacks d4 with ...c5.',
      moves: `3.e5 {White gains space.}
        3...Bf5 {Develops the bishop before ...e6 shuts it in.}
        4.Nf3 4...e6 {Now the pawn chain supports d5 and the bishop is already outside it.}
        5.Be2 5...c5 {Strikes at d4: Black uses two moves with the c-pawn but gains a target.}
        6.Be3 6...cxd4 {Opens the c-file.}
        7.Nxd4 7...Ne7 {Heads for c6 to challenge the d4 knight while keeping f5 protected.}
        8.O-O 8...Nbc6 {Develops and challenges d4. Black is solid and ready to castle.}`,
    },
    {
      id: 'exchange',
      from: 'classical',
      name: 'Exchange: 3.exd5',
      summary: 'A symmetrical structure; Black develops the bishop to g4 and trades pieces.',
      moves: `3.exd5 3...cxd5 {Recaptures toward the centre.}
        4.Bd3 4...Nc6 {Develops and watches d4.}
        5.c3 5...Nf6 {Develops and guards d5.}
        6.Bf4 6...Bg4 {Develops the problem bishop outside the chain, with tempo on the queen on d1.}
        7.Qb3 {Hits b7.}
        7...Qd7 {Defends b7 and keeps the c8-h3 diagonal covered.}
        8.Nd2 8...e6 {Opens the f8 bishop.}
        9.Ngf3 9...Bxf3 {Gives up the bishop for the knight that would otherwise jump into e5.}
        10.Nxf3 10...Bd6 {Offers to trade White's active bishop. Balanced.}`,
    },
    {
      id: 'panov',
      from: 'exchange',
      name: 'Panov Attack: 4.c4',
      summary: 'White accepts an isolated pawn for activity; Black blockades and trades.',
      moves: `4.c4 {The Panov: White plays for an isolated d-pawn and piece activity.}
        4...Nf6 {Develops and adds pressure on c4 and d5.}
        5.Nc3 5...e6 {Supports d5 and opens the f8 bishop.}
        6.Nf3 6...Be7 {A solid square; Black castles next.}
        7.cxd5 7...Nxd5 {The knight blockades the square in front of White's isolated pawn.}
        8.Bd3 8...Nc6 {Pressure on d4.}
        9.O-O 9...O-O {Castles. Black's plan is to trade pieces and target d4.}
        10.Re1 10...Bf6 {Adds a third attacker on d4. Balanced.}`,
    },
  ],
};

export default opening;
