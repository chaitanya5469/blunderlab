import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'two-knights',
  name: 'Two Knights Defence',
  side: 'black',
  order: 1,
  eco: 'C55–C59',
  thumb: 6,
  tagline: 'Meet the Italian bishop with a counterattack on e4.',
  match: ['e4 e5 Nf3 Nc6 Bc4'],
  overview: {
    ideas:
      'Against 3.Bc4 Black develops the king knight at once and hits e4 instead of copying White. Quiet lines lead to a balanced Italian structure; sharp tries like 4.Ng5 and 4.d4 give Black active piece play in return for a pawn or two.',
    plans: [
      'Against 4.d3, develop with ...Bc5, ...d6, ...a6 and ...Ba7, then castle and challenge the c4 bishop with ...Be6.',
      'Against 4.Ng5, play 4...d5 and 5...Na5: give a pawn for fast development instead of recapturing on d5.',
      'Against 4.d4, take on d4 and use the hit on e4 to free your game with ...d5.',
    ],
    structure: 'Usually e5 and d6 against e4, d3 and c3: a closed centre where both sides manoeuvre. Sharp lines open the e-file early.',
    suits: 'Players who want active, principled positions with 1...e5 and do not mind a pawn sacrifice in the sharp lines.',
  },
  lines: [
    {
      id: 'quiet',
      name: 'Quiet Italian: 4.d3',
      summary: 'White plays slowly; Black copies the healthy setup and challenges the bishop.',
      moves: `1.e4 1...e5 {Claims an equal share of the centre and frees the f8 bishop and the queen.}
        2.Nf3 {White attacks e5.}
        2...Nc6 {Defends e5 with a developing move.}
        3.Bc4 {The Italian bishop aims at f7.}
        3...Nf6 {The Two Knights: instead of copying with ...Bc5, Black counterattacks e4 at once.}
        4.d3 {White defends e4 calmly.}
        4...Bc5 {With e4 held, the bishop takes its most active diagonal, eyeing f2.}
        5.c3 {White prepares d4 to kick the bishop.}
        5...d6 {Supports e5 so the centre holds, and opens the c8 bishop.}
        6.O-O 6...a6 {Prepares a retreat on a7, where the bishop stays aimed at f2 and cannot be hit by d4 or b4.}
        7.a4 {White gains queenside space.}
        7...Ba7 {Steps back before b4 or d4 can gain time on it.}
        8.Re1 8...O-O {King safety first; the f8 rook can later support ...f5 or ...Re8.}
        9.h3 9...h6 {Keeps White's bishop and knight off g5, so the f6 knight cannot be pinned.}
        10.Nbd2 {The knight heads for f1 and g3.}
        10...Re8 {The rook backs up e5 and gets ready for an e-file fight.}
        11.Nf1 11...Be6 {Offers a trade of the Italian bishop, the best piece White has. The game is balanced.}`,
    },
    {
      id: 'ng5',
      from: 'quiet',
      name: 'Fighting 4.Ng5',
      summary: 'White attacks f7; Black gives a pawn and gains time on the bishop.',
      gambit: true,
      moves: `4.Ng5 {Knight and bishop both hit f7.}
        4...d5 {The only good defence: block the bishop's diagonal to f7.}
        5.exd5 {White takes, and the d5 pawn now attacks the c6 knight.}
        5...Na5 {Do not recapture: 5...Nxd5 invites the Fried Liver. The knight hits the c4 bishop instead.}
        6.Bb5+ 6...c6 {Blocks the check and attacks the d5 pawn and the bishop at once.}
        7.dxc6 7...bxc6 {Recapture toward the centre with tempo on the bishop. Black is a pawn down but leads in development.}
        8.Be2 8...h6 {Kicks the knight from g5 before it can cause trouble.}
        9.Nf3 9...e4 {Gains space and chases the knight again, so White's pieces keep losing time.}
        10.Ne5 10...Bd6 {Develops and attacks the e5 knight.}
        11.d4 11...exd3 {Takes en passant to open lines while White's king is still in the centre.}
        12.Nxd3 12...Qc7 {Lines up with the d6 bishop against h2 and prepares to castle. Black has fast development and open lines for the pawn.}`,
    },
    {
      id: 'max-lange',
      from: 'quiet',
      name: 'Open centre: 4.d4',
      summary: 'White opens the centre; Black takes e4 and returns material for safe development.',
      moves: `4.d4 {White strikes in the centre.}
        4...exd4 {Takes, opening the e-file and winning time against the f3 knight.}
        5.O-O 5...Nxe4 {Grabs the e4 pawn, the point of the Two Knights.}
        6.Re1 6...d5 {Gives back a pawn to stop the pin on the e-file and blunt the c4 bishop.}
        7.Bxd5 7...Qxd5 {The queen recaptures; it is safe in the centre for a move.}
        8.Nc3 {Attacks the queen and the pinned knight.}
        8...Qa5 {The queen leaves the centre but keeps watching the e5 square and the c3 knight.}
        9.Nxe4 9...Be6 {Develops and blocks the e-file, so the king is no longer exposed.}
        10.Neg5 10...O-O-O {Castles long: the king is safe on the queenside and the rook joins the d-file.}
        11.Nxe6 11...fxe6 {Opens the f-file for Black's rooks.}
        12.Rxe6 12...Bd6 {Develops and gets ready to fight for the open files. Material is level and Black is active.}`,
    },
  ],
};

export default opening;
