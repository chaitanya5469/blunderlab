import { motion } from 'motion/react';
import { Board } from '../../components/chess/Board';
import { ClassMarker } from '../../components/chess/ClassMarker';

/** 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? — the classic blunder, with the punishing move drawn. */
const FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';

export function HeroBoard() {
  return (
    <motion.div
      className="relative mx-auto mt-14 w-[min(76%,300px)] rotate-[-4deg]"
      initial={{ opacity: 0, scale: 0.96, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: -4 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Board id="hero" fen={FEN} orientation="white" lastMove={{ from: 'g8', to: 'f6' }} arrowUci="h5f7" />
      <div className="absolute right-1 bottom-full mb-3 flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pr-3 pl-1 text-xs font-semibold shadow-lg">
        <ClassMarker cls="blunder" className="size-5" />
        Nf6
      </div>
    </motion.div>
  );
}
