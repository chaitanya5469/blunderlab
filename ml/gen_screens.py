"""Pre-renders synthetic screenshot tiles into uint8 .npy files (memory-mapped during training).

  python gen_screens.py --boards 16000 --out data/screens_train --holdout     # training sets only
  python gen_screens.py --boards 16000 --out data/screens_all                 # every set (final model)

Rendering runs in a process pool without importing torch (keeps memory low on Windows).
"""
import argparse
import pathlib
import random
from multiprocessing import Pool

import numpy as np

from sets import HOLDOUT, PIECE_SETS
from synth import labels_of, load_set, render_board, tiles_from

EMPTY_KEEP = 0.45


def job(args):
    seed, sets = args
    rng = random.Random(seed)
    arr, pos, rect = render_board(load_set(rng.choice(sets)), rng)
    tiles = tiles_from(arr, rect, rng, 0.05 if rng.random() < 0.8 else 0.0)
    y = labels_of(pos)
    keep = [i for i in range(64) if y[i] != 0 or rng.random() < EMPTY_KEEP]
    return tiles[keep], y[keep]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--boards", type=int, default=16000)
    ap.add_argument("--out", required=True)
    ap.add_argument("--holdout", action="store_true", help="exclude the held-out sets")
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    sets = [s for s in PIECE_SETS if not (a.holdout and s in HOLDOUT)]
    xs, ys = [], []
    with Pool(14) as pool:
        for i, (x, y) in enumerate(pool.imap_unordered(job, [(a.seed * 10_000_000 + i, sets) for i in range(a.boards)], chunksize=16)):
            xs.append(x)
            ys.append(y)
            if (i + 1) % 2000 == 0:
                print(i + 1, flush=True)
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    np.save(f"{out}_x.npy", np.concatenate(xs))
    np.save(f"{out}_y.npy", np.concatenate(ys))
    print("tiles", sum(len(y) for y in ys), "sets", sets)


if __name__ == "__main__":
    main()
