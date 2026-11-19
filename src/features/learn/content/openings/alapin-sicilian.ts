import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'alapin-sicilian',
  name: 'Alapin Sicilian',
  side: 'white',
  order: 6,
  eco: 'B22',
  thumb: 3,
  tagline: 'Answer 1...c5 with 2.c3 and build a classic centre.',
  match: ['e4 c5'],
  overview: {
    ideas:
      'Instead of the sharp Open Sicilian, White plays 2.c3 to prepare d4 and recapture with the c-pawn. The positions are clear, the plans are simple and there is little to memorise.',
    plans: [
      'Push d4 and recapture with the c-pawn to keep two central pawns.',
      'Against 2...Nf6, push e5 and chase the knight.',
      'Against 2...d5, accept an isolated d-pawn and play for active pieces.',
    ],
    structure: "Often an isolated pawn on d4 for White, or a broad pawn centre on d4 and e4 after cxd4.",
    suits: 'Players who want to avoid Sicilian theory and get a clear, healthy position.',
  },
  lines: [
    {
      id: 'nf6',
      name: '2...Nf6',
      summary: 'White gains space with e5 and ends with active pieces.',
      moves: `1.e4 {Takes the centre.}
        1...c5 {The Sicilian.}
        2.c3 {The Alapin: prepares d4 so White can recapture with the c-pawn.}
        2...Nf6 {Black attacks e4 at once.}
        3.e5 {Gains space with tempo on the knight.}
        3...Nd5
        4.d4 {Takes the centre.}
        4...cxd4
        5.Nf3 {Develops; the d4 pawn can be won back later.}
        5...Nc6
        6.Bc4 {Hits the knight on d5.}
        6...Nb6
        7.Bb3 {Keeps the bishop on the a2-g8 diagonal.}
        7...d5
        8.exd6 {Takes en passant, opening lines for White's pieces.}
        8...Qxd6
        9.O-O {Castles.}
        9...Be6
        10.Bxe6 {Trades bishops.}
        10...Qxe6
        11.Nxd4 {Wins the pawn back with tempo on the queen.}
        11...Nxd4
        12.cxd4 {Recaptures. White has an isolated d-pawn but easy development.}`,
    },
    {
      id: 'd5',
      from: 'nf6',
      name: '2...d5',
      summary: 'Black hits the centre at once; White gets an isolated pawn and open lines.',
      moves: `2...d5 {Black strikes the centre immediately.}
        3.exd5 {Takes.}
        3...Qxd5
        4.d4 {Builds the centre. The c3 pawn takes away Nc3, but the queen on d5 is not in danger yet.}
        4...Nf6
        5.Nf3 {Develops.}
        5...Bg4
        6.Be2 {Breaks the pin.}
        6...e6
        7.O-O {Castles.}
        7...Nc6
        8.Be3 {Supports d4.}
        8...cxd4
        9.cxd4 {Recaptures: White has an isolated d-pawn but open lines.}
        9...Be7
        10.Nc3 {Develops with tempo on the queen.}
        10...Qd6`,
    },
    {
      id: 'e6',
      from: 'nf6',
      name: '2...e6',
      summary: 'A French-style setup; White leaves Black with an isolated pawn.',
      moves: `2...e6 {Black prepares ...d5.}
        3.d4 {Builds the full centre.}
        3...d5
        4.exd5 {Releases the tension.}
        4...exd5
        5.Nf3 {Develops.}
        5...Nc6
        6.Bb5 {Develops with a pin on the c6 knight.}
        6...Bd6
        7.dxc5 {Takes, so that Black's d5 pawn becomes isolated.}
        7...Bxc5
        8.O-O {Castles.}
        8...Ne7
        9.Nbd2 {Heading for b3 to hit the bishop and control d4.}
        9...O-O
        10.Nb3 {Attacks the bishop and eyes d4, the square in front of Black's isolated pawn.}`,
    },
    {
      id: 'd6',
      from: 'nf6',
      name: '2...d6',
      summary: 'Black plays slowly; White builds the ideal centre.',
      moves: `2...d6 {A slow move.}
        3.d4 {Takes the centre.}
        3...Nf6 {Attacks e4.}
        4.Bd3 {Defends e4 with a developing move.}
        4...cxd4
        5.cxd4 {White has the ideal centre.}
        5...g6
        6.Nc3 {Develops.}
        6...Bg7
        7.Nge2 {Keeps the f-pawn free to advance later.}
        7...O-O
        8.O-O {Castles.}
        8...Nc6
        9.h3 {Stops ...Bg4 and ...Ng4. White has a big centre.}`,
    },
  ],
};

export default opening;
