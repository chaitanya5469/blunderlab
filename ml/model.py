"""Small square classifiers (13 classes: empty + 12 pieces).

Plain conv / batch-norm / ReLU / max-pool / linear layers only, so the exported weights can be run by
the app's tiny TypeScript inference code (src/features/analyse/scan/cnn.ts) without a model runtime.
"""
import torch
from torch import nn


def block(cin: int, cout: int) -> list[nn.Module]:
    return [nn.Conv2d(cin, cout, 3, padding=1, bias=False), nn.BatchNorm2d(cout), nn.ReLU(inplace=True)]


class SquareNet(nn.Module):
    """Input (N, 3, H, W) in [0, 1]. `widths` per stage; each stage = 2 convs + 2x2 max-pool."""

    def __init__(self, in_hw: tuple[int, int] = (32, 32), widths: tuple[int, ...] = (16, 32, 64), hidden: int = 128, classes: int = 13, stem_stride: int = 1):
        super().__init__()
        layers: list[nn.Module] = []
        cin = 3
        if stem_stride > 1:
            # Strided stem: halves the (larger) photo tile before the stages, keeping inference cheap.
            layers += [nn.Conv2d(3, widths[0], 3, stride=stem_stride, padding=1, bias=False), nn.BatchNorm2d(widths[0]), nn.ReLU(inplace=True)]
            cin = widths[0]
        for w in widths:
            layers += block(cin, w) + block(w, w) + [nn.MaxPool2d(2)]
            cin = w
        self.features = nn.Sequential(*layers)
        h, w = in_hw[0] // stem_stride >> len(widths), in_hw[1] // stem_stride >> len(widths)
        self.head = nn.Sequential(nn.Flatten(), nn.Dropout(0.2), nn.Linear(cin * h * w, hidden), nn.ReLU(inplace=True), nn.Dropout(0.2), nn.Linear(hidden, classes))
        self.in_hw = in_hw
        self.widths = widths
        self.hidden = hidden

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(x))
