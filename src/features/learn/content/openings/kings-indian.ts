import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'kings-indian',
  name: "King's Indian Defence",
  side: 'black',
  order: 7,
  eco: 'E60–E99',
  thumb: 6,
  tagline: 'Let White build the centre, then attack it and the king.',
  match: ['d4 Nf6 c4 g6', 'd4 Nf6 Nf3 g6', 'd4 Nf6 Bf4 g6'],
  overview: {
    ideas:
      'Black fianchettoes the f8 bishop, castles fast and lets White take the centre. Then Black strikes with ...e5 (or ...c5). When White closes the centre with d5, Black attacks the white king with ...f5-f4 and ...g5 while White attacks on the queenside.',
    plans: [
      'Set up ...Nf6, ...g6, ...Bg7, ...d6 and ...O-O, then break with ...e5.',
      'After d5, reroute the f6 knight and push ...f5, ...f4 and ...g5 toward White\'s king.',
      'Against quiet setups like the London, play ...c5 and ...Nc6 to pressure d4.',
    ],
    structure: 'Black pawns on d6 and e5 against d5 and e4 after White closes the centre: each side attacks on the wing where its pawns point.',
    suits: 'Fighting players who like dynamic, double-edged games and kingside attacks.',
  },
  lines: [
    {
      id: 'mar-del-plata',
      name: 'Classical: Mar del Plata',
      summary: 'White closes the centre; Black regroups and storms the kingside with ...f5-f4.',
      moves: `1.d4 1...Nf6 {Develops and stops e4 for now.}
        2.c4 2...g6 {Prepares ...Bg7, aiming down the long diagonal.}
        3.Nc3 3...Bg7 {The bishop presses on d4 and the centre from afar.}
        4.e4 4...d6 {Keeps e5 under control and prepares ...e5.}
        5.Nf3 5...O-O {Castles quickly; the king is safe behind the fianchetto.}
        6.Be2 6...e5 {The key break: Black finally claims the centre.}
        7.O-O 7...Nc6 {Adds pressure on d4 and asks White to decide.}
        8.d5 {White closes the centre and gains space.}
        8...Ne7 {Heads to the kingside, where Black will attack.}
        9.Ne1 9...Nd7 {Clears the way for ...f5.}
        10.Nd3 10...f5 {Strikes at e4 and opens the f-file.}
        11.Bd2 11...Nf6 {Pressure on e4.}
        12.f3 12...f4 {Gains kingside space; ...g5-g4 is next. Both sides race on opposite wings.}`,
    },
    {
      id: 'fianchetto',
      from: 'mar-del-plata',
      name: 'Fianchetto: 3.Nf3 and g3',
      summary: 'White mirrors Black; the Panno setup with ...Nc6 and ...a6 gives queenside play.',
      moves: `3.Nf3 3...Bg7 {Completes the fianchetto.}
        4.g3 4...O-O {Castles.}
        5.Bg2 5...d6 {Controls e5 and opens the c8 bishop.}
        6.O-O 6...Nc6 {Pressure on d4.}
        7.Nc3 7...a6 {The Panno: prepares ...Rb8 and ...b5.}
        8.d5 8...Na5 {The knight attacks c4.}
        9.Nd2 9...c5 {Gains queenside space and supports the a5 knight. Black has clear play with ...Rb8 and ...b5.}`,
    },
    {
      id: 'london',
      from: 'mar-del-plata',
      name: 'Against the London: 2.Bf4',
      summary: 'Black fianchettoes and hits d4 with ...c5.',
      moves: `2.Bf4 {The London setup.}
        2...g6 {The fianchetto still works well here.}
        3.e3 3...Bg7 {Aims at d4 and b2.}
        4.Nf3 4...d6 {Prepares ...e5 or ...c5.}
        5.h3 5...O-O {Castles.}
        6.Be2 6...c5 {Hits d4 while White is still developing.}
        7.c3 7...Nc6 {Another attacker on d4.}
        8.O-O 8...Qb6 {Hits b2 and adds to the pressure on d4. Black is fully equal.}`,
    },
  ],
};

export default opening;
