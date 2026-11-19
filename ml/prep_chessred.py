"""Prepares ChessReD2K for photo training: images reduced to 1600 px (as the app does), the board
quad in image order (TL, TR, BR, BL as seen) and the 64 labels in that image grid order.

Splits are ChessReD's own chessred2k train / val / test (by game), so no game is in two splits.
"""
import json
import pathlib
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np

from photo_tiles import BOARD, order_quad
from sets import CLASSES

D = pathlib.Path(__file__).parent / "data" / "chessred"
OUT = pathlib.Path(__file__).parent / "data" / "chessred_1600"
MAX_SIDE = 1600
NAMES = ["top_left", "top_right", "bottom_right", "bottom_left"]  # = a8, h8, h1, a1 (checked by chessred_check.py)
CODE = {"pawn": "P", "rook": "R", "knight": "N", "bishop": "B", "queen": "Q", "king": "K"}


def main():
    ann = json.loads((D / "annotations.json").read_text())
    cat = {}
    for c in ann["categories"]:
        if c["name"] == "empty":
            cat[c["id"]] = 0
        else:
            color, kind = c["name"].split("-")
            cat[c["id"]] = CLASSES.index(("w" if color == "white" else "b") + CODE[kind])
    images = {im["id"]: im for im in ann["images"]}
    corners = {c["image_id"]: c["corners"] for c in ann["annotations"]["corners"]}
    board_of: dict[int, dict[str, int]] = {}
    for p in ann["annotations"]["pieces"]:
        board_of.setdefault(p["image_id"], {})[p["chessboard_position"]] = cat[p["category_id"]]
    split_of = {}
    for split in ("train", "val", "test"):
        for i in ann["splits"]["chessred2k"][split]["image_ids"]:
            split_of[i] = split
    OUT.mkdir(parents=True, exist_ok=True)

    def one(i: int):
        im = images[i]
        img = cv2.imread(str(D / im["path"]))
        if img is None:
            return None
        s = min(1.0, MAX_SIDE / max(img.shape[:2]))
        if s < 1:
            img = cv2.resize(img, (round(img.shape[1] * s), round(img.shape[0] * s)), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(OUT / f"{i}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 93])
        chess = np.float32([corners[i][n] for n in NAMES]) * s
        quad = order_quad(chess.copy())
        to_img = cv2.getPerspectiveTransform(BOARD, quad.astype(np.float32))
        to_chess = cv2.getPerspectiveTransform(chess, BOARD)
        labels = []
        pieces = board_of.get(i, {})
        for r in range(8):
            for c in range(8):
                p = cv2.perspectiveTransform(np.float32([[[c + 0.5, r + 0.5]]]), to_img)
                f, rr = cv2.perspectiveTransform(p, to_chess)[0, 0]
                sq = f"{'abcdefgh'[int(np.clip(np.floor(f), 0, 7))]}{8 - int(np.clip(np.floor(rr), 0, 7))}"
                labels.append(pieces.get(sq, 0))
        return {"id": i, "split": split_of[i], "quad": quad.tolist(), "labels": labels, "w": img.shape[1], "h": img.shape[0]}

    with ThreadPoolExecutor(8) as ex:
        rows = [r for r in ex.map(one, sorted(split_of)) if r]
    (OUT / "index.json").write_text(json.dumps(rows))
    for split in ("train", "val", "test"):
        print(split, sum(r["split"] == split for r in rows))


if __name__ == "__main__":
    main()
