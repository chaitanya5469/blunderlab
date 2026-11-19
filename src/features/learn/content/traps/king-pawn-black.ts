import type { TrapSource } from '../../types';

/** Traps Black sets after 1.e4 e5. */
const traps: TrapSource[] = [
  {
    kind: 'trap',
    id: 'blackburne-shilling',
    name: 'Blackburne Shilling Gambit',
    order: 5,
    side: 'black',
    opening: 'Italian Game',
    sound: false,
    tagline: 'Leave e5 hanging, then mate on f3 if White gets greedy.',
    bait: '3...Nd4',
    avoid: 'Against 3...Nd4, do not take on e5. Play 4.Nxd4 exd4 5.O-O (or 5.c3) and enjoy a lead in development. If you already took on e5 and the queen hits g2, retreat with 5.Ng4 instead of taking on f7.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Mate on f3',
        summary: 'White takes the pawn, then the rook, and walks into a smothered-style mate.',
        moves: `1.e4 {White takes the centre.}
          1...e5 {Black claims his share.}
          2.Nf3 {Attacks e5.}
          2...Nc6 {Defends e5.}
          3.Bc4 {The Italian bishop eyes f7.}
          3...Nd4 {The bait: the knight walks away from e5 and leaves the pawn undefended. It is a dubious move that hopes White grabs.}
          4.Nxe5?! {Taking the pawn looks free and attacks f7 twice, but it walks into Black's idea.}
          4...Qg5 {Attacks the knight on e5 and the g2 pawn at the same time.}
          5.Nxf7?? {Forks queen and rook, but it ignores the threat to g2.}
          5...Qxg2 {Takes the pawn and attacks the rook on h1.}
          6.Rf1 {Saves the rook, but now the king has fewer squares.}
          6...Qxe4+ {Check, picking up the e4 pawn.}
          7.Be2 {Blocks the check, but it walks into mate.}
          7...Nf3# {Mate. The bishop on e2 is pinned by the queen and cannot take the knight.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When White trades knights',
        summary: 'White ignores the pawn, trades on d4 and gets a lead in development.',
        moves: `4.Nxd4 {The best reply: trade off the annoying knight.}
          4...exd4 {Black's pawn on d4 is now a little exposed.}
          5.O-O {White castles and gets ready for c3 or Re1.}
          5...Nf6 {Develops and attacks e4.}
          6.Re1 {Defends e4 and prepares e5 or c3.}
          6...d6 {Controls e5 and opens the c8 bishop.}
          7.c3 {Challenges d4. White is better, but Black has a normal position to fight with.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'stafford-gambit',
    name: 'Stafford Gambit Traps',
    order: 6,
    side: 'black',
    opening: "Petrov's Defence, Stafford Gambit",
    sound: false,
    tagline: 'Give up e5 for wild piece play aimed at f2.',
    bait: '3...Nc6',
    avoid: 'Take the pawn and keep it safe: after 3...Nc6 4.Nxc6 dxc6, play 5.d3 then 6.Be2 and 7.h3 to stop ...Ng4, and do not pin with Bg5. Never let a bishop on c5 and a knight on g4 combine against f2 for free.',
    lines: [
      {
        id: 'bg5',
        role: 'trap',
        name: "Oh no, my queen",
        summary: 'White pins the knight with Bg5 and is mated after ...Nxe4.',
        moves: `1.e4 {White takes the centre.}
          1...e5 {Black answers in kind.}
          2.Nf3 {Attacks e5.}
          2...Nf6 {Petrov's Defence: counterattack on e4.}
          3.Nxe5 {White takes the pawn.}
          3...Nc6 {The bait: Black gives a pawn to open lines for the pieces.}
          4.Nxc6 {White trades the knight.}
          4...dxc6 {Recaptures toward the centre, opening the d-file and the c8 bishop.}
          5.d3 {Protects e4 and opens the c1 bishop.}
          5...Bc5 {The bishop aims at f2, the weak square next to White's king.}
          6.Bg5?? {Pinning the knight looks strong, but it leaves the e4 pawn loose and the king short of squares.}
          6...Nxe4 {Gives up the queen, because the pieces will mate.}
          7.Bxd8 {White takes the queen.}
          7...Bxf2+ {Check from f2.}
          8.Ke2 {The only move.}
          8...Bg4# {Mate. The king is boxed in by its own pieces and Black's bishops and knight.}`,
      },
      {
        id: 'e5',
        role: 'trap',
        from: 'bg5',
        name: 'Queen lost on d1',
        summary: 'White chases the knight with e5 and d3 and loses the queen to a bishop check.',
        moves: `5.e5 {Kicks the knight and gains space.}
          5...Ne4 {The knight takes a central square.}
          6.d3? {Attacks the knight, but it ignores the danger around f2.}
          6...Bc5 {Ignores the threat and aims at f2.}
          7.dxe4 {Wins the knight.}
          7...Bxf2+ {Check, dragging the king forward.}
          8.Ke2 {The only legal move.}
          8...Bg4+ {Check from g4, and the bishop attacks the queen on d1 behind the king. Black wins the queen.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'bg5',
        name: 'When White plays safely',
        summary: 'White develops and stops ...Ng4; Black is simply a pawn down.',
        moves: `6.Be2 {Covers g4 and prepares to castle. White keeps the extra pawn.}
          6...h5 {Black's typical try: support ...Ng4 with the h-pawn.}
          7.h3 {Takes g4 away from the knight for good.}
          7...Qd4 {Black lines up queen and bishop against f2.}
          8.Rf1 {The rook defends f2. White is a healthy pawn up and Black's attack has run out.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'fishing-pole',
    name: 'Fishing Pole Trap',
    order: 8,
    side: 'black',
    opening: 'Ruy Lopez, Berlin Defence',
    sound: false,
    tagline: 'Dangle a knight on g4; if White takes, the h-file opens.',
    bait: '4...Ng4',
    avoid: 'Do not take the knight on g4 after ...h5: the h-file opens straight at your king. Play 6.d4 or 6.c3 and use your extra tempo in the centre.',
    lines: [
      {
        id: 'h-file',
        role: 'trap',
        name: 'Mate on the h-file',
        summary: 'White takes the knight and Black mates down the open h-file.',
        moves: `1.e4 {White takes the centre.}
          1...e5 {Black answers in kind.}
          2.Nf3 {Attacks e5.}
          2...Nc6 {Defends e5.}
          3.Bb5 {The Ruy Lopez.}
          3...Nf6 {The Berlin Defence: counterattack on e4.}
          4.O-O {White castles, offering the e4 pawn for now.}
          4...Ng4 {The bait. The knight goes forward with no clear purpose except to be taken.}
          5.h3 {Natural: kick the knight.}
          5...h5 {The fishing pole: the knight stays, defended by the h-pawn.}
          6.hxg4? {Takes the bait. The h-file opens toward White's king.}
          6...hxg4 {Recaptures and attacks the knight on f3.}
          7.Ne1 {The knight runs, but it no longer guards h2.}
          7...Qh4 {Queen and rook line up on the h-file.}
          8.f3 {Tries to make room for the king.}
          8...g3 {Takes the h2 square away. Mate on h2 or h1 cannot be stopped.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'h-file',
        name: 'When White ignores the knight',
        summary: 'White strikes in the centre and Black has wasted time.',
        moves: `6.d4 {Ignores the knight and opens the centre while Black's pieces are offside.}
          6...exd4 {Black takes, since e5 was attacked.}
          7.c3 {Offers a pawn to open lines quickly.}
          7...a6 {Puts the question to the bishop.}
          8.Bxc6 {Trades to damage Black's pawns.}
          8...bxc6 {Recaptures.}
          9.cxd4 {White has a strong centre and a big lead in development. White is clearly better.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'noahs-ark',
    name: "Noah's Ark Trap",
    order: 9,
    side: 'black',
    opening: 'Ruy Lopez, Steinitz Deferred',
    sound: true,
    tagline: "Trap White's Spanish bishop with a queenside pawn chain.",
    bait: '6...Nxd4',
    avoid: 'When Black has pushed ...a6 and ...b5, watch your bishop on b3: ...c5 and ...c4 can trap it. Do not recapture on d4 with the queen; play 8.Bd5 or 8.c3 instead.',
    lines: [
      {
        id: 'ark',
        role: 'trap',
        name: 'The bishop is trapped',
        summary: 'White recaptures with the queen and the bishop on b3 is caught.',
        moves: `1.e4 {White takes the centre.}
          1...e5 {Black answers in kind.}
          2.Nf3 {Attacks e5.}
          2...Nc6 {Defends e5.}
          3.Bb5 {The Ruy Lopez.}
          3...a6 {Asks the bishop to decide.}
          4.Ba4 {Keeps the pin on the knight.}
          4...d6 {Supports e5 solidly.}
          5.d4 {Strikes in the centre.}
          5...b5 {Breaks the pin and drives the bishop back.}
          6.Bb3 {The bishop retreats to its usual diagonal.}
          6...Nxd4 {The bait: Black trades knights on d4.}
          7.Nxd4 {Recaptures.}
          7...exd4 {Now the d4 pawn looks loose.}
          8.Qxd4?? {Natural, but the queen is about to be chased and the bishop has no retreat.}
          8...c5 {Attacks the queen and threatens ...c4.}
          9.Qd5 {The queen keeps an eye on a8 and f7.}
          9...Be6 {Attacks the queen with tempo.}
          10.Qc6+ {Check, but it achieves nothing.}
          10...Bd7 {Blocks and attacks the queen again.}
          11.Qd5 {Back again.}
          11...c4 {The ark closes: the bishop on b3 has no safe square. Black wins a piece.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'ark',
        name: 'When White plays 8.Bd5',
        summary: 'White uses the bishop actively and wins the pawn back safely.',
        moves: `8.Bd5 {The bishop attacks the rook on a8 before it can be trapped.}
          8...Rb8 {The rook steps aside.}
          9.Bc6+ {Check, forcing a trade of bishops.}
          9...Bd7 {Blocks the check.}
          10.Bxd7+ {Trades the bishop that could have been trapped.}
          10...Qxd7 {Recaptures.}
          11.Qxd4 {Now the pawn falls safely. The position is about equal.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'mortimer-trap',
    name: 'Mortimer Trap',
    order: 21,
    side: 'black',
    opening: 'Ruy Lopez, Berlin Defence',
    sound: true,
    tagline: 'A quiet knight retreat invites Nxe5, then a queen check forks.',
    bait: '4...Ne7',
    avoid: 'If a knight leaves e5 undefended for no reason, look for the queen check that follows. After 4...Ne7, develop with 5.O-O or 5.Nc3 and do not grab e5.',
    lines: [
      {
        id: 'fork',
        role: 'trap',
        name: 'Queen fork on a5',
        summary: 'White grabs e5 and a queen check wins the knight.',
        moves: `1.e4 {White takes the centre.}
          1...e5 {Black answers in kind.}
          2.Nf3 {Attacks e5.}
          2...Nc6 {Defends e5.}
          3.Bb5 {The Ruy Lopez.}
          3...Nf6 {The Berlin Defence.}
          4.d3 {A solid way to defend e4.}
          4...Ne7 {The bait: the knight heads for g6 and leaves e5 without a defender.}
          5.Nxe5? {Takes the pawn, but the knight on e5 and the king are both on squares the queen can reach.}
          5...c6 {Attacks the bishop first.}
          6.Ba4 {The bishop keeps the a4-e8 diagonal.}
          6...Qa5+ {Check, and the queen also attacks the knight on e5.}
          7.c3 {Blocks the check.}
          7...Qxe5 {Black wins the knight for a pawn.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'fork',
        name: 'When White castles',
        summary: 'White develops normally and Black regroups with ...Ng6.',
        moves: `5.O-O {White ignores the pawn and castles.}
          5...c6 {Attacks the bishop.}
          6.Bc4 {The bishop retreats to a good diagonal.}
          6...Ng6 {The knight completes its trip and defends e5 again.}
          7.d4 {White grabs space in the centre. The position is level.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'marshall-trap',
    name: 'Marshall Trap',
    order: 22,
    side: 'black',
    opening: "Petrov's Defence",
    sound: true,
    tagline: 'A bishop sacrifice on h2 rips open the white king.',
    bait: '9...f5',
    avoid: 'With a black knight on e4 and bishop on d6, watch the h2 square. After 10...Bxh2+, step aside with 11.Kf1 instead of taking the bishop.',
    lines: [
      {
        id: 'sacrifice',
        role: 'trap',
        name: 'The h2 sacrifice',
        summary: 'White takes the bishop on h2 and loses material to a string of tactics.',
        moves: `1.e4 {White takes the centre.}
          1...e5 {Black answers in kind.}
          2.Nf3 {Attacks e5.}
          2...Nf6 {Petrov's Defence.}
          3.Nxe5 {White takes the pawn.}
          3...d6 {First kick the knight, then take on e4.}
          4.Nf3 {The knight retreats.}
          4...Nxe4 {Black wins the pawn back.}
          5.d4 {Takes the centre.}
          5...d5 {Supports the knight on e4.}
          6.Bd3 {Develops and attacks the knight.}
          6...Bd6 {The bishop aims at h2.}
          7.O-O {White castles.}
          7...O-O {Black castles too.}
          8.c4 {Attacks d5, the support of the knight.}
          8...Bg4 {Pins the knight on f3 to the queen.}
          9.cxd5 {Wins a pawn.}
          9...f5 {The bait: Black defends the knight and lets d5 go.}
          10.Re1 {Attacks the knight a second time.}
          10...Bxh2+ {Gives the bishop to expose the king.}
          11.Kxh2? {Taking is the mistake; the king walks into a knight fork.}
          11...Nxf2 {The knight hits the queen on d1 and the bishop on d3.}
          12.Qe2 {The queen escapes.}
          12...Nxd3 {Black takes the bishop, and the rook on e1 is attacked.}
          13.Qxd3 {Recaptures.}
          13...Bxf3 {Removes the knight that guarded h4 and the rook on e1.}
          14.Qxf3 {Recaptures.}
          14...Qh4+ {Check on the open h-file.}
          15.Kg1 {The only safe square.}
          15...Qxe1+ {Wins the rook. Black is clearly winning.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'sacrifice',
        name: 'When the king steps aside',
        summary: 'White declines the bishop with Kf1 and the game stays balanced.',
        moves: `11.Kf1 {The king sidesteps the sacrifice; the bishop on h2 is now out of play.}
          11...Qe8 {The queen heads for the h-file.}
          12.Nbd2 {Challenges the knight on e4.}
          12...Qh5 {Black keeps up the pressure on the kingside. Chances are about level.}`,
      },
    ],
  },
];

export default traps;
