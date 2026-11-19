import type { OpeningSource } from '../../types';

const opening: OpeningSource = {
  kind: 'opening',
  id: 'scotch-game',
  name: 'Scotch Game',
  side: 'white',
  order: 5,
  eco: 'C44–C45',
  thumb: 5,
  tagline: 'Open the centre on move three and play with the pieces.',
  match: ['e4 e5 Nf3 Nc6 d4'],
  overview: {
    ideas:
      'White opens the centre at once with d4, trades off the e5 pawn and gets free development. The game becomes open and concrete, and Black cannot hide behind a solid pawn chain.',
    plans: [
      'After 3...exd4 4.Nxd4, develop quickly and use the half-open d-file.',
      'Against ...Nf6, consider Nxc6 and e5 to gain space with tempo.',
      'Against ...Bc5, retreat the knight to b3 with tempo and play for long castling.',
    ],
    structure: "An open centre: White's e4 pawn against Black's d-pawn. Piece activity matters more than structure.",
    suits: 'Players who like open, tactical positions and want to avoid the long theory of the Ruy Lopez.',
  },
  lines: [
    {
      id: 'mieses',
      name: 'Mieses Variation',
      summary: 'Nxc6 and e5 gain space and chase the black knight.',
      moves: `1.e4 {Takes the centre.}
        1...e5
        2.Nf3 {Develops and attacks e5.}
        2...Nc6
        3.d4 {The Scotch: strike the centre right away.}
        3...exd4
        4.Nxd4 {Recaptures; the knight is centralised.}
        4...Nf6 {Attacks e4.}
        5.Nxc6 {Trades, so that e5 comes with tempo.}
        5...bxc6
        6.e5 {Kicks the knight and gains space.}
        6...Qe7 {Pins the e5 pawn to the king.}
        7.Qe2 {Unpins and defends e5.}
        7...Nd5
        8.c4 {Chases the knight out of the centre.}
        8...Nb6
        9.Nd2 {Develops; the knight can support e5 from f3.}
        9...Qe6 {Black attacks the c4 pawn.}
        10.b3 {Defends c4 solidly.}
        10...a5
        11.Bb2 {Develops toward the long diagonal and supports e5. White has more space.}`,
    },
    {
      id: 'classical',
      from: 'mieses',
      name: 'Classical 4...Bc5',
      summary: 'Black hits the knight; White retreats with tempo and plays for long castling.',
      moves: `4...Bc5 {The Classical: the bishop attacks the d4 knight.}
        5.Nb3 {Retreats with tempo on the bishop.}
        5...Bb6
        6.a4 {Threatens a5 to chase the bishop off its diagonal.}
        6...a6 {Gives the bishop a7.}
        7.Nc3 {Develops.}
        7...Nf6
        8.Qe2 {Defends e4 and prepares Bg5 and long castling.}
        8...O-O
        9.Bg5 {Pins the knight.}
        9...h6
        10.Bh4 {Keeps the pin. White will castle long next.}`,
    },
    {
      id: 'early-trade',
      from: 'mieses',
      name: 'Early 3...Nxd4',
      summary: 'The early trade on d4 helps White develop; White ends clearly better.',
      punishes: true,
      moves: `3...Nxd4 {Black trades knights on d4, but this only brings White's queen to the centre.}
        4.Nxd4 {Recaptures.}
        4...exd4
        5.Qxd4 {The queen is centralised and hard to harass.}
        5...Ne7
        6.Bc4 {Develops with an eye on f7.}
        6...Ng6
        7.O-O {Castles.}
        7...d6
        8.Nc3 {Develops.}
        8...c6 {Takes d5 away from White's knight. (8...Be7? drops g7 to Qxg7.)}
        9.Be3 {Develops and connects the rooks.}
        9...Ne5 {Black hits the bishop on c4.}
        10.Bb3 {Keeps the bishop on its strong diagonal. White leads in development.}`,
    },
  ],
};

export default opening;
