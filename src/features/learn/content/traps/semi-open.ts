import type { TrapSource } from '../../types';

/** Traps in the Sicilian, French and Caro-Kann. */
const traps: TrapSource[] = [
  {
    kind: 'trap',
    id: 'siberian-trap',
    name: 'Siberian Trap',
    order: 10,
    side: 'black',
    opening: 'Sicilian Defence, Smith-Morra Gambit',
    sound: true,
    tagline: 'Against the Smith-Morra, a knight jump to d4 mates on h2.',
    bait: '8...Ng4',
    avoid: 'With a black queen on c7 and a knight on g4, the knight on f3 is the only guard of h2. Do not kick the g4 knight with h3 while ...Nd4 is possible; play 9.Nb5 or 9.g3 first.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Mate on h2',
        summary: 'White kicks the knight with h3 and ...Nd4 removes the defender of h2.',
        moves: `1.e4 {White takes the centre.}
          1...c5 {The Sicilian.}
          2.d4 {Opens the centre at once.}
          2...cxd4 {Black takes.}
          3.c3 {The Smith-Morra Gambit: a pawn for fast development.}
          3...dxc3 {Black accepts.}
          4.Nxc3 {Recaptures with a developing move.}
          4...Nc6 {Develops and watches d4 and e5.}
          5.Nf3 {Develops toward the kingside.}
          5...e6 {Opens the bishop and keeps the d5 square under control.}
          6.Bc4 {The bishop aims at the weakened e6 and f7 squares.}
          6...Qc7 {The queen eyes the c-file and the long diagonal to h2.}
          7.O-O {White castles.}
          7...Nf6 {Develops, ready to jump to g4.}
          8.Qe2 {Prepares Rd1 and supports e4-e5 ideas.}
          8...Ng4 {The bait: knight and queen both aim at h2, which the knight on f3 guards.}
          9.h3?? {Kicking the knight seems natural, but it lets ...Nd4 hit the queen with gain of time.}
          9...Nd4 {Attacks the queen on e2 and the knight on f3.}
          10.Nxd4 {Taking the knight removes the defender of h2.}
          10...Qh2# {Mate. The knight on g4 protects the queen.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When White plays 9.Nb5',
        summary: 'White hits the queen first, and the game goes on with Black a pawn up.',
        moves: `9.Nb5 {Chases the queen off the h2 diagonal before doing anything else.}
          9...Qb8 {The queen keeps watching h2 from b8.}
          10.h3 {Now the knight can be kicked: if ...Nd4, the knight on b5 takes it and the f3 knight keeps guarding h2.}
          10...h5 {Black keeps the knight on g4, supported by the pawn. Black is a pawn up; White has activity.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'magnus-smith-trap',
    name: 'Magnus Smith Trap',
    order: 14,
    side: 'white',
    opening: 'Sicilian Defence, Dragon',
    sound: true,
    tagline: 'e4-e5 in the Dragon, then a bishop check on f7 wins the queen.',
    bait: '8.e5',
    avoid: 'In the Sicilian, if your queen and the white queen face each other on the d-file, a check that removes your king from the defence of d8 wins it. After 8.e5, play 8...Ng4 or 8...Nd7 instead of taking on e5.',
    lines: [
      {
        id: 'queen',
        role: 'trap',
        name: 'The queen falls',
        summary: 'Black opens the d-file with ...dxe5 and Bxf7+ deflects the king from the queen.',
        moves: `1.e4 {White takes the centre.}
          1...c5 {The Sicilian.}
          2.Nf3 {Prepares d4.}
          2...Nc6 {Develops and watches d4.}
          3.d4 {Opens the centre.}
          3...cxd4 {Black takes.}
          4.Nxd4 {White recaptures with a central knight.}
          4...Nf6 {Develops and attacks e4.}
          5.Nc3 {Defends e4.}
          5...d6 {Opens the c8 bishop.}
          6.Bc4 {The bishop aims at f7.}
          6...g6 {Black heads for a Dragon setup with ...Bg7.}
          7.Nxc6 {Trades knights to remove a defender of e5.}
          7...bxc6 {Recaptures toward the centre.}
          8.e5 {The bait: the pawn attacks the knight on f6.}
          8...dxe5?? {Taking opens the d-file between the queens and leaves f7 short of defenders.}
          9.Bxf7+ {Check: the king must take and leave d8.}
          9...Kxf7 {Forced.}
          10.Qxd8 {The queen on d8 is no longer defended by the king. White wins the queen.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'queen',
        name: 'When Black plays 8...Ng4',
        summary: 'Black moves the knight; White keeps a slightly better game.',
        moves: `8...Ng4 {The knight jumps to safety and eyes e5.}
          9.exd6 {Takes the pawn and opens the e-file.}
          9...Qxd6 {Recaptures, and the queen now faces the white queen on the d-file.}
          10.Qe2 {Moves off the d-file and eyes the e-file. White is a little better.}
          10...Bg7 {Develops the Dragon bishop.}
          11.h3 {Kicks the knight from g4.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'caro-kann-smothered-mate',
    name: 'Caro-Kann Smothered Mate',
    order: 13,
    side: 'white',
    opening: 'Caro-Kann Defence',
    sound: true,
    tagline: 'A pinned e-pawn lets a knight mate on d6.',
    bait: '5.Qe2',
    avoid: 'When a white queen sits on e2 and your e-pawn is still on e7, the d6 square is unguarded. After 5.Qe2, play 5...Ndf6 rather than 5...Ngf6.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Mate on d6',
        summary: 'Black develops the wrong knight and Nd6 is mate.',
        moves: `1.e4 {White takes the centre.}
          1...c6 {The Caro-Kann: prepares ...d5.}
          2.d4 {Takes more of the centre.}
          2...d5 {Black challenges e4.}
          3.Nc3 {Defends e4.}
          3...dxe4 {Black takes.}
          4.Nxe4 {Recaptures with a well-placed knight.}
          4...Nd7 {Prepares ...Ngf6 so Black can recapture with a knight.}
          5.Qe2 {The bait. It looks quiet, but it threatens Nd6 mate: once the knight leaves e4, the e7 pawn is pinned to the king.}
          5...Ngf6?? {A normal developing move, but it ignores the threat on d6.}
          6.Nd6# {Smothered mate. The e7 pawn cannot take because it is pinned to the king.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When Black plays 5...Ndf6',
        summary: 'Black develops the other knight and the position is equal.',
        moves: `5...Ndf6 {Moves the d7 knight, so the queen now covers d6 and the king gets d7. It also challenges the e4 knight.}
          6.Nxf6+ {White trades knights.}
          6...Nxf6 {Recaptures, completing development.}
          7.Nf3 {Develops the kingside.}
          7...Bg4 {Pins the knight. The position is about equal.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'french-d4-trap',
    name: 'Poisoned d4 Pawn',
    order: 15,
    side: 'white',
    opening: 'French Defence, Advance Variation',
    sound: true,
    tagline: 'Let Black win d4 with the queen, then check from b5.',
    bait: '6.Bd3',
    avoid: 'In the French Advance with Qb6 and Nc6, do not take on d4 while a bishop check on b5 can uncover an attack on your queen. Play 7...Bd7 first, which covers b5.',
    lines: [
      {
        id: 'queen',
        role: 'trap',
        name: 'Queen lost to a check',
        summary: 'Black grabs the d4 pawn and loses the queen to a discovered attack.',
        moves: `1.e4 {White takes the centre.}
          1...e6 {The French Defence.}
          2.d4 {Builds a big centre.}
          2...d5 {Challenges e4.}
          3.e5 {The Advance Variation: White gains space.}
          3...c5 {Black attacks the base of White's pawn chain.}
          4.c3 {Supports d4.}
          4...Nc6 {Adds pressure on d4.}
          5.Nf3 {Defends d4 again.}
          5...Qb6 {Adds pressure on d4 from behind the c5 pawn and hits b2.}
          6.Bd3 {The bait: White develops and seems to drop the d4 pawn.}
          6...cxd4 {Opens the c-file.}
          7.cxd4 {Recaptures.}
          7...Nxd4? {Wins a pawn, but the queen and knight end up on the same line as White's queen.}
          8.Nxd4 {Trades knights.}
          8...Qxd4 {Black seems to win a clean pawn.}
          9.Bb5+ {Check, and the white queen now attacks the black queen on d4.}
          9...Bd7 {Black must deal with the check.}
          10.Bxd7+ {Trades with check.}
          10...Kxd7 {Recaptures.}
          11.Qxd4 {White wins the queen.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'queen',
        name: 'When Black plays 7...Bd7',
        summary: 'White offers the pawn as a real gambit: the Milner-Barry.',
        moves: `7...Bd7 {Covers b5 first, so the bishop check no longer works.}
          8.O-O {The Milner-Barry Gambit: White offers d4 for fast development.}
          8...Nxd4 {Black accepts.}
          9.Nxd4 {Trades knights.}
          9...Qxd4 {Black is a pawn up.}
          10.Nc3 {Develops with ideas of Nb5 and Qe2. White has compensation for the pawn.}`,
      },
    ],
  },
];

export default traps;
