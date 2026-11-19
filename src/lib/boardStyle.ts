import { createElement, useMemo, type CSSProperties } from 'react';
import { defaultPieces, type PieceRenderObject } from 'react-chessboard';
import { settingsStore } from './settings';
import { useStore } from './store';

/* ------------------------------------------------------------------ Piece sets */

export interface PieceSetInfo {
  id: string;
  name: string;
  author: string;
  licence: string;
}

/**
 * Piece sets shipped in public/pieces/<id>/ (SVGs from lichess-org/lila, licences per its COPYING.md).
 * Files are plain static assets: a set's SVGs are fetched only when it is shown.
 */
export const PIECE_SETS: PieceSetInfo[] = [
  { id: 'default', name: 'Classic', author: 'react-chessboard (after Colin M.L. Burnett)', licence: 'MIT' },
  { id: 'merida', name: 'Merida', author: 'Armando Hernandez Marroquin', licence: 'GPLv2+' },
  { id: 'california', name: 'California', author: 'Jerry S.', licence: 'CC BY-NC-SA 4.0' },
  { id: 'staunty', name: 'Staunty', author: 'sadsnake1', licence: 'CC BY-NC-SA 4.0' },
  { id: 'maestro', name: 'Maestro', author: 'sadsnake1', licence: 'CC BY-NC-SA 4.0' },
  { id: 'chessnut', name: 'Chessnut', author: 'Alexis Luengas', licence: 'Apache 2.0' },
  { id: 'fantasy', name: 'Fantasy', author: 'Maurizio Monge', licence: 'MIT' },
  { id: 'celtic', name: 'Celtic', author: 'Maurizio Monge', licence: 'MIT' },
  { id: 'rhosgfx', name: 'Rhos', author: 'RhosGFX', licence: 'CC0 1.0' },
  { id: 'firi', name: 'Firi', author: 'James Faure', licence: 'CC BY 4.0' },
  { id: 'papercut', name: 'Papercut', author: 'Nikolay Anzarov', licence: 'CC BY 4.0' },
  { id: 'pixel', name: 'Pixel', author: 'therealqtpi', licence: 'AGPLv3+' },
];

const PIECE_CODES = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

export const pieceUrl = (set: string, code: string) => `${import.meta.env.BASE_URL}pieces/${set}/${code}.svg`;

const cache = new Map<string, PieceRenderObject>();

/** react-chessboard piece renderers for a set (cached per set). */
export function piecesFor(set: string): PieceRenderObject {
  if (set === 'default' || !PIECE_SETS.some((p) => p.id === set)) return defaultPieces;
  let pieces = cache.get(set);
  if (!pieces) {
    pieces = Object.fromEntries(
      PIECE_CODES.map((code) => [
        code,
        (props?: { svgStyle?: CSSProperties }) =>
          createElement('img', {
            src: pieceUrl(set, code),
            alt: '',
            draggable: false,
            decoding: 'async',
            style: { width: '100%', height: '100%', display: 'block', pointerEvents: 'none', userSelect: 'none', ...props?.svgStyle },
          }),
      ]),
    );
    cache.set(set, pieces);
  }
  return pieces;
}

/** The chosen piece set's renderers. */
export function usePieces(): PieceRenderObject {
  const { pieceSet } = useStore(settingsStore);
  return useMemo(() => piecesFor(pieceSet), [pieceSet]);
}

export { BOARD_THEMES, themeById, type BoardThemeInfo } from './boardThemes';
