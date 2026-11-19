import type { LessonSource } from '../types';
import alapinSicilian from './openings/alapin-sicilian';
import caroKann from './openings/caro-kann';
import caroKannAdvance from './openings/caro-kann-advance';
import frenchAdvance from './openings/french-advance';
import frenchDefence from './openings/french-defence';
import italianGame from './openings/italian-game';
import kingsIndian from './openings/kings-indian';
import londonSystem from './openings/london-system';
import queensGambit from './openings/queens-gambit';
import queensGambitDeclined from './openings/queens-gambit-declined';
import ruyLopez from './openings/ruy-lopez';
import scotchGame from './openings/scotch-game';
import sicilianNajdorf from './openings/sicilian-najdorf';
import slavDefence from './openings/slav-defence';
import twoKnights from './openings/two-knights';
import kingPawnBlack from './traps/king-pawn-black';
import kingPawnWhite from './traps/king-pawn-white';
import queenPawn from './traps/queen-pawn';
import semiOpen from './traps/semi-open';

/** Every lesson in the app. `scripts/validate-lessons.mjs` checks each file in this folder. */
export const SOURCES: LessonSource[] = [
  italianGame,
  queensGambit,
  londonSystem,
  ruyLopez,
  scotchGame,
  alapinSicilian,
  frenchAdvance,
  caroKannAdvance,
  twoKnights,
  sicilianNajdorf,
  frenchDefence,
  caroKann,
  queensGambitDeclined,
  slavDefence,
  kingsIndian,
  ...kingPawnWhite,
  ...kingPawnBlack,
  ...queenPawn,
  ...semiOpen,
];
