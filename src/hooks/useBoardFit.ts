import { useLayoutEffect, useState } from 'react';

interface BoardFitOptions {
  /** Height (px) to leave for the content below the board block (e.g. a scroll panel). */
  minRest?: number;
  /** Width (px) beside the board inside the block (e.g. an eval bar plus gap). */
  side?: number;
  /** Smallest board edge (px). */
  min?: number;
}

/**
 * Sizes a square board to fit a fixed-height area: `min(width, available height)`.
 * `area` is the flexible region (`flex-1 min-h-0`), `block` the board plus whatever is stacked
 * with it (player strips, tray rows), `board` the board's own box. The board edge is the area's
 * width, or its height minus the block's other content and `minRest`, whichever is smaller.
 * The refs are callback refs, so they work on elements that mount later (after loading).
 */
export function useBoardFit({ minRest = 0, side = 0, min = 160 }: BoardFitOptions = {}) {
  const [area, setArea] = useState<HTMLDivElement | null>(null);
  const [block, setBlock] = useState<HTMLDivElement | null>(null);
  const [board, setBoard] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!area || !block || !board) return;
    const measure = () => {
      const other = block.offsetHeight - board.offsetHeight;
      const s = Math.floor(Math.min(area.clientWidth - side, area.clientHeight - other - minRest));
      setSize(Math.max(min, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(area);
    ro.observe(block);
    return () => ro.disconnect();
  }, [area, block, board, minRest, side, min]);

  return { area: setArea, block: setBlock, board: setBoard, size };
}
