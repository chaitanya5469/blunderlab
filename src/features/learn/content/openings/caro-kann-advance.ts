import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'caro-kann-advance',
  name: 'Caro-Kann: Advance Variation',
  side: 'white',
  order: 8,
  eco: 'B12',
  thumb: 5,
  tagline: 'Space with e5, simple development, and the Short System.',
  match: ['e4 c6'],
  overview: {
    ideas:
      "White pushes e5 to gain space. Black usually develops the bishop to f5 before ...e6, so White plays simply: Nf3, Be2, castle, and later c3 or c4. The extra space makes White's position easy to play.",
    plans: [
      "The Short System: Nf3, Be2, O-O, then c3 or c4.",
      'Answer ...c5 by taking on c5 or by supporting d4 with Be3.',
      'Gain queenside space with a4 and Nb3, or use e5 as a spearhead on the kingside.',
    ],
    structure: 'Pawn chain d4-e5 against c6-d5-e6 (or c5); White has space, Black a solid but cramped position.',
    suits: 'Players who want space and a practical, low-risk line against the Caro-Kann.',
  },
  lines: [
    {
      id: 'short',
      name: 'Short System',
      summary: 'Calm development and queenside space.',
      moves: `1.e4 {Takes the centre.}
        1...c6 {The Caro-Kann.}
        2.d4 {Builds a big centre.}
        2...d5
        3.e5 {The Advance Variation: space, and the f6 square is taken from Black's knight.}
        3...Bf5 {Black develops the bishop before ...e6 shuts it in.}
        4.Nf3 {Develops and supports d4 and e5.}
        4...e6
        5.Be2 {Simple development; White will castle quickly.}
        5...Nd7
        6.O-O {Castles.}
        6...Ne7
        7.Nbd2 {Heading for b3 to control c5 and d4.}
        7...h6 {Gives the bishop a retreat square on h7.}
        8.Nb3 {Controls c5, making ...c5 harder.}
        8...Bh7
        9.a4 {Gains queenside space; a5 next would cramp Black further.}
        9...a5
        10.c3 {Solidifies d4. White has more space.}`,
    },
    {
      id: 'c5',
      from: 'short',
      name: '3...c5',
      summary: 'Black hits d4 at once; White takes on c5 and holds it.',
      moves: `3...c5 {Black strikes at d4 immediately.}
        4.dxc5 {Takes, and tries to keep the extra pawn.}
        4...Nc6
        5.Bb5 {Pins the knight so it cannot easily hit e5.}
        5...e6
        6.Be3 {Defends c5.}
        6...Ne7
        7.c3 {Covers b4 and d4, supporting the bishop.}
        7...Bd7
        8.Nf3 {Develops and guards e5.}
        8...Nf5 {Black hits the bishop on e3.}
        9.Bd4 {The bishop takes the strong d4 square. White keeps the c5 pawn for now.}`,
    },
    {
      id: 'bf5-c5',
      from: 'short',
      name: '5...c5',
      summary: 'Black attacks the chain after ...Bf5; White opens lines with c4.',
      moves: `5...c5 {Black attacks the chain right away.}
        6.Be3 {Supports d4 with a developing move.}
        6...cxd4
        7.Nxd4 {Recaptures with a central knight that eyes the bishop on f5.}
        7...Ne7
        8.O-O {Castles.}
        8...Nbc6
        9.c4 {Hits d5, opening lines while Black's king is still in the centre.}`,
    },
  ],
};

export default opening;
