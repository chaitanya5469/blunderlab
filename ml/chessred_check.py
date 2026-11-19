"""Checks how ChessReD's corner names relate to chess squares (run once; prints match rates)."""
import json
import pathlib

import cv2
import numpy as np

D = pathlib.Path(__file__).parent / "data" / "chessred"
ann = json.loads((D / "annotations.json").read_text())
corners = {c["image_id"]: c["corners"] for c in ann["annotations"]["corners"]}
pieces: dict[int, list] = {}
for p in ann["annotations"]["pieces"]:
    if p["image_id"] in corners and "bbox" in p:
        pieces.setdefault(p["image_id"], []).append(p)

names = ["top_left", "top_right", "bottom_right", "bottom_left"]
ids = list(corners)[:300]
for rot in range(4):
    good = tot = 0
    for i in ids:
        c = corners[i]
        src = np.float32([c[names[(k + rot) % 4]] for k in range(4)])
        # board coords: TL = a8 (0,0), TR = h8 (8,0), BR = h1 (8,8), BL = a1 (0,8)
        H = cv2.getPerspectiveTransform(src, np.float32([[0, 0], [8, 0], [8, 8], [0, 8]]))
        for p in pieces.get(i, []):
            x, y, w, h = p["bbox"]
            pt = cv2.perspectiveTransform(np.float32([[[x + w / 2, y + h * 0.85]]]), H)[0, 0]
            f, r = int(np.floor(pt[0])), int(np.floor(pt[1]))
            sq = p["chessboard_position"]
            tot += 1
            good += (f == ord(sq[0]) - 97 and r == 8 - int(sq[1]))
    print("rotation", rot, f"{good}/{tot}")
