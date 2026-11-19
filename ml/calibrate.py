"""Picks each model's "check this square" threshold on validation data and installs the model in the app.

  python calibrate.py screens out/screens_all     # val = held-out piece-set boards
  python calibrate.py photos out/photos           # val = ChessReD2K val split

The threshold is the lowest confidence that still flags at least 90% of the validation errors,
so the outlined squares catch most mistakes without outlining the whole board.
"""
import json
import pathlib
import shutil
import sys

import numpy as np
import torch

from model import SquareNet
from sets import HOLDOUT

ROOT = pathlib.Path(__file__).parent
APP_MODELS = ROOT.parent / "public" / "models"


def main():
    kind, base = sys.argv[1], ROOT / sys.argv[2]
    if kind == "screens":
        from train_screens import make_val

        x, y, _ = make_val(HOLDOUT, 120, seed=11)
        model = SquareNet()
        target = "squares-screen"
    else:
        x = np.load(ROOT / "data" / "photos_val_x.npy", mmap_mode="r")
        y = np.load(ROOT / "data" / "photos_val_y.npy")
        model = SquareNet(in_hw=(64, 48), stem_stride=2)
        target = "squares-photo"
    model.load_state_dict(torch.load(f"{base}.pt"))
    model.eval().cuda()
    probs = []
    with torch.no_grad():
        for i in range(0, len(x), 2048):
            xb = torch.from_numpy(np.ascontiguousarray(x[i : i + 2048])).cuda().permute(0, 3, 1, 2).float() / 255
            probs.append(torch.softmax(model(xb), 1).cpu().numpy())
    p = np.concatenate(probs)
    conf = p.max(1)
    wrong = p.argmax(1) != y
    chosen = 0.99
    for t in np.arange(0.30, 0.995, 0.01):
        if wrong.sum() == 0 or (conf[wrong] < t).mean() >= 0.9:
            chosen = float(round(t, 2))
            break
    flagged = (conf < chosen).reshape(-1, 64).sum(1).mean()
    print(f"{kind}: errors {wrong.sum()} of {len(y)}; unsure_below {chosen}: flags {(conf[wrong] < chosen).mean():.1%} of errors, {flagged:.2f} squares per board")
    manifest = json.loads(pathlib.Path(f"{base}.json").read_text())
    manifest["unsure_below"] = chosen
    manifest["calibration"] = {"errors_flagged": float((conf[wrong] < chosen).mean()) if wrong.any() else 1.0, "flagged_per_board": float(flagged)}
    pathlib.Path(f"{base}.json").write_text(json.dumps(manifest, indent=1))
    APP_MODELS.mkdir(parents=True, exist_ok=True)
    # The app only needs the layer list, classes and threshold; keep the shipped manifest small.
    slim = {k: manifest[k] for k in ("input", "layers", "classes", "unsure_below")}
    (APP_MODELS / f"{target}.json").write_text(json.dumps(slim, separators=(",", ":")))
    shutil.copyfile(f"{base}.bin", APP_MODELS / f"{target}.bin")
    print("installed", APP_MODELS / target)


if __name__ == "__main__":
    main()
