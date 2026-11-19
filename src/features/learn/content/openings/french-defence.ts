import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'french-defence',
  name: 'French Defence',
  side: 'black',
  order: 3,
  eco: 'C00–C19',
  thumb: 4,
  tagline: 'A solid pawn chain, then hit its base with ...c5.',
  match: ['e4 e6'],
  overview: {
    ideas:
      'Black prepares ...d5 with 1...e6 so that d5 is always supported. White often closes the centre with e5; Black then attacks the d4 pawn, the base of White\'s chain, with ...c5, ...Nc6 and ...Qb6, and later sometimes with ...f6.',
    plans: [
      'Against e5, attack d4 at once with ...c5, ...Nc6 and ...Qb6.',
      'Close the queenside with ...c4 when White plays a3 and b4 ideas.',
      'In open lines, trade on d4 and use quick development against the isolated or exposed pawn.',
    ],
    structure: 'The French chain: Black pawns on e6 and d5 against White\'s d4 and e5. The c8 bishop is often the problem piece.',
    suits: 'Solid, patient players who like clear plans and counterattacks against a big centre.',
  },
  lines: [
    {
      id: 'advance',
      name: 'Advance: 3.e5',
      summary: 'Black attacks d4 with everything and locks the queenside with ...c4.',
      moves: `1.e4 1...e6 {Prepares ...d5 with full support.}
        2.d4 2...d5 {Challenges e4 straight away.}
        3.e5 {White gains space and takes f6 from Black's knight.}
        3...c5 {Hits d4, the base of White's pawn chain.}
        4.c3 4...Nc6 {Adds a second attacker on d4.}
        5.Nf3 5...Qb6 {A third attacker on d4, and the queen eyes b2.}
        6.a3 {White prepares b4 to grab queenside space.}
        6...c4 {Locks the queenside: b4 can now be met by ...cxb3, and b3 becomes a square for Black.}
        7.Nbd2 7...Na5 {Heads for b3, the hole created by ...c4.}
        8.Rb1 8...Bd7 {Develops and connects toward the queenside.}
        9.Be2 9...Ne7 {The knight heads for c6 or f5; Black has a firm queenside grip.}`,
    },
    {
      id: 'exchange',
      from: 'advance',
      name: 'Exchange: 3.exd5',
      summary: 'A symmetrical structure; Black develops actively and has no problems.',
      moves: `3.exd5 3...exd5 {Recaptures; the c8 bishop is now free.}
        4.Nf3 4...Nf6 {Develops and guards d5.}
        5.Bd3 5...Bd6 {Mirrors White: the bishop takes its best diagonal.}
        6.O-O 6...O-O {Castles quickly.}
        7.Bg5 7...Bg4 {Pins the knight in return.}
        8.Nbd2 8...Nbd7 {Develops and supports the f6 knight.}
        9.c3 9...c6 {Supports d5 and gives the queen c7.}
        10.Qc2 10...Qc7 {Mirrors White: the queen joins the bishop's diagonal and the rooks connect. Equal.}`,
    },
    {
      id: 'tarrasch',
      from: 'advance',
      name: 'Tarrasch: 3.Nd2',
      summary: 'Black opens the centre with ...c5 and accepts an open game with active pieces.',
      moves: `3.Nd2 {Keeps c3 free for the c-pawn and avoids a pin with ...Bb4.}
        3...c5 {Strikes at d4 while White's knight blocks the c1 bishop.}
        4.exd5 4...Qxd5 {Recaptures with the queen, avoiding an isolated pawn.}
        5.Ngf3 5...cxd4 {Opens the c-file.}
        6.Bc4 {Gains time on the queen.}
        6...Qd6 {Retreats to a safe square that also watches d4.}
        7.O-O 7...Nf6 {Develops and guards the kingside.}
        8.Nb3 8...Nc6 {Defends the d4 pawn for now.}
        9.Nbxd4 9...Nxd4 {Trades a pair of knights to ease Black's position.}
        10.Nxd4 10...a6 {Keeps White's pieces off b5 and prepares ...b5 or ...Qc7.}
        11.Re1 11...Qc7 {Steps off the d-file and prepares ...Bd6 or ...Bc5. Black is solid and fully developed soon.}`,
    },
    {
      id: 'steinitz',
      from: 'advance',
      name: 'Steinitz: 3.Nc3 Nf6 4.e5',
      summary: 'White builds a big centre with f4; Black undermines it from both sides.',
      moves: `3.Nc3 3...Nf6 {Attacks e4.}
        4.e5 4...Nfd7 {Retreats; the knight will help ...c5.}
        5.f4 5...c5 {Hits the base of the chain right away.}
        6.Nf3 6...Nc6 {Another attacker on d4.}
        7.Be3 7...cxd4 {Opens the c-file and frees c5 for the bishop.}
        8.Nxd4 8...Bc5 {Challenges the strong d4 knight.}
        9.Qd2 9...O-O {Castles before opening the f-file.}
        10.O-O-O 10...a6 {Prepares ...b5 for a queenside attack against White's king. Sharp but balanced.}`,
    },
  ],
};

export default opening;
