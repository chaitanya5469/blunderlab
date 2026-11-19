"""Piece sets used for synthetic training data, with their licences (from lila's COPYING.md).

Only sets whose licence permits making derived images for this personal, non-commercial,
non-distributed app are listed. Sets that are unusable for recognition (all pieces the same shape,
letters, abstract glyphs) or whose terms are unclear ("freeware", no licence, no-derivatives) are excluded.
"""

# name -> (author, licence, non_commercial_only)
PIECE_SETS = {
    "cburnett": ("Colin M.L. Burnett", "GPLv2+", False),
    "merida": ("Armando Hernandez Marroquin", "GPLv2+", False),
    "chessnut": ("Alexis Luengas", "Apache-2.0", False),
    "pirouetti": ("pirouetti", "AGPLv3+", False),
    "pixel": ("therealqtpi", "AGPLv3+", False),
    "rhosgfx": ("RhosGFX", "CC0 1.0", False),
    "fantasy": ("Maurizio Monge", "MIT", False),
    "spatial": ("Maurizio Monge", "MIT", False),
    "celtic": ("Maurizio Monge", "MIT", False),
    "mpchess": ("Maxime Chupin", "GPLv3+", False),
    "firi": ("James Faure", "CC BY 4.0", False),
    "totoy": ("Kosal Sen", "CC BY 4.0", False),
    "papercut": ("Nikolay Anzarov", "CC BY 4.0", False),
    "california": ("Jerry S.", "CC BY-NC-SA 4.0", True),
    "caliente": ("avi", "CC BY-NC-SA 4.0", True),
    "maestro": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "fresca": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "cardinal": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "icpieces": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "gioco": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "tatiana": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "staunty": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "dubrovny": ("sadsnake1", "CC BY-NC-SA 4.0", True),
    "anarcandy": ("caderek", "CC BY-NC-SA 4.0", True),
    "cooke": ("fejfar", "CC BY-NC-SA 4.0", True),
    "minimal-warmth": ("blunder_reign", "CC BY-NC-SA 4.0", True),
    "chessboart": ("Michal Fudalej / ChessboArt", "CC BY-NC-SA 4.0", True),
    "xkcd": ("Randall Munroe", "CC BY-NC-SA 2.5", True),
}

# Never seen in training; used to measure generalisation to unseen piece styles.
HOLDOUT = ["merida", "chessnut", "california", "fantasy", "staunty"]

PIECES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]
# Class 0 = empty square, then the 12 pieces in this order (the app uses the same order).
CLASSES = ["empty"] + PIECES
