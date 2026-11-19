import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'french-advance',
  name: 'French: Advance Variation',
  side: 'white',
  order: 7,
  eco: 'C02',
  thumb: 5,
  tagline: 'Grab space with e5 and hold the d4-e5 chain.',
  match: ['e4 e6'],
  overview: {
    ideas:
      "White answers the French with 3.e5, gaining space and cramping Black's kingside. Black attacks the chain with ...c5, ...Nc6 and ...Qb6; White keeps d4 firmly supported and uses the extra space.",
    plans: [
      'Support d4 with c3, Nf3 and sometimes Be3.',
      'Against ...Qb6, consider a3 and b4 to gain queenside space.',
      'Use the space on the kingside for a later attack.',
    ],
    structure: "Pawn chain d4-e5 against Black's e6-d5. Black's light-squared bishop is often passive.",
    suits: 'Players who like space and a clear plan, and want to avoid the heavy theory of 3.Nc3.',
  },
  lines: [
    {
      id: 'a3',
      name: 'Main line with 6.a3',
      summary: 'White prepares b4; Black locks the queenside with ...c4.',
      moves: `1.e4 {Takes the centre.}
        1...e6 {The French Defence.}
        2.d4 {Builds the ideal centre.}
        2...d5 {Black challenges e4.}
        3.e5 {The Advance Variation: grabs space and takes f6 away from Black's knight.}
        3...c5 {Black attacks the base of the chain at once.}
        4.c3 {Supports d4 with a pawn.}
        4...Nc6
        5.Nf3 {Defends d4 again.}
        5...Qb6 {More pressure on d4, and the queen hits b2.}
        6.a3 {Prepares b4 to gain queenside space.}
        6...c4 {Black closes the queenside and takes the b3 square.}
        7.Nbd2 {Develops and keeps an eye on c4 and b3.}
        7...Na5
        8.Rb1 {Takes the rook off a1, so ...Nb3 no longer hits it, and supports b4.}
        8...Bd7
        9.Be2 {Develops, ready to castle.}
        9...Ne7
        10.O-O {Castles. White has kingside space; Black has play on the queenside.}`,
    },
    {
      id: 'be2',
      from: 'a3',
      name: 'Solid 6.Be2',
      summary: 'White develops and keeps d4 defended against ...Nf5.',
      moves: `6.Be2 {Develops and prepares to castle.}
        6...cxd4
        7.cxd4 {Recaptures; the d4 pawn is now Black's main target.}
        7...Nh6 {The knight heads for f5 to hit d4.}
        8.Nc3 {Develops.}
        8...Nf5
        9.Na4 {Hits the queen.}
        9...Qa5+
        10.Bd2 {Blocks with tempo on the queen.}
        10...Bb4
        11.Bc3 {Blocks again. The d4 pawn holds: it is attacked twice and defended twice.}`,
    },
    {
      id: 'bd7',
      from: 'a3',
      name: '5...Bd7',
      summary: 'Black develops quietly; White expands on the kingside.',
      moves: `5...Bd7 {Black develops and keeps the queen flexible.}
        6.Be2 {Develops and prepares to castle.}
        6...Nge7
        7.O-O {Castles.}
        7...Ng6 {The knight attacks e5.}
        8.g3 {Takes away the f4 and h4 squares from the knight.}
        8...Be7
        9.h4 {Threatens h5, chasing the knight away from e5.}`,
    },
    {
      id: 'early-qb6',
      from: 'a3',
      name: 'Early ...Qb6 and ...Bb5',
      summary: 'Black trades off the bad bishop; White declines the queen trade.',
      moves: `4...Qb6 {Black brings the queen out early to hit d4 and b2.}
        5.Nf3 {Defends d4.}
        5...Bd7 {Black plans ...Bb5 to trade the bad light-squared bishop.}
        6.Be2 {Develops; White does not mind the trade.}
        6...Bb5
        7.O-O {Castles; the trade only helps Black a little.}
        7...Bxe2
        8.Qxe2 {Recaptures.}
        8...Qa6 {Black offers a queen trade, which would ease Black's game.}
        9.Qd1 {Declines the trade and keeps pieces on for the attack. White keeps the space advantage.}`,
    },
  ],
};

export default opening;
