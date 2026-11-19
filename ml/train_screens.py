"""Trains the screenshot / diagram square classifier on pre-rendered synthetic tiles (gen_screens.py).

  python gen_screens.py --boards 16000 --out data/screens_train --holdout
  python train_screens.py --data data/screens_train --name screens_holdout   # measures held-out accuracy
  python gen_screens.py --boards 16000 --out data/screens_all
  python train_screens.py --data data/screens_all --name screens_all          # final model, every set

Validation always uses fixed boards from the held-out piece sets (HOLDOUT in sets.py); for the
holdout run the model has never seen those sets.
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
from sets import CLASSES, HOLDOUT, PIECE_SETS
from synth import labels_of, load_set, render_board, tiles_from

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"


def make_val(sets: list[str], boards_per_set: int, seed: int):
    xs, ys, names = [], [], []
    for name in sets:
        rng = random.Random(seed)
        for _ in range(boards_per_set):
            arr, pos, rect = render_board(load_set(name), rng)
            xs.append(tiles_from(arr, rect, rng, 0.03))
            ys.append(labels_of(pos))
            names += [name] * 64
    return np.concatenate(xs), np.concatenate(ys), np.array(names)


@torch.no_grad()
def evaluate(model, x, y, names, device):
    model.eval()
    preds = []
    for i in range(0, len(x), 4096):
        xb = torch.from_numpy(x[i : i + 4096]).permute(0, 3, 1, 2).to(device).float() / 255
        preds.append(model(xb).argmax(1).cpu().numpy())
    p = np.concatenate(preds)
    model.train()
    per_set = {str(n): float((p[names == n] == y[names == n]).mean()) for n in np.unique(names)}
    boards = (p == y).reshape(-1, 64).all(1).mean()
    occupied = y != 0
    return float((p == y).mean()), per_set, float(boards), float((p[occupied] == y[occupied]).mean())


def augment(xb: torch.Tensor) -> torch.Tensor:
    n = xb.shape[0]
    gain = torch.empty(n, 1, 1, 1, device=xb.device).uniform_(0.85, 1.15)
    bias = torch.empty(n, 1, 1, 1, device=xb.device).uniform_(-0.06, 0.06)
    xb = (xb * gain + bias).clamp(0, 1)
    if random.random() < 0.5:
        xb = torch.roll(xb, shifts=(random.randint(-1, 1), random.randint(-1, 1)), dims=(2, 3))
    return xb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--steps", type=int, default=16000)
    ap.add_argument("--batch", type=int, default=512)
    ap.add_argument("--name", default="screens")
    args = ap.parse_args()

    device = "cuda"
    X = np.load(f"{args.data}_x.npy", mmap_mode="r")
    Y = np.load(f"{args.data}_y.npy")
    print("train tiles", len(Y), "class counts", np.bincount(Y, minlength=13).tolist())
    vx, vy, vn = make_val(HOLDOUT, 120, seed=7)
    print(f"held-out val: {len(vy)} squares from {HOLDOUT}")

    model = SquareNet().to(device)
    print("params:", sum(p.numel() for p in model.parameters()))
    opt = torch.optim.AdamW(model.parameters(), lr=3e-3, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3, total_steps=args.steps, pct_start=0.1)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.05)
    rng = np.random.default_rng(0)
    t0 = time.time()
    log = []
    for step in range(1, args.steps + 1):
        idx = np.sort(rng.choice(len(Y), args.batch, replace=False))
        xb = augment(torch.from_numpy(np.ascontiguousarray(X[idx])).to(device).permute(0, 3, 1, 2).float() / 255)
        yb = torch.from_numpy(Y[idx]).to(device)
        loss = loss_fn(model(xb), yb)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        opt.step()
        sched.step()
        if step % 1000 == 0 or step == args.steps:
            acc, per_set, boards, occ = evaluate(model, vx, vy, vn, device)
            print(f"step {step} loss {loss.item():.4f} held-out square acc {acc:.4%} occupied {occ:.4%} whole-board {boards:.2%} {time.time() - t0:.0f}s", {k: f"{v:.4%}" for k, v in per_set.items()}, flush=True)
            log.append({"step": step, "acc": acc, "occupied": occ, "boards": boards, "per_set": per_set})

    OUT.mkdir(exist_ok=True)
    torch.save(model.state_dict(), OUT / f"{args.name}.pt")
    trained_on = [s for s in PIECE_SETS if "holdout" not in args.name or s not in HOLDOUT]
    export(model, OUT / f"{args.name}.bin", OUT / f"{args.name}.json", {"classes": CLASSES, "kind": "screens", "eval": log[-1], "trained_on": trained_on})
    (OUT / f"{args.name}_log.json").write_text(json.dumps(log, indent=1))
    print("exported")


if __name__ == "__main__":
    main()
