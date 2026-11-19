import type { TrapSource } from '../../types';

/** Traps after 1.d4. */
const traps: TrapSource[] = [
  {
    kind: 'trap',
    id: 'englund-gambit-trap',
    name: 'Englund Gambit Trap',
    order: 11,
    side: 'black',
    opening: 'Englund Gambit',
    sound: false,
    tagline: 'A queen raid on b2 ends with mate on c1.',
    bait: '3...Qe7',
    avoid: 'After 4...Qb4+ 5.Bd2 Qxb2, play 6.Nc3: it develops and lets the queen on d1 protect the rook, and after 6...Bb4 7.Rb1 the black queen is the one in danger. Never block with Bc3 while c1 is weak.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Mate on c1',
        summary: 'White blocks with Bc3 and is mated on the back rank.',
        moves: `1.d4 {White takes the centre.}
          1...e5 {The Englund Gambit: a pawn offered on move one.}
          2.dxe5 {White accepts.}
          2...Nc6 {Attacks the e5 pawn.}
          3.Nf3 {Defends e5.}
          3...Qe7 {The bait: the queen attacks e5 and prepares ...Qb4+.}
          4.Bf4 {Defends e5 a second time; natural, but it leaves b2 loose.}
          4...Qb4+ {A double attack: check, and the queen hits b2.}
          5.Bd2 {Blocks the check.}
          5...Qxb2 {Takes the pawn and attacks the rook on a1.}
          6.Bc3?? {Attacks the queen and seems to win time, but the bishop can be pinned.}
          6...Bb4 {Pins the bishop to the king; now c3 is attacked by both queen and bishop.}
          7.Qd2 {Defends the bishop on c3.}
          7...Bxc3 {Removes the defender.}
          8.Qxc3 {Recaptures.}
          8...Qc1# {Mate on the back rank: the c2 pawn shields c1 from the white queen and the knight on b1 blocks the rook.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When White plays 6.Nc3',
        summary: 'White develops and the black queen is the one in trouble.',
        moves: `6.Nc3 {Develops; with b1 and c1 cleared, the queen on d1 now protects the rook on a1.}
          6...Bb4 {Adds a second attacker on the c3 knight.}
          7.Rb1 {Attacks the queen.}
          7...Qa3 {The queen steps away.}
          8.Rb3 {Attacks it again.}
          8...Qa5 {The queen escapes, but White has a big lead in development and Black's queen is still exposed.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'elephant-trap',
    name: 'Elephant Trap',
    order: 12,
    side: 'black',
    opening: "Queen's Gambit Declined",
    sound: true,
    tagline: 'The pin on f6 is an illusion: grabbing d5 loses a piece.',
    bait: '4...Nbd7',
    avoid: 'In the QGD with Bg5, check whether the pin on the f6 knight is real before winning d5. After 5.cxd5 exd5, play 6.e3 and develop; Nxd5 only works if ...Nxd5 does not uncover your queen.',
    lines: [
      {
        id: 'trap',
        role: 'trap',
        name: 'Winning a piece',
        summary: 'White takes on d5 and loses a piece to ...Nxd5 and ...Bb4+.',
        moves: `1.d4 {White takes the centre.}
          1...d5 {Black does the same.}
          2.c4 {The Queen's Gambit.}
          2...e6 {Declines and supports d5.}
          3.Nc3 {Develops and adds pressure on d5.}
          3...Nf6 {Defends d5 again.}
          4.Bg5 {Pins the knight to the queen.}
          4...Nbd7 {The bait: with the f6 knight pinned, d5 looks short of defenders.}
          5.cxd5 {Releases the tension.}
          5...exd5 {Recaptures and opens the c8 bishop.}
          6.Nxd5?? {Takes the pawn, counting on the pin, but the pin is not real.}
          6...Nxd5 {Black ignores the attack on the queen.}
          7.Bxd8 {White takes the queen.}
          7...Bb4+ {Check: White must give the queen back.}
          8.Qd2 {The only legal move.}
          8...Bxd2+ {Takes the queen with check.}
          9.Kxd2 {Recaptures.}
          9...Kxd8 {Black takes the bishop and is a piece up.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'trap',
        name: 'When White plays 6.e3',
        summary: 'White develops into the Exchange Variation and the game is balanced.',
        moves: `6.e3 {White ignores d5 and opens the f1 bishop.}
          6...c6 {Supports d5 and gives the queen a path to a5 or b6.}
          7.Bd3 {Develops toward the kingside.}
          7...Be7 {Breaks the pin.}
          8.Qc2 {Eyes h7 and prepares to castle either side.}
          8...O-O {Black castles. A standard Exchange QGD with level chances.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'lasker-trap',
    name: 'Lasker Trap',
    order: 16,
    side: 'black',
    opening: 'Albin Countergambit',
    sound: false,
    tagline: 'An underpromotion to a knight with check wins the game.',
    bait: '5...dxe3',
    avoid: 'Against the Albin, play 4.Nf3 instead of 4.e3. If you are in this line, recapture with 6.fxe3 rather than taking the bishop on b4.',
    lines: [
      {
        id: 'knight',
        role: 'trap',
        name: 'Promotion to a knight',
        summary: 'White takes the bishop and the pawn crashes through to g1.',
        moves: `1.d4 {White takes the centre.}
          1...d5 {Black does the same.}
          2.c4 {The Queen's Gambit.}
          2...e5 {The Albin Countergambit: Black hits back in the centre.}
          3.dxe5 {White takes.}
          3...d4 {The pawn cramps White and eyes e3.}
          4.e3 {Challenges the d4 pawn. 4.Nf3 is the safer move.}
          4...Bb4+ {Check, before White can untangle.}
          5.Bd2 {Blocks.}
          5...dxe3 {The bait: the bishop on b4 is left hanging.}
          6.Bxb4?? {Wins a piece, but the pawn keeps rolling.}
          6...exf2+ {Check, and the pawn attacks g1.}
          7.Ke2 {7.Kxf2 would lose the queen to ...Qxd1, so the king steps up.}
          7...fxg1=N+ {Promotes to a knight with check. A queen would be taken by the rook.}
          8.Ke1 {8.Rxg1 Bg4+ wins the white queen.}
          8...Qh4+ {Check along the open diagonal.}
          9.Kd2 {The king runs.}
          9...Nc6 {Brings another piece in, attacking the bishop on b4.}
          10.Bc3 {Saves the bishop.}
          10...Bg4 {Hits the queen. Black's attack is decisive.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'knight',
        name: 'When White plays 6.fxe3',
        summary: 'White recaptures the pawn and the game is roughly level.',
        moves: `6.fxe3 {Recaptures toward the centre; the bishop on b4 is still attacked.}
          6...Qh4+ {Black checks on the weakened diagonal.}
          7.g3 {Blocks.}
          7...Qe4 {Centralises the queen, hitting the rook on h1 and the e3 pawn.}
          8.Nf3 {Develops and defends.}
          8...Bxd2+ {Trades bishops.}
          9.Nbxd2 {Recaptures. White is a pawn up, but Black's queen is active. Chances are level.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'kieninger-trap',
    name: 'Kieninger Trap',
    order: 17,
    side: 'black',
    opening: 'Budapest Gambit',
    sound: true,
    tagline: 'Smothered mate on d3 in the Budapest Gambit.',
    bait: '7...Ngxe5',
    avoid: 'When a black queen sits on e7 facing your king, the e2 pawn is pinned. Do not take the bishop on b4 with a knight on e5 able to jump to d3; play 8.Nxe5 first.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Smothered mate',
        summary: 'White takes the bishop and ...Nd3 is mate.',
        moves: `1.d4 {White takes the centre.}
          1...Nf6 {Flexible development.}
          2.c4 {Grabs more space.}
          2...e5 {The Budapest Gambit.}
          3.dxe5 {White accepts.}
          3...Ng4 {Attacks e5.}
          4.Bf4 {Defends e5.}
          4...Nc6 {Attacks e5 again.}
          5.Nf3 {Defends it a third time.}
          5...Bb4+ {Check, developing.}
          6.Nbd2 {Blocks.}
          6...Qe7 {Attacks e5 once more and lines up on the e-file with the white king.}
          7.a3 {Attacks the bishop.}
          7...Ngxe5 {The bait: Black leaves the bishop hanging.}
          8.axb4?? {Wins the bishop and allows mate.}
          8...Nd3# {Smothered mate: the e2 pawn is pinned by the queen and every square around the king is blocked.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When White plays 8.Nxe5',
        summary: 'White trades knights first and the game is balanced.',
        moves: `8.Nxe5 {Removes the dangerous knight.}
          8...Nxe5 {Recaptures.}
          9.e3 {Frees the f1 bishop, and the bishop on b4 is still attacked.}
          9...Bxd2+ {Trades instead of retreating.}
          10.Qxd2 {Recaptures. White has the bishop pair, Black a solid knight on e5.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'cambridge-springs-trap',
    name: 'Cambridge Springs Trap',
    order: 18,
    side: 'black',
    opening: "Queen's Gambit Declined, Cambridge Springs",
    sound: true,
    tagline: 'Queen on a5 plus ...Ne4 hits the g5 bishop twice.',
    bait: '6...Qa5',
    avoid: 'In the Cambridge Springs, the bishop on g5 and the pinned knight on c3 are both loose. Play 7.Nd2 (or 7.cxd5) instead of a careless 7.Bd3.',
    lines: [
      {
        id: 'piece',
        role: 'trap',
        name: 'Winning a piece',
        summary: 'White develops with Bd3 and loses a piece on g5.',
        moves: `1.d4 {White takes the centre.}
          1...d5 {Black does the same.}
          2.c4 {The Queen's Gambit.}
          2...e6 {Declines.}
          3.Nc3 {Develops.}
          3...Nf6 {Develops.}
          4.Bg5 {Pins the knight.}
          4...Nbd7 {Develops.}
          5.e3 {Opens the bishop.}
          5...c6 {Prepares ...Qa5.}
          6.Nf3 {Develops.}
          6...Qa5 {The bait: the queen pins the c3 knight and will hit g5 once the d5 pawn moves.}
          7.Bd3? {Natural development, but g5 is about to be attacked twice.}
          7...Ne4 {Hits the c3 knight and the g5 bishop.}
          8.O-O {White castles and leaves g5 to its fate.}
          8...Nxg5 {Takes the bishop.}
          9.Nxg5 {Recaptures.}
          9...dxc4 {Attacks the bishop on d3, and the queen now sees g5 along the open fifth rank.}
          10.Bxc4 {Saves the bishop.}
          10...Qxg5 {Takes the knight. Black is a piece up.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'piece',
        name: 'When White plays 7.Nd2',
        summary: 'The main line: White defends against the pin and the game is level.',
        moves: `7.Nd2 {The main line: the knight covers e4, so ...Ne4 is not possible.}
          7...Bb4 {Adds pressure on the pinned knight.}
          8.Qc2 {Defends c3 again.}
          8...O-O {Black castles.}
          9.Be2 {Develops.}
          9...e5 {Strikes in the centre. Equal chances.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'qga-b5-trap',
    name: "Queen's Gambit Accepted Trap",
    order: 19,
    side: 'white',
    opening: "Queen's Gambit Accepted",
    sound: true,
    tagline: 'Holding the c4 pawn with ...b5 opens the long diagonal to a8.',
    bait: '4.a4',
    avoid: "Don't try to keep the c4 pawn with ...b5 and ...c6. Develop with 3...Nf6 and ...e6 and let White win the pawn back.",
    lines: [
      {
        id: 'rook',
        role: 'trap',
        name: 'The long diagonal',
        summary: 'Black recaptures on b5 and Qf3 hits the rook on a8.',
        moves: `1.d4 {White takes the centre.}
          1...d5 {Black does the same.}
          2.c4 {The Queen's Gambit.}
          2...dxc4 {Black accepts.}
          3.e3 {Opens the f1 bishop to win c4 back.}
          3...b5?! {Black tries to keep the pawn.}
          4.a4 {The bait: White undermines b5.}
          4...c6 {Supports b5.}
          5.axb5 {Takes on b5.}
          5...cxb5?? {Recaptures, but it empties the long diagonal from f3 to a8.}
          6.Qf3 {Attacks the rook on a8 and the knight on b8 cannot block safely.}
          6...Nc6 {Blocks.}
          7.Qxc6+ {Takes the knight with check.}
          7...Bd7 {Blocks.}
          8.Qe4 {White is a piece up.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'rook',
        name: 'When Black plays 5...e6',
        summary: 'Black gives back the pawn and White keeps a pleasant edge.',
        moves: `5...e6 {Keeps the a8-h1 diagonal closed and opens the f8 bishop.}
          6.Bxc4 {White wins the pawn back.}
          6...Nf6 {Develops.}
          7.Nf3 {Develops. White is clearly better, with pressure down the open a-file.}
          7...Be7 {Prepares to castle.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'halosar-trap',
    name: 'Halosar Trap',
    order: 20,
    side: 'white',
    opening: 'Blackmar-Diemer Gambit',
    sound: false,
    tagline: 'After long castling, Nb5 threatens mate on c7.',
    bait: '7.O-O-O',
    avoid: 'In the Blackmar-Diemer, after 7.O-O-O watch the c7 square and the d-file. Play 7...c6, covering b5, before developing the bishop.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Mate on c7',
        summary: 'Black pins the queen with ...Bg4 and takes it, allowing Nxc7 mate.',
        moves: `1.d4 {White takes the centre.}
          1...d5 {Black does the same.}
          2.e4 {The Blackmar-Diemer Gambit: White offers a pawn.}
          2...dxe4 {Black accepts.}
          3.Nc3 {Develops and attacks e4.}
          3...Nf6 {Defends e4.}
          4.f3 {Offers a second pawn to open the f-file.}
          4...exf3 {Black accepts.}
          5.Qxf3 {Recaptures with the queen, eyeing b7.}
          5...Qxd4 {Black grabs a third pawn.}
          6.Be3 {Develops with tempo on the queen.}
          6...Qb4 {The queen eyes b2.}
          7.O-O-O {The bait: the rook lands on the open d-file.}
          7...Bg4? {Attacks the queen, but the knight can now jump to b5.}
          8.Nb5 {Ignores the attack on the queen and threatens Nxc7, which would be mate.}
          8...Bxf3 {Takes the queen, but it is too late.}
          9.Nxc7# {Mate. The rook on d1 covers d7 and d8.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When Black plays 7...c6',
        summary: 'Black covers b5 and d5; White has play for the pawns.',
        moves: `7...c6 {Covers b5 and d5, so the knight has no entry.}
          8.a3 {Kicks the queen.}
          8...Qa5 {The queen retreats.}
          9.Qg3 {Moves to the kingside, eyeing b8 and c7. White has activity for the pawns.}
          9...g6 {Prepares ...Bg7. Black is fine.}`,
      },
    ],
  },
];

export default traps;
