import type { TrapSource } from '../../types';

/** Traps White sets after 1.e4. */
const traps: TrapSource[] = [
  {
    kind: 'trap',
    id: 'scholars-mate',
    name: "Scholar's Mate",
    order: 1,
    side: 'white',
    opening: "Bishop's Opening",
    sound: true,
    tagline: 'Queen and bishop gang up on f7 before Black is ready.',
    bait: '3.Qh5',
    avoid: 'Whenever a queen and bishop both aim at f7, count its defenders before you develop. 3...g6 or 3...Qe7 stops the mate, and the early queen then becomes a target for your pieces.',
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'Mate on f7',
        summary: 'Black develops naturally and misses the threat to f7.',
        moves: `1.e4 {Opens lines for the queen and the light-squared bishop.}
          1...e5 {Black claims an equal share of the centre.}
          2.Bc4 {The bishop aims at f7, the weakest square in Black's camp: only the king guards it.}
          2...Nc6 {Develops and defends the e5 pawn.}
          3.Qh5 {The bait. Queen and bishop now both hit f7, and the queen also attacks e5.}
          3...Nf6?? {It develops and attacks the queen, so it feels active, but it does nothing for f7.}
          4.Qxf7# {Checkmate. The bishop on c4 protects the queen, so the king cannot take it.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When Black defends',
        summary: 'Black blocks with ...g6; White must develop quickly, because the queen is now a target.',
        moves: `3...g6 {Blocks the queen's diagonal to f7 and attacks the queen. The knight on c6 already guards e5.}
          4.Qf3 {Renews the threat on f7 from another angle, together with the bishop.}
          4...Nf6 {Puts a piece between the queen and f7, developing at the same time.}
          5.Ne2 {Develops behind the queen so the f3 square stays free for her; White now needs to catch up on development.}
          5...Bg7 {Finishes the kingside so Black can castle. The position is about equal and Black's development is easy.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'legal-mate',
    name: "Légal's Mate",
    order: 2,
    side: 'white',
    opening: 'Philidor Defence',
    sound: true,
    tagline: 'Give up the queen, then mate with three minor pieces.',
    bait: '5.Nxe5',
    avoid: "Don't pin a knight with ...Bg4 and then make slow moves like ...g6: it lets White break the pin with Nxe5. If White does sacrifice the queen, recapture on e5 with the pawn and accept being a pawn down rather than grabbing the queen.",
    lines: [
      {
        id: 'mate',
        role: 'trap',
        name: 'The queen sacrifice',
        summary: 'Black grabs the queen and is mated by the minor pieces.',
        moves: `1.e4 {Takes the centre and frees the bishop and queen.}
          1...e5 {Black stakes out the centre too.}
          2.Nf3 {Develops with an attack on e5.}
          2...d6 {The Philidor Defence: solid, but it shuts in Black's dark-squared bishop.}
          3.Bc4 {The bishop eyes f7, still guarded only by the king.}
          3...Bg4 {Pins the knight to the queen; Black hopes White can't move it.}
          4.Nc3 {Develops and covers d5, a square the knight will use later.}
          4...g6?! {A slow move. It does nothing about the centre and prepares the trap's punishment.}
          5.Nxe5 {The bait: White moves the pinned knight and lets the queen hang.}
          5...Bxd1?? {Winning the queen looks irresistible, but Black's king is about to be mated.}
          6.Bxf7+ {The bishop checks from f7, protected by the knight on e5.}
          6...Ke7 {The only legal move.}
          7.Nd5# {Mate. The two knights and the bishop cover every escape square.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'mate',
        name: 'When Black takes the knight',
        summary: 'Black recaptures on e5 and White simply wins the bishop back, a pawn up.',
        moves: `5...dxe5 {The right reaction: take the knight. The bishop on g4 is now attacked by the queen, but Black is only a pawn down.}
          6.Qxg4 {White wins the bishop back. Material: White is a pawn up with a lead in development.}
          6...Nc6 {Develops and guards the e5 pawn.}
          7.d3 {Opens the c1 bishop and secures e4.}
          7...Nf6 {Develops with a hit on the queen.}
          8.Qg3 {The queen steps back and eyes e5. White keeps the extra pawn and a comfortable game.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'fried-liver',
    name: 'Fried Liver Attack',
    order: 3,
    side: 'white',
    opening: 'Italian Game, Two Knights Defence',
    sound: true,
    tagline: 'A knight sacrifice on f7 drags the black king into the open.',
    bait: '4.Ng5',
    avoid: 'After 4.Ng5 d5 5.exd5, play 5...Na5 to hit the bishop instead of recapturing on d5. If you have already taken on d5 and White sacrifices on f7, defend with 8...Ncb4 (eyeing c2), not passive moves.',
    lines: [
      {
        id: 'sacrifice',
        role: 'trap',
        name: 'The f7 sacrifice',
        summary: 'Black recaptures on d5 and the king is hunted in the centre.',
        moves: `1.e4 {Takes the centre and opens lines for the queen and bishop.}
          1...e5 {Black claims his share of the centre.}
          2.Nf3 {Develops and attacks e5.}
          2...Nc6 {Develops and defends e5.}
          3.Bc4 {Aims the bishop at f7.}
          3...Nf6 {The Two Knights Defence: Black counterattacks e4.}
          4.Ng5 {The bait. Knight and bishop both attack f7 and Black must react at once.}
          4...d5 {The standard reply, blocking the bishop's diagonal.}
          5.exd5 {Takes the pawn and reopens the diagonal; the d5 pawn is attacked by the knight.}
          5...Nxd5? {The natural recapture, but now the knight on d5 is a target and f7 is weak.}
          6.Nxf7 {White gives a knight to pull the king out.}
          6...Kxf7 {Black has to take: the knight on f7 forks the queen and the rook on h8.}
          7.Qf3+ {Check, and the queen also attacks the knight on d5, which is pinned by the bishop on c4.}
          7...Ke6 {The king must keep defending d5; retreating loses the knight.}
          8.Nc3 {Adds a third attacker on d5.}
          8...Ne7 {Defends d5 again, but it is passive. The tougher defence is 8...Ncb4, hitting c2.}
          9.d4 {Opens the c1 bishop and strikes at e5 to break open the centre.}
          9...c6 {Supports the d5 knight once more.}
          10.dxe5 {White is a piece down for two pawns, but the e5 pawn takes d6 and f6 from the king, and every white piece is joining the attack.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'sacrifice',
        name: 'When Black plays 5...Na5',
        summary: 'Black gives a pawn for quick development; White keeps the pawn and regroups.',
        moves: `5...Na5 {The best answer: it attacks the bishop and refuses to put a knight on d5.}
          6.Bb5+ {The bishop moves with check so Black has no time to recapture on d5.}
          6...c6 {Blocks the check and attacks the d5 pawn.}
          7.dxc6 {White takes the pawn rather than retreat and let Black win d5 back.}
          7...bxc6 {Recaptures toward the centre and attacks the bishop again.}
          8.Be2 {A safe retreat. White is a pawn up; Black has faster development.}
          8...h6 {Kicks the knight from g5.}
          9.Nf3 {Back to defence. The knight eyes the e5 pawn.}
          9...e4 {Gains space and chases the knight again.}
          10.Ne5 {The knight finds a central post. Both sides have chances: White's extra pawn against Black's activity.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'petrov-copycat',
    name: 'Petrov Copycat Trap',
    order: 4,
    side: 'white',
    opening: "Petrov's Defence",
    sound: true,
    tagline: 'Copying White in the Petrov can cost Black the queen.',
    bait: '4.Qe2',
    avoid: 'In the Petrov, answer 3.Nxe5 with 3...d6 first, then take on e4. If you already played 3...Nxe4 and White plays 4.Qe2, reply 4...Qe7 to block the e-file.',
    lines: [
      {
        id: 'discovered',
        role: 'trap',
        name: 'Discovered check',
        summary: 'The knight retreats and a discovered check wins the black queen.',
        moves: `1.e4 {Opens lines for the queen and bishop.}
          1...e5 {Black mirrors.}
          2.Nf3 {Develops and attacks e5.}
          2...Nf6 {Petrov's Defence: Black counterattacks e4 instead of defending e5.}
          3.Nxe5 {White takes the pawn first.}
          3...Nxe4?! {Copying White. It looks symmetrical, but White moves first and can use the open e-file.}
          4.Qe2 {The bait. The queen attacks the knight on e4, and the white knight on e5 is ready to step off the e-file.}
          4...Nf6?? {Saving the knight empties the e-file between the queen and the black king, except for the white knight on e5.}
          5.Nc6+ {Discovered check from the queen, and the knight attacks the queen on d8.}
          5...Be7 {Black blocks the check, but the queen is lost.}
          6.Nxd8 {White wins the queen.}
          6...Kxd8 {Black only gets a knight for it.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'discovered',
        name: 'When Black blocks with ...Qe7',
        summary: 'Black loses the knight on e4 for the one on e5, and White ends a pawn up.',
        moves: `4...Qe7 {The right move: with the queen on the e-file, a knight move from e5 is no longer check. Black gives up the e4 knight but will win the e5 knight back.}
          5.Qxe4 {White takes the knight; the knight on e5 is now pinned to the queen.}
          5...d6 {Attacks the pinned knight, which cannot move without losing the queen.}
          6.d4 {Defends the knight.}
          6...dxe5 {Black wins the piece back.}
          7.dxe5 {White recaptures and is a clean pawn up.}
          7...Nc6 {Develops and attacks the e5 pawn, which the queen still defends.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'damiano-defence',
    name: 'Damiano Defence Punishment',
    order: 7,
    side: 'white',
    opening: 'Damiano Defence',
    sound: true,
    tagline: 'Punish 2...f6 with a knight sacrifice on e5.',
    bait: '3.Nxe5',
    avoid: 'Do not defend e5 with 2...f6: it weakens the e8-h5 diagonal. Play 2...Nc6 or 2...d6. If you already played ...f6 and White takes on e5, play 3...Qe7 rather than taking the knight.',
    lines: [
      {
        id: 'king-hunt',
        role: 'trap',
        name: 'King hunt',
        summary: 'Black takes the knight and the king is chased up the board.',
        moves: `1.e4 {Opens the queen and bishop.}
          1...e5 {Black claims the centre.}
          2.Nf3 {Attacks e5.}
          2...f6?! {Defends e5 but opens the diagonal from h5 to the black king.}
          3.Nxe5 {The bait: a knight for a pawn, aiming at the weakened king.}
          3...fxe5? {Taking the knight lets the queen in with check.}
          4.Qh5+ {Check on the diagonal ...f6 opened.}
          4...Ke7 {4...g6 loses the rook on h8 after 5.Qxe5+.}
          5.Qxe5+ {The queen takes back a pawn with check.}
          5...Kf7 {The king runs back toward safety.}
          6.Bc4+ {Another check, aimed at the king on f7.}
          6...d5 {Blocks, but White can take with check.}
          7.Bxd5+ {The bishop captures with check.}
          7...Kg6 {The king heads for the kingside, far from its defenders.}
          8.h4 {The h-pawn joins the attack. The king on g6 has no shelter and White's pieces surround it.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'king-hunt',
        name: 'When Black plays 3...Qe7',
        summary: 'Black wins the pawn back, but White keeps a lead in development.',
        moves: `3...Qe7 {Attacks the knight, with the e4 pawn behind it as the next target.}
          4.Nf3 {The knight retreats; White is a pawn up for the moment.}
          4...Qxe4+ {Black wins the pawn back with check.}
          5.Be2 {Blocks and develops. Black's queen is exposed and Black has weakened the king with ...f6.}
          5...d5 {Takes the centre.}
          6.O-O {White castles and will hit the queen with Re1. White is clearly better.}`,
      },
    ],
  },
  {
    kind: 'trap',
    id: 'tarrasch-trap',
    name: 'Tarrasch Trap',
    order: 23,
    side: 'white',
    opening: 'Ruy Lopez, Steinitz Defence',
    sound: true,
    tagline: 'Castling too early in the Steinitz costs Black the exchange.',
    bait: '7.Re1',
    avoid: 'In the Steinitz Defence, release the tension with 7...exd4 before castling. Castling while the e5 pawn is under pressure lets White win it with Bxc6 and dxe5.',
    lines: [
      {
        id: 'exchange',
        role: 'trap',
        name: 'Winning the exchange',
        summary: 'A long but forced sequence that ends with White winning a rook for a knight.',
        moves: `1.e4 {Takes the centre.}
          1...e5 {Black answers in kind.}
          2.Nf3 {Develops and attacks e5.}
          2...Nc6 {Defends e5.}
          3.Bb5 {The Ruy Lopez: pressure on the knight that guards e5.}
          3...d6 {The Steinitz Defence: e5 gets a second, solid defender.}
          4.d4 {Strikes at e5 immediately.}
          4...Bd7 {Breaks the pin so the knight is free.}
          5.Nc3 {Develops and adds support to e4.}
          5...Nf6 {Develops with pressure on e4.}
          6.O-O {Castles; e4 is safe because ...Nxe4 runs into Nxe4.}
          6...Be7 {Prepares to castle.}
          7.Re1 {The bait. Black still has to decide about the tension on e5.}
          7...O-O? {Natural, but now e5 cannot be held.}
          8.Bxc6 {Removes a defender of e5.}
          8...Bxc6 {Recaptures.}
          9.dxe5 {Wins the e5 pawn.}
          9...dxe5 {Black recaptures and offers a queen trade.}
          10.Qxd8 {Trading queens keeps the pressure on e5.}
          10...Raxd8 {Recaptures.}
          11.Nxe5 {White wins a pawn.}
          11...Bxe4 {Black seems to win it back.}
          12.Nxe4 {White takes the bishop.}
          12...Nxe4 {Black recaptures, and the knight looks safe.}
          13.Nd3 {The knight retreats and, with the rook on e1, pins the black knight on e4 to the bishop on e7.}
          13...f5 {Defends the knight.}
          14.f3 {Attacks the pinned knight a second time.}
          14...Bc5+ {Black gains time with check.}
          15.Nxc5 {White gives back the knight.}
          15...Nxc5 {Black recaptures; material is level for a moment.}
          16.Bg5 {Hits the rook on d8.}
          16...Rd5 {The rook escapes but stays on the d-file.}
          17.Be7 {Forks the rook on f8 and the knight on c5. White wins the exchange.}`,
      },
      {
        id: 'declined',
        role: 'decline',
        from: 'exchange',
        name: 'When Black takes on d4',
        summary: 'Black gives up the centre but keeps a solid position.',
        moves: `7...exd4 {The right move: release the tension before castling.}
          8.Nxd4 {White recaptures with a fine central knight.}
          8...O-O {Now castling is safe; White has more space and Black is solid.}`,
      },
    ],
  },
];

export default traps;
