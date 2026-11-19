"""Cuts ChessReD2K photos (prep_chessred.py) into tall square tiles for the photo classifier.

Training images get several augmented variants each: scale, corner error like a finger tap
(up to ~0.12 square per corner), mirror, colour, blur and JPEG. Val / test use the annotated corners
as they are (plus a "tapped" variant with small corner error for an honest app-like number).
"""
import argparse
import io
import json
import pathlib
import random
from multiprocessing import Pool

import cv2
import numpy as np

from photo_tiles import order_quad, photo_tiles

D = pathlib.Path(__file__).parent / "data" / "chessred_1600"


def jitter_quad(quad: np.ndarray, rng: random.Random, amount: float) -> np.ndarray:
    side = np.mean([np.linalg.norm(quad[i] - quad[(i + 1) % 4]) for i in range(4)]) / 8
    return quad + np.array([[rng.uniform(-amount, amount) * side, rng.uniform(-amount, amount) * side] for _ in range(4)], np.float32)


def variant(row: dict, seed: int, augment: bool, tap: float):
    rng = random.Random(seed)
    img = cv2.imread(str(D / f"{row['id']}.jpg"))[:, :, ::-1]  # RGB, as the app reads it
    quad = np.float32(row["quad"])
    labels = np.array(row["labels"], np.int64).reshape(8, 8)
    if augment:
        s = rng.uniform(0.55, 1.0)
        img = cv2.resize(img, (round(img.shape[1] * s), round(img.shape[0] * s)), interpolation=cv2.INTER_AREA)
        quad = quad * s
        if rng.random() < 0.5:  # mirror: the image grid's columns swap
            img = img[:, ::-1]
            quad[:, 0] = img.shape[1] - 1 - quad[:, 0]
            quad = order_quad(quad)
            labels = labels[:, ::-1]
        img = img.astype(np.float32)
        img = img * rng.uniform(0.7, 1.3) + rng.uniform(-30, 30)
        img = img * np.float32([rng.uniform(0.9, 1.1) for _ in range(3)])
        img = np.clip(img, 0, 255).astype(np.uint8)
        if rng.random() < 0.3:
            img = cv2.GaussianBlur(img, (0, 0), rng.uniform(0.5, 1.6))
        if rng.random() < 0.4:
            ok, enc = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, rng.randint(40, 90)])
            img = cv2.imdecode(enc, cv2.IMREAD_UNCHANGED)
    if tap:
        quad = jitter_quad(quad, rng, tap)
    img = np.ascontiguousarray(img)
    tiles = photo_tiles(img, quad)
    y = labels.ravel()
    return tiles, y


def job(a):
    return variant(*a)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--variants", type=int, default=4)
    a = ap.parse_args()
    rows = json.loads((D / "index.json").read_text())
    out = pathlib.Path(__file__).parent / "data"
    plans = {
        "photos_train": [(r, i * 1000 + v, True, 0.12) for i, r in enumerate(rows) if r["split"] == "train" for v in range(a.variants)],
        "photos_val": [(r, i, False, 0.0) for i, r in enumerate(rows) if r["split"] == "val"],
        "photos_test": [(r, i, False, 0.0) for i, r in enumerate(rows) if r["split"] == "test"],
        "photos_test_tapped": [(r, i, False, 0.06) for i, r in enumerate(rows) if r["split"] == "test"],
    }
    with Pool(12) as pool:
        for name, plan in plans.items():
            # Written straight into a memory-mapped .npy (the training set is several GB).
            X = np.lib.format.open_memmap(out / f"{name}_x.npy", mode="w+", dtype=np.uint8, shape=(len(plan) * 64, 64, 48, 3))
            Y = np.zeros(len(plan) * 64, np.int64)
            for i, (x, y) in enumerate(pool.imap(job, plan, chunksize=4)):
                X[i * 64 : (i + 1) * 64] = x
                Y[i * 64 : (i + 1) * 64] = y
            X.flush()
            del X
            np.save(out / f"{name}_y.npy", Y)
            print(name, len(plan), "images", len(Y), "tiles", flush=True)


if __name__ == "__main__":
    main()
