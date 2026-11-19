"""Synthetic chessboard screenshots for training the square classifier.

render_board() draws a random position with a piece set onto a random board theme with the clutter
real screenshots have (last-move highlights, check glow, move dots, arrows, coordinates, frames),
then degrades it (rescale, blur, JPEG). tiles_from() cuts the 64 squares the way the app does:
board rectangle (with a little localisation error) -> 256x256 -> 32x32 tiles.
"""
from __future__ import annotations

import colorsys
import io
import pathlib
import random
import re

import cv2
import numpy as np
import resvg_py
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from sets import PIECES

PIECE_DIR = pathlib.Path(__file__).parent / "data" / "pieces"
TILE = 32
BOARD_PX = TILE * 8

THEMES = [
    ("#f0d9b5", "#b58863"),  # brown
    ("#dee3e6", "#8ca2ad"),  # blue
    ("#ffffdd", "#86a666"),  # green
    ("#eeeed2", "#769656"),  # green (common web default)
    ("#ebecd0", "#739552"),
    ("#edeed1", "#779952"),
    ("#e8e9c9", "#a8a36c"),
    ("#dde2e9", "#7d8ea6"),  # BlunderLab
    ("#e3c16f", "#b88b4a"),  # wood-ish
    ("#d9d9d9", "#a0a0a0"),  # grey
    ("#ffffff", "#c8c8c8"),  # print diagram
    ("#ffffff", "#9e9e9e"),
    ("#ececec", "#c1c18e"),
    ("#e0d0e8", "#9a7fb0"),  # purple
    ("#f2f6fa", "#5c7ea6"),
    ("#c0c0c0", "#707070"),
    ("#e8dcb5", "#8b6a4a"),
    ("#d8e6f0", "#4d6d8a"),
]

_FONTS = [f for f in ["arial.ttf", "arialbd.ttf", "segoeui.ttf", "segoeuib.ttf", "calibri.ttf", "verdana.ttf", "times.ttf", "consola.ttf"]]

_cache: dict[str, dict[str, Image.Image]] = {}


def load_set(name: str, px: int = 192) -> dict[str, Image.Image]:
    if name in _cache:
        return _cache[name]
    out = {}
    for p in PIECES:
        path = PIECE_DIR / name / f"{p}.svg"
        try:
            png = resvg_py.svg_to_bytes(svg_path=str(path), width=px, height=px)
        except ValueError:
            # Some sets have no width/height on the root element: give it a viewBox-sized one.
            svg = path.read_text(encoding="utf-8")
            head_end = svg.index(">", svg.index("<svg"))
            head = re.sub(r'\s(width|height)="[^"]*"', "", svg[:head_end])
            svg = head.replace("<svg", f'<svg width="{px}" height="{px}"', 1) + svg[head_end:]
            png = resvg_py.svg_to_bytes(svg_string=svg, width=px, height=px)
        out[p] = Image.open(io.BytesIO(bytes(png))).convert("RGBA").resize((px, px), Image.LANCZOS)
    _cache[name] = out
    return out


def _hex(c: str) -> tuple[int, int, int]:
    return tuple(int(c[i : i + 2], 16) for i in (1, 3, 5))  # type: ignore[return-value]


def random_theme(rng: random.Random) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    if rng.random() < 0.6:
        light, dark = (_hex(c) for c in rng.choice(THEMES))
    else:
        h = rng.random()
        s = rng.uniform(0.05, 0.6)
        lv = rng.uniform(0.75, 0.97)
        dv = rng.uniform(0.35, lv - 0.15)
        light = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(h, s * rng.uniform(0.2, 0.7), lv))
        dark = tuple(int(x * 255) for x in colorsys.hsv_to_rgb((h + rng.uniform(-0.05, 0.05)) % 1, s, dv))
    jitter = lambda c: tuple(max(0, min(255, v + rng.randint(-10, 10))) for v in c)  # noqa: E731
    return jitter(light), jitter(dark)  # type: ignore[return-value]


def random_position(rng: random.Random) -> list[str | None]:
    """64 squares, index = row * 8 + col as drawn (row 0 at the top)."""
    board: list[str | None] = [None] * 64
    n = rng.choice([rng.randint(2, 10), rng.randint(8, 24), rng.randint(16, 32)])
    squares = list(range(64))
    rng.shuffle(squares)
    pool = ["wK", "bK"] if rng.random() < 0.9 else []
    weights = {"P": 8, "N": 2, "B": 2, "R": 2, "Q": 1.2, "K": 0.4}
    kinds = list(weights)
    while len(pool) < n:
        pool.append(rng.choice("wb") + rng.choices(kinds, weights=[weights[k] for k in kinds])[0])
    for sq, p in zip(squares, pool):
        board[sq] = p
    return board


def _texture(rng: random.Random, size: int) -> Image.Image:
    small = np.random.default_rng(rng.randint(0, 1 << 30)).normal(0, 1, (rng.randint(4, 16), rng.randint(40, 120)))
    tex = cv2.resize(small, (size, size), interpolation=cv2.INTER_CUBIC)
    if rng.random() < 0.5:
        tex = tex.T
    tex = (tex - tex.min()) / (np.ptp(tex) + 1e-6)
    return Image.fromarray((tex * 255).astype(np.uint8))


def _font(rng: random.Random, size: int) -> ImageFont.ImageFont:
    for _ in range(4):
        try:
            return ImageFont.truetype(rng.choice(_FONTS), max(6, size))
        except OSError:
            continue
    return ImageFont.load_default()


def _arrow(draw: ImageDraw.ImageDraw, a: tuple[float, float], b: tuple[float, float], width: float, color: tuple[int, int, int, int]):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    length = max(1e-3, (dx * dx + dy * dy) ** 0.5)
    ux, uy = dx / length, dy / length
    head = width * 2.2
    ex, ey = bx - ux * head, by - uy * head
    draw.line([(ax, ay), (ex, ey)], fill=color, width=max(1, int(width)))
    px, py = -uy, ux
    draw.polygon([(bx, by), (ex + px * head * 0.7, ey + py * head * 0.7), (ex - px * head * 0.7, ey - py * head * 0.7)], fill=color)


def render_board(pieces: dict[str, Image.Image], rng: random.Random, sq_px: int | None = None, position: list[str | None] | None = None):
    """Returns (RGB image, labels[64] row-major from the top, board rect (x0, y0, x1, y1) as floats)."""
    S = sq_px or rng.randint(18, 72)
    N = S * 8
    light, dark = random_theme(rng)
    board = Image.new("RGB", (N, N), light)
    d = ImageDraw.Draw(board)
    for r in range(8):
        for c in range(8):
            if (r + c) % 2 == 1:
                d.rectangle([c * S, r * S, c * S + S - 1, r * S + S - 1], fill=dark)
    if rng.random() < 0.2:  # wood / noise texture
        tex = _texture(rng, N).convert("L")
        shade = Image.new("RGB", (N, N), (0, 0, 0) if rng.random() < 0.5 else (255, 255, 255))
        board = Image.composite(shade, board, tex.point(lambda v: int(v * rng.uniform(0.05, 0.22))))

    pos = position if position is not None else random_position(rng)
    overlay = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # last move highlight
    if rng.random() < 0.6:
        col = rng.choice([(255, 255, 0), (205, 210, 106), (155, 199, 0), (100, 150, 255), (233, 196, 94), (255, 170, 60)])
        alpha = rng.randint(70, 160)
        for sq in rng.sample(range(64), 2):
            r, c = divmod(sq, 8)
            od.rectangle([c * S, r * S, c * S + S - 1, r * S + S - 1], fill=(*col, alpha))
    # check glow on a king
    if rng.random() < 0.12:
        kings = [i for i, p in enumerate(pos) if p and p[1] == "K"]
        if kings:
            r, c = divmod(rng.choice(kings), 8)
            for k in range(6, 0, -1):
                rad = S * 0.5 * k / 6
                od.ellipse([c * S + S / 2 - rad, r * S + S / 2 - rad, c * S + S / 2 + rad, r * S + S / 2 + rad], fill=(255, 0, 0, int(40 * (7 - k) / 2)))
    # selected piece with move dots / capture rings
    if rng.random() < 0.15:
        sel = rng.randrange(64)
        r, c = divmod(sel, 8)
        od.rectangle([c * S, r * S, c * S + S - 1, r * S + S - 1], fill=(20, 85, 30, rng.randint(60, 130)))
        dot = (rng.randint(0, 60), rng.randint(0, 60), rng.randint(0, 60), rng.randint(50, 110))
        for sq in rng.sample(range(64), rng.randint(2, 10)):
            r, c = divmod(sq, 8)
            cx, cy = c * S + S / 2, r * S + S / 2
            if pos[sq]:
                rad = S * 0.48
                od.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=dot, width=max(1, int(S * 0.08)))
            else:
                rad = S * rng.uniform(0.12, 0.2)
                od.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=dot)
    board = Image.alpha_composite(board.convert("RGBA"), overlay)

    # pieces
    scale = rng.uniform(0.78, 1.0)
    ps = max(6, int(round(S * scale)))
    resized = {k: v.resize((ps, ps), Image.LANCZOS) for k, v in pieces.items()}
    for sq, p in enumerate(pos):
        if not p:
            continue
        r, c = divmod(sq, 8)
        off = (S - ps) / 2
        jx = rng.uniform(-0.03, 0.03) * S
        jy = rng.uniform(-0.03, 0.03) * S
        board.alpha_composite(resized[p], (int(c * S + off + jx), int(r * S + off + jy)))

    # arrows above the pieces
    if rng.random() < 0.25:
        arrows = Image.new("RGBA", (N, N), (0, 0, 0, 0))
        ad = ImageDraw.Draw(arrows)
        col = rng.choice([(21, 120, 27), (136, 32, 32), (230, 143, 0), (0, 48, 136), (60, 200, 147)])
        for _ in range(rng.randint(1, 3)):
            a, b = rng.sample(range(64), 2)
            ar, ac = divmod(a, 8)
            br, bc = divmod(b, 8)
            _arrow(ad, (ac * S + S / 2, ar * S + S / 2), (bc * S + S / 2, br * S + S / 2), S * rng.uniform(0.12, 0.22), (*col, 255))
        arrows.putalpha(arrows.getchannel("A").point(lambda v: int(v * rng.uniform(0.5, 0.85))))
        board = Image.alpha_composite(board, arrows)

    # coordinates in the square corners
    coord_style = rng.random()
    if coord_style < 0.55:
        bd = ImageDraw.Draw(board)
        font = _font(rng, int(S * rng.uniform(0.16, 0.28)))
        files = "abcdefgh" if rng.random() < 0.5 else "hgfedcba"
        ranks = "87654321" if files[0] == "a" else "12345678"
        for i in range(8):
            colr = dark if i % 2 == 0 else light  # contrast colour of the square
            bd.text((2 + int(S * 0.04), i * S + 1), ranks[i], font=font, fill=(*colr, 255))
            colf = light if i % 2 == 0 else dark
            tw = font.getlength(files[i]) if hasattr(font, "getlength") else S * 0.2
            bd.text((i * S + S - tw - 2, N - int(S * 0.3)), files[i], font=font, fill=(*colf, 255))
    board = board.convert("RGB")

    # frame / page around the board
    margin = int(S * rng.uniform(0.0, 1.5))
    bg = tuple(rng.randint(0, 255) for _ in range(3)) if rng.random() < 0.5 else ((rng.randint(10, 40),) * 3)
    img = Image.new("RGB", (N + 2 * margin + rng.randint(0, S), N + 2 * margin + rng.randint(0, S)), bg)
    ox = margin + rng.randint(0, max(0, img.width - N - 2 * margin))
    oy = margin + rng.randint(0, max(0, img.height - N - 2 * margin))
    if coord_style >= 0.55 and coord_style < 0.75 and margin > S * 0.3:
        dd = ImageDraw.Draw(img)
        font = _font(rng, int(min(margin, S) * 0.6))
        fg = tuple(255 - v for v in bg)
        for i in range(8):
            dd.text((ox + i * S + S * 0.4, oy + N + 2), "abcdefgh"[i], font=font, fill=fg)
            dd.text((ox - margin * 0.8, oy + i * S + S * 0.3), "87654321"[i], font=font, fill=fg)
    if rng.random() < 0.3 and margin > 2:
        ImageDraw.Draw(img).rectangle([ox - 2, oy - 2, ox + N + 1, oy + N + 1], outline=tuple(rng.randint(0, 255) for _ in range(3)), width=rng.randint(1, 3))
    img.paste(board, (ox, oy))
    rect = [float(ox), float(oy), float(ox + N), float(oy + N)]

    # degradations
    if rng.random() < 0.5:
        f = rng.uniform(0.55, 1.5)
        img = img.resize((max(16, int(img.width * f)), max(16, int(img.height * f))), rng.choice([Image.BILINEAR, Image.BICUBIC, Image.LANCZOS, Image.NEAREST]))
        rect = [v * f for v in rect]
    if rng.random() < 0.3:
        img = img.filter(ImageFilter.GaussianBlur(rng.uniform(0.3, 1.1)))
    if rng.random() < 0.6:
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=rng.randint(25, 95))
        img = Image.open(buf).convert("RGB")
    arr = np.asarray(img).astype(np.float32)
    if rng.random() < 0.5:
        arr = arr * rng.uniform(0.75, 1.2) + rng.uniform(-25, 25)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return arr, pos, rect


def tiles_from(arr: np.ndarray, rect: list[float], rng: random.Random | None = None, jitter: float = 0.0) -> np.ndarray:
    """Board rect -> (64, 32, 32, 3) uint8 tiles, row-major from the top. `jitter` = max corner error in squares."""
    x0, y0, x1, y1 = rect
    S = (x1 - x0) / 8
    if rng and jitter:
        x0 += rng.uniform(-jitter, jitter) * S
        x1 += rng.uniform(-jitter, jitter) * S
        y0 += rng.uniform(-jitter, jitter) * S
        y1 += rng.uniform(-jitter, jitter) * S
    src = np.float32([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])
    dst = np.float32([[0, 0], [BOARD_PX, 0], [BOARD_PX, BOARD_PX], [0, BOARD_PX]])
    # Downscale like a canvas drawImage: area-average when shrinking.
    scale = (x1 - x0) / BOARD_PX
    if scale > 1.2:
        big = int(BOARD_PX * min(4, round(scale)))
        dst_big = dst * (big / BOARD_PX)
        warped = cv2.warpPerspective(arr, cv2.getPerspectiveTransform(src, dst_big), (big, big), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        warped = cv2.resize(warped, (BOARD_PX, BOARD_PX), interpolation=cv2.INTER_AREA)
    else:
        warped = cv2.warpPerspective(arr, cv2.getPerspectiveTransform(src, dst), (BOARD_PX, BOARD_PX), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return warped.reshape(8, TILE, 8, TILE, 3).transpose(0, 2, 1, 3, 4).reshape(64, TILE, TILE, 3)


CLASS_INDEX = {p: i + 1 for i, p in enumerate(PIECES)}


def labels_of(pos: list[str | None]) -> np.ndarray:
    return np.array([CLASS_INDEX[p] if p else 0 for p in pos], dtype=np.int64)


if __name__ == "__main__":
    import sys

    rng = random.Random(int(sys.argv[2]) if len(sys.argv) > 2 else 0)
    arr, pos, rect = render_board(load_set(sys.argv[1] if len(sys.argv) > 1 else "cburnett"), rng)
    Image.fromarray(arr).save("sample.png")
    t = tiles_from(arr, rect)
    Image.fromarray(t.reshape(8, 8, 32, 32, 3).transpose(0, 2, 1, 3, 4).reshape(256, 256, 3)).save("sample_tiles.png")
    print(rect)
