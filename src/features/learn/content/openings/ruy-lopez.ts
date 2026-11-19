import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'ruy-lopez',
  name: 'Ruy Lopez',
  side: 'white',
  order: 4,
  eco: 'C60–C99',
  thumb: 5,
  tagline: 'Pressure the defender of e5, then build the big centre.',
  match: ['e4 e5 Nf3 Nc6 Bb5'],
  overview: {
    ideas:
      'White attacks the knight that defends e5. There is no immediate threat, but the pressure lasts: White castles, plays c3 and d4, and the bishop usually settles on b3 or c2 aimed at the black king.',
    plans: [
      'Castle, play Re1, c3 and h3, then d4.',
      'Keep the bishop: after ...a6 and ...b5 retreat it to b3, and later c2.',
      'Reroute the b1 knight via d2 and f1 to g3.',
    ],
    structure: 'White pawns on c3, d4 and e4 against e5 and d6: the classic closed Spanish centre.',
    suits: 'Positional players who want a lifelong opening with deep, logical plans.',
  },
  lines: [
    {
      id: 'closed',
      name: 'Closed Ruy Lopez',
      summary: 'The main line: Black defends with ...a6, ...b5 and ...d6; White builds the centre.',
      moves: `1.e4 {Takes the centre and opens lines for the queen and bishop.}
        1...e5
        2.Nf3 {Develops and attacks e5.}
        2...Nc6
        3.Bb5 {The Ruy Lopez: the bishop attacks the knight that defends e5.}
        3...a6 {The Morphy Defence: Black asks the bishop to decide.}
        4.Ba4 {Keeps the bishop and the pressure on c6.}
        4...Nf6
        5.O-O {Castles. If ...Nxe4, White has Re1 and d4 to win the pawn back.}
        5...Be7
        6.Re1 {Defends e4, so Bxc6 followed by Nxe5 is now a real threat.}
        6...b5 {Black stops that by driving the bishop away.}
        7.Bb3 {The bishop retreats to an ideal diagonal, aiming at f7.}
        7...d6
        8.c3 {Prepares d4 and gives the bishop a retreat square on c2.}
        8...O-O
        9.h3 {Stops ...Bg4, which would pin the knight and weaken White's grip on d4.}
        9...Na5 {Black chases the bishop.}
        10.Bc2 {Avoids the trade; the bishop stays aimed at the kingside.}
        10...c5
        11.d4 {Now White takes the full centre. This is the main tabiya of the Closed Ruy Lopez.}`,
    },
    {
      id: 'open',
      from: 'closed',
      name: 'Open Ruy Lopez',
      summary: 'Black grabs e4; White opens the centre while Black is uncastled.',
      moves: `5...Nxe4 {The Open Ruy Lopez: Black takes the pawn.}
        6.d4 {Opens the centre while Black's king is still in the middle.}
        6...b5 {Breaks the pin first.}
        7.Bb3 {The bishop retreats and eyes d5 and f7.}
        7...d5 {Supports the knight on e4.}
        8.dxe5 {Wins a pawn back and gains space.}
        8...Be6 {Defends d5.}
        9.c3 {Gives the bishop a retreat on c2 and controls d4.}
        9...Be7
        10.Nbd2 {Challenges the strong knight on e4. White keeps a small, lasting edge.}`,
    },
    {
      id: 'berlin',
      from: 'closed',
      name: 'Berlin with 4.d3',
      summary: 'Avoid the drawish Berlin endgame and play a slow Spanish.',
      moves: `3...Nf6 {The Berlin Defence: Black counterattacks e4.}
        4.d3 {Defends e4 and avoids the drawish Berlin endgame.}
        4...Bc5
        5.c3 {Prepares d4 and gives the bishop a route back to c2.}
        5...O-O
        6.O-O {Castles.}
        6...d6
        7.h3 {Takes g4 away from Black's bishop.}
        7...a6
        8.Ba4 {Keeps the bishop; it can later retreat to c2.}
        8...Ba7
        9.Re1 {Supports e4 and prepares Nbd2 and Nf1.}
        9...Ne7
        10.Nbd2 {Starts the knight's journey toward g3.}
        10...Ng6
        11.Nf1 {The knight continues to g3. A slow, rich position with chances for both sides.}`,
    },
    {
      id: 'steinitz',
      from: 'closed',
      name: 'Steinitz Defence',
      summary: 'Black defends e5 with ...d6; White keeps the tension and gets more space.',
      moves: `3...d6 {The Steinitz Defence: solid, but passive.}
        4.d4 {Strike in the centre while Black is cramped.}
        4...Bd7 {Breaks the pin.}
        5.Nc3 {Develops and supports e4.}
        5...Nf6
        6.O-O {Castles. White does not hurry to take on e5.}
        6...Be7
        7.Re1 {Keeps the tension. Castling now for Black would fall into the Tarrasch Trap.}
        7...exd4 {Black releases the tension correctly.}
        8.Nxd4 {Recaptures with a central knight.}
        8...O-O
        9.Bf1 {Keeps the bishop away from trades and closer to the king.}
        9...Re8 {White has more space and an easy game.}`,
    },
  ],
};

export default opening;
