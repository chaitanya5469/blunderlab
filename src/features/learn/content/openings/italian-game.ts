import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'italian-game',
  name: 'Italian Game',
  side: 'white',
  order: 1,
  eco: 'C50–C54',
  thumb: 5,
  tagline: 'Natural development, a bishop aimed at f7 and a slow squeeze.',
  match: ['e4 e5 Nf3 Nc6 Bc4'],
  overview: {
    ideas:
      'White develops quickly, points the bishop at f7 and builds the centre slowly with c3 and d3, keeping d4 in reserve. The modern Italian is a manoeuvring game: White improves every piece before opening the position.',
    plans: [
      'Play c3 and d3, castle, then Re1 and h3.',
      'Bring the b1 knight to g3 via d2 and f1 to support a kingside attack.',
      'Push a4 to gain queenside space and keep the bishop safe from ...b5.',
      'Break with d4 once your pieces are ready.',
    ],
    structure: "Pawns on c3, d3 and e4 against Black's e5 and d6: a closed, flexible centre where both sides manoeuvre.",
    suits: 'Players who like natural development and slow pressure, and want sound positions without much theory.',
  },
  lines: [
    {
      id: 'pianissimo',
      name: 'Giuoco Pianissimo',
      summary: 'The main line today: c3, d3 and a slow kingside build-up.',
      moves: `1.e4 {Claims the centre and opens lines for the queen and the f1 bishop.}
        1...e5
        2.Nf3 {Develops toward the centre and attacks the e5 pawn.}
        2...Nc6 {Black defends e5 with a developing move.}
        3.Bc4 {The Italian bishop: it controls d5 and aims at f7, the weak spot next to Black's king.}
        3...Bc5 {Black mirrors, aiming at f2.}
        4.c3 {Prepares d4 and takes the d4 square away from Black's knight.}
        4...Nf6 {Develops and attacks e4.}
        5.d3 {Defends e4 calmly. White keeps the d4 break for later.}
        5...d6
        6.O-O {King safety first; the rook comes closer to the centre.}
        6...O-O
        7.Re1 {The rook backs up e4, so the f3 knight is free to move later.}
        7...a6 {Gives the bishop a retreat on a7.}
        8.a4 {Gains queenside space and stops ...b5 from chasing the bishop.}
        8...Ba7
        9.h3 {Takes g4 away from Black's bishop and knight, so nothing can pin or harass the f3 knight.}
        9...h6
        10.Nbd2 {The knight heads for f1 and g3, the classic Italian route toward the kingside.}`,
    },
    {
      id: 'two-knights',
      from: 'pianissimo',
      name: 'Two Knights with 4.d3',
      summary: 'Black counterattacks e4; White stays solid and manoeuvres.',
      moves: `3...Nf6 {The Two Knights Defence: Black counterattacks e4 at once.}
        4.d3 {Defends e4 quietly and avoids the sharp lines after 4.Ng5.}
        4...Be7 {A modest setup.}
        5.O-O {Castles.}
        5...O-O
        6.Re1 {Supports e4 and prepares the knight trip via d2 and f1.}
        6...d6
        7.c3 {Prepares d4 and gives the bishop a retreat square on c2.}
        7...Na5 {Black chases the bishop that eyes f7.}
        8.Bb5 {The bishop steps aside. After ...a6 and ...b5 it will settle on c2, still aimed at the kingside.}
        8...a6
        9.Ba4 {Stays on the a4-e8 diagonal for now.}
        9...b5
        10.Bc2 {The bishop's best post: safe, and aimed at Black's king.}
        10...c5 {Black grabs queenside space.}
        11.Nbd2 {The knight heads for f1 and g3. White has a solid centre and kingside chances.}`,
    },
    {
      id: 'hungarian',
      from: 'pianissimo',
      name: 'Hungarian Defence 3...Be7',
      summary: 'Against a passive setup, open the centre with d4.',
      moves: `3...Be7 {The Hungarian Defence: very solid but passive.}
        4.d4 {Against a passive setup, strike in the centre straight away.}
        4...exd4 {Black gives up the centre.}
        5.Nxd4 {White recaptures with a strong central knight and more space.}
        5...Nf6
        6.Nc3 {Defends e4 and develops.}
        6...O-O
        7.O-O {Castles; White has a free and easy game.}
        7...d6
        8.h3 {Keeps Black's pieces off g4.}
        8...Re8 {Pressure on e4.}
        9.Re1 {Defends e4. White keeps a pleasant space advantage.}`,
    },
    {
      id: 'early-bg4',
      from: 'pianissimo',
      name: '3...d6 and an early ...Bg4',
      summary: 'Black pins too early and Qb3 wins the b7 pawn.',
      moves: `3...d6 {Solid, but it shuts in Black's dark-squared bishop.}
        4.c3 {Prepares d4 and opens the d1-b3 diagonal for the queen.}
        4...Bg4 {Pins the knight, but the bishop no longer guards b7.}
        5.Qb3 {Hits b7, and together with the bishop also f7.}
        5...Qd7 {Covers f7, but b7 falls.}
        6.Qxb7 {Wins a pawn.}
        6...Rb8 {Black chases the queen.}
        7.Qa6 {The queen steps back to safety.}
        7...Nf6
        8.d3 {Opens the c1 bishop and secures e4.}
        8...Be7
        9.Nbd2 {Adds a defender to the f3 knight, so ...Bxf3 would not wreck White's pawns.}
        9...O-O
        10.h3 {Asks the bishop to decide. White is a clean pawn up.}`,
    },
  ],
};

export default opening;
