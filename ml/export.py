"""Exports a SquareNet to the app's format: a JSON layer list + one little-endian float16 blob.

Batch norm is folded into the preceding conv. Layout matches PyTorch (CHW activations, conv weights
[out, in, kh, kw], linear weights [out, in]); flatten is CHW order.
"""
import json
import pathlib

import numpy as np
import torch
from torch import nn

from model import SquareNet


def export(model: SquareNet, out_bin: pathlib.Path, out_json: pathlib.Path, meta: dict):
    model = model.eval().cpu()
    layers = []
    blobs: list[np.ndarray] = []
    offset = 0

    def add(arr: np.ndarray) -> int:
        nonlocal offset
        a = arr.astype(np.float16).ravel()
        blobs.append(a)
        start = offset
        offset += a.size
        return start

    mods = list(model.features) + list(model.head)
    i = 0
    while i < len(mods):
        m = mods[i]
        if isinstance(m, nn.Conv2d):
            w = m.weight.detach().double()
            b = torch.zeros(w.shape[0], dtype=torch.float64) if m.bias is None else m.bias.detach().double()
            if i + 1 < len(mods) and isinstance(mods[i + 1], nn.BatchNorm2d):
                bn = mods[i + 1]
                scale = bn.weight.detach().double() / torch.sqrt(bn.running_var.double() + bn.eps)
                w = w * scale[:, None, None, None]
                b = (b - bn.running_mean.double()) * scale + bn.bias.detach().double()
                i += 1
            layers.append({"type": "conv", "cin": w.shape[1], "cout": w.shape[0], "k": w.shape[2], "pad": m.padding[0], "stride": m.stride[0], "w": add(w.numpy()), "b": add(b.numpy())})
        elif isinstance(m, nn.ReLU):
            layers.append({"type": "relu"})
        elif isinstance(m, nn.MaxPool2d):
            layers.append({"type": "maxpool", "k": 2})
        elif isinstance(m, nn.Linear):
            layers.append({"type": "linear", "cin": m.in_features, "cout": m.out_features, "w": add(m.weight.detach().numpy()), "b": add(m.bias.detach().numpy())})
        elif isinstance(m, (nn.Flatten, nn.Dropout)):
            pass
        else:
            raise ValueError(f"unsupported layer {m}")
        i += 1

    blob = np.concatenate(blobs).astype("<f2")
    out_bin.parent.mkdir(parents=True, exist_ok=True)
    out_bin.write_bytes(blob.tobytes())
    manifest = {"input": [3, *model.in_hw], "layers": layers, **meta}
    out_json.write_text(json.dumps(manifest, indent=1))
    return manifest
