# Data and asset licences

Everything here is used only to train the two on-device square classifiers of BlunderLab's
position scanner, a personal, non-commercial app that is not distributed. Raw data stays in
`ml/data/` and is never bundled into the app; only the trained weights
(`public/models/squares-*.{json,bin}`) ship.

## Piece sets (synthetic screenshot training data)

SVGs downloaded from the Lichess source repository, `lichess-org/lila`, `public/piece/<set>/`
(raw.githubusercontent.com, branch `master`). Licences as stated in lila's `COPYING.md`.

| Set | Author | Licence | Used for |
| --- | --- | --- | --- |
| cburnett | Colin M.L. Burnett | GPLv2+ | train |
| merida | Armando Hernandez Marroquin | GPLv2+ | held-out evaluation only (not in the shipped model) |
| chessnut | Alexis Luengas | Apache 2.0 | held-out evaluation only (not in the shipped model) |
| pirouetti | pirouetti | AGPLv3+ | train |
| pixel | therealqtpi | AGPLv3+ | train |
| rhosgfx | RhosGFX | CC0 1.0 | train |
| fantasy | Maurizio Monge | MIT | held-out evaluation only (not in the shipped model) |
| spatial | Maurizio Monge | MIT | train |
| celtic | Maurizio Monge | MIT | train |
| mpchess | Maxime Chupin | GPLv3+ | train |
| firi | James Faure | CC BY 4.0 | train |
| totoy | Kosal Sen | CC BY 4.0 | train |
| papercut | Nikolay Anzarov | CC BY 4.0 | train |
| california | Jerry S. | CC BY-NC-SA 4.0 | held-out evaluation only (not in the shipped model) |
| caliente | avi | CC BY-NC-SA 4.0 | train |
| maestro | sadsnake1 | CC BY-NC-SA 4.0 | train |
| fresca | sadsnake1 | CC BY-NC-SA 4.0 | train |
| cardinal | sadsnake1 | CC BY-NC-SA 4.0 | train |
| icpieces | sadsnake1 | CC BY-NC-SA 4.0 | train |
| gioco | sadsnake1 | CC BY-NC-SA 4.0 | train |
| tatiana | sadsnake1 | CC BY-NC-SA 4.0 | train |
| staunty | sadsnake1 | CC BY-NC-SA 4.0 | held-out evaluation only (not in the shipped model) |
| dubrovny | sadsnake1 | CC BY-NC-SA 4.0 | train |
| anarcandy | caderek | CC BY-NC-SA 4.0 | train |
| cooke | fejfar | CC BY-NC-SA 4.0 | train |
| minimal-warmth | blunder_reign | CC BY-NC-SA 4.0 | train |
| chessboart | Michał Fudalej / ChessboArt | CC BY-NC-SA 4.0 | train |
| xkcd | Randall Munroe | CC BY-NC-SA 2.5 | train |

Notes:

- The CC BY-NC-SA sets permit non-commercial adaptation, which covers this personal, unpublished use.
  If the app (or its model weights) were ever distributed commercially, retrain without them
  (the `non_commercial_only` flag in `ml/sets.py` marks them). GPL / AGPL sets: the weights are
  not distributed, so no copyleft obligation is triggered; if they ever are, treat them as
  derived from GPL'd art and ship under compatible terms (or drop those sets).
- Not used: sets with unclear or restrictive terms (alpha "free for personal non commercial
  use", chess7 / companion / leipzig "freeware", reillycraig and riohacha with no licence,
  shahi-ivory-brown no-derivatives, the 3D Staunton images), sets not useful for recognition
  (letter, mono, disguised, kiwen-suwi, shapes, horsey), and monarchy (raster-only in lila).
- Board colours, textures, highlights, arrows and coordinates are generated procedurally
  (`ml/synth.py`); no board images were downloaded. Coordinate text uses fonts installed with
  Windows, rendered into training images only.

## Real-board photos (photo classifier)

**ChessReD (Chess Recognition Dataset)**, Athanasios Masouris and Jan van Gemert, TU Delft, 2023.
Masouris, A. (2023): Chess Recognition Dataset (ChessReD), version 2, 4TU.ResearchData,
https://doi.org/10.4121/99b5c721-280b-450b-b058-b2900b69a90f. Licence: **CC BY-NC-SA 4.0**
(as stated on the 4TU.ResearchData record). Paper: "End-to-End Chess Recognition", arXiv:2310.04086.

Used: `annotations.json` (22 MB) and `chessred2k.zip` (4.68 GB; the 2,078 images with board-corner
annotations, 20 games), with the dataset's own chessred2k train / val / test split by game.
The full 24.6 GB `chessred.zip` was not downloaded (its extra images have no corner annotations).
Non-commercial adaptation for this personal app is within the licence; the same caveat as above
applies if the model were ever distributed.

## Software

PyTorch / torchvision (BSD-3), NumPy (BSD-3), OpenCV (Apache 2.0), Pillow (MIT-CMU),
resvg-py / resvg (MIT / Apache 2.0) are used for training only and are not part of the app.
The app runs the models with its own small TypeScript inference code
(`src/features/analyse/scan/cnn.ts`), no ML runtime. Photo capture uses a plain file input,
which Capacitor's WebView turns into the system camera / picker; no extra plugin.
