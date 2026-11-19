"""Trains the real-board photo square classifier on ChessReD2K tiles (gen_photos.py).

  python train_photos.py --name photos

Model selection uses the val split; the test split (ChessReD's own, different games) is only
evaluated once at the end: with the annotated corners, and with corners moved a little as a user's
taps would be.
"""
import argparse
import json
import pathlib
import random
import time

import numpy as np
import torch
from torch import nn

from export import export
from model import SquareNet
from sets import CLASSES

DATA = pathlib.Path(__file__).parent / "data"
OUT = pathlib.Path(__file__).parent / "out"


def load(name):
    return np.load(DATA / f"{name}_x.npy", mmap_mode="r"), np.load(DATA / f"{name}_y.npy")


@torch.no_grad()
def predict(model, x, device):
    model.eval()
    probs = []
    for i in range(0, len(x), 2048):
        xb = torch.from_numpy(np.ascontiguousarray(x[i : i + 2048])).to(device).permute(0, 3, 1, 2).float() / 255
        probs.append(torch.softmax(model(xb), 1).cpu().numpy())
    model.train()
    return np.concatenate(probs)


def metrics(p: np.ndarray, y: np.ndarray) -> dict:
    pred = p.argmax(1)
    ok = pred == y
    per_board = (~ok).reshape(-1, 64).sum(1)
    occ = y != 0
    conf = p.max(1)
    unsure = conf < 0.85
    return {
        "square_acc": float(ok.mean()),
        "occupied_acc": float(ok[occ].mean()),
        "empty_acc": float(ok[~occ].mean()),
        "boards_perfect": float((per_board == 0).mean()),
        "boards_le1_error": float((per_board <= 1).mean()),
        "mean_errors_per_board": float(per_board.mean()),
        # How useful the "check this square" markers are: share of errors that get flagged, and how many squares get flagged.
        "errors_flagged": float(unsure[~ok].mean()) if (~ok).any() else 1.0,
        "flagged_per_board": float(unsure.reshape(-1, 64).sum(1).mean()),
    }


def augment(xb: torch.Tensor) -> torch.Tensor:
    n = xb.shape[0]
    gain = torch.empty(n, 1, 1, 1, device=xb.device).uniform_(0.85, 1.15)
    bias = torch.empty(n, 1, 1, 1, device=xb.device).uniform_(-0.05, 0.05)
    xb = (xb * gain + bias).clamp(0, 1)
    if random.random() < 0.7:
        xb = torch.roll(xb, shifts=(random.randint(-3, 3), random.randint(-2, 2)), dims=(2, 3))
    return xb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", type=int, default=20000)
    ap.add_argument("--batch", type=int, default=256)
    ap.add_argument("--name", default="photos")
    ap.add_argument("--widths", default="16,32,64")
    ap.add_argument("--hidden", type=int, default=128)
    args = ap.parse_args()
    device = "cuda"
    X, Y = load("photos_train")
    VX, VY = load("photos_val")
    print("train tiles", len(Y), np.bincount(Y, minlength=13).tolist(), "val", len(VY))
    weights = np.where(Y == 0, 0.5, 1.0)
    weights /= weights.sum()

    widths = tuple(int(w) for w in args.widths.split(","))
    model = SquareNet(in_hw=(64, 48), widths=widths, hidden=args.hidden, stem_stride=2).to(device)
    print("params", sum(p.numel() for p in model.parameters()))
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=5e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=args.steps, pct_start=0.1)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.05)
    rng = np.random.default_rng(0)
    best, best_state = -1.0, None
    t0 = time.time()
    for step in range(1, args.steps + 1):
        idx = np.sort(rng.choice(len(Y), args.batch, replace=True, p=weights))
        xb = augment(torch.from_numpy(np.ascontiguousarray(X[idx])).to(device).permute(0, 3, 1, 2).float() / 255)
        yb = torch.from_numpy(Y[idx]).to(device)
        loss = loss_fn(model(xb), yb)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        opt.step()
        sched.step()
        if step % 1000 == 0 or step == args.steps:
            m = metrics(predict(model, VX, device), VY)
            print(f"step {step} loss {loss.item():.4f} val {json.dumps({k: round(v, 4) for k, v in m.items()})} {time.time() - t0:.0f}s", flush=True)
            if m["square_acc"] > best:
                best = m["square_acc"]
                best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}

    model.load_state_dict(best_state)
    results = {"val": metrics(predict(model, VX, device), VY)}
    for split in ("photos_test", "photos_test_tapped"):
        TX, TY = load(split)
        results[split] = metrics(predict(model, TX, device), TY)
        print(split, json.dumps({k: round(v, 4) for k, v in results[split].items()}))
    OUT.mkdir(exist_ok=True)
    torch.save(model.state_dict(), OUT / f"{args.name}.pt")
    export(model, OUT / f"{args.name}.bin", OUT / f"{args.name}.json", {"classes": CLASSES, "kind": "photos", "eval": results})
    (OUT / f"{args.name}_eval.json").write_text(json.dumps(results, indent=1))


if __name__ == "__main__":
    main()
