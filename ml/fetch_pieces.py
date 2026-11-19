"""Downloads the piece-set SVGs listed in sets.py from lila's GitHub repo into data/pieces/<set>/."""
import pathlib
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from sets import PIECE_SETS, PIECES

ROOT = pathlib.Path(__file__).parent / "data" / "pieces"
BASE = "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece"


def fetch(job):
    name, p = job
    f = ROOT / name / f"{p}.svg"
    if f.exists() and f.stat().st_size > 0:
        return None
    url = f"{BASE}/{name}/{p}.svg"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                f.write_bytes(r.read())
            return None
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(1 + attempt)
    return f"FAILED {url} {err}"


def main():
    for name in PIECE_SETS:
        (ROOT / name).mkdir(parents=True, exist_ok=True)
    jobs = [(n, p) for n in PIECE_SETS for p in PIECES]
    with ThreadPoolExecutor(16) as ex:
        for r in ex.map(fetch, jobs):
            if r:
                print(r)
    for name in PIECE_SETS:
        print(name, len(list((ROOT / name).glob("*.svg"))))


if __name__ == "__main__":
    main()
