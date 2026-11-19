"""Tile sampling shared by photo training: the same maths as src/features/analyse/scan/tiles.ts."""
import cv2
import numpy as np

PX = 32
PHOTO_W, PHOTO_H = 48, 64
BOARD = np.float32([[0, 0], [8, 0], [8, 8], [0, 8]])


def order_quad(pts: np.ndarray) -> np.ndarray:
    """TL, TR, BR, BL as seen in the image (same rule as geometry.ts orderQuad)."""
    c = pts.mean(0)
    ang = np.arctan2(pts[:, 1] - c[1], pts[:, 0] - c[0])
    s = pts[np.argsort(ang)]
    start = int(np.argmin(s[:, 0] + s[:, 1]))
    return np.roll(s, -start, axis=0)


def factor(quad: np.ndarray) -> int:
    side = np.mean([np.linalg.norm(quad[i] - quad[(i + 1) % 4]) for i in range(4)])
    scale = side / (8 * PX)
    return min(4, int(round(scale))) if scale > 1.2 else 1


def photo_tiles(img: np.ndarray, quad: np.ndarray) -> np.ndarray:
    """(64, PHOTO_H, PHOTO_W, 3) uint8: each square plus 1/4 square either side and one square above."""
    H = cv2.getPerspectiveTransform(BOARD, quad.astype(np.float32)).astype(np.float64)
    k = factor(quad)
    sub = np.arange(k) / k
    xs_local = (np.arange(PHOTO_W)[:, None] + sub[None, :]).ravel() / PX  # (W*k,)
    ys_local = (np.arange(PHOTO_H)[:, None] + sub[None, :]).ravel() / PX
    out = np.empty((64, PHOTO_H, PHOTO_W, 3), np.uint8)
    for r in range(8):
        for c in range(8):
            bx, by = np.meshgrid(c - 0.25 + xs_local, r - 1 + ys_local)
            d = H[2, 0] * bx + H[2, 1] * by + H[2, 2]
            mx = ((H[0, 0] * bx + H[0, 1] * by + H[0, 2]) / d).astype(np.float32)
            my = ((H[1, 0] * bx + H[1, 1] * by + H[1, 2]) / d).astype(np.float32)
            s = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
            out[r * 8 + c] = np.clip(s.reshape(PHOTO_H, k, PHOTO_W, k, 3).mean((1, 3)) + 0.5, 0, 255).astype(np.uint8)
    return out
