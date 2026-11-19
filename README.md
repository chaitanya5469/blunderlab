# BlunderLab

A personal chess-improvement app for Android, by **Chaitanya Krishna**.

BlunderLab syncs your Chess.com games, reviews every one of them with Stockfish on your own phone, and turns your mistakes into puzzles and lessons. Everything except syncing works offline, and nothing leaves the device.

## Features

- **Game sync:** enter your Chess.com username once. New games sync automatically when the app opens.
- **Game Review:**
  - **Summary screen:**
    - a coach's verdict on the game
    - the evaluation graph
    - accuracy and game rating for both players
    - counts of every move type
    - grades for the opening, middlegame and endgame
  - **Board screen:** move badges (brilliant `!!`, great, best, book, inaccuracy `?!`, mistake `?`, miss, blunder `??`), best-move arrows, and a playground to try your own lines with live engine analysis.
  - **Move classification:** modelled on Chess.com's published expected-points method.
  - **Deeper analysis:** re-analyse any game at a higher depth.
- **Historical coaches:** Morphy, Steinitz, Lasker, Capablanca, Alekhine, Nimzowitsch and Tal comment on your games and puzzles. They have animated illustrated avatars, and real quotes appear only where they are sourced.
- **Puzzles:**
  - **From your games:** built from your own blunders and misses, verified by the engine and scheduled for spaced review. You can filter them by time control.
  - **From Lichess:** rated puzzles matched to your level, plus the Lichess daily puzzle.
- **Lessons:** openings and traps you learn on the board, then practise from memory.
- **Position scanner:** photograph a screenshot, diagram or real board. The pieces are recognised on the device, you fix anything wrong in a board editor that checks legality, and then you analyse it.
- **Progress:**
  - streaks, titles and badges
  - a profile screen with rating history
- **Personalisation:**
  - piece sets and board themes
  - move sounds and vibration
  - an option to hide legal-move dots

## Tech

| Part | Choice |
|---|---|
| App | React 19, TypeScript (strict), Vite, Tailwind CSS v4, Motion |
| Storage | IndexedDB through Dexie |
| Chess | chess.js, react-chessboard |
| Engine | Stockfish 19 lite (single-threaded WASM) in a Web Worker |
| Android | Capacitor 8 |
| Scanner | two small CNNs trained in PyTorch (`ml/`), run in the app by a hand-written TypeScript inference module |

## Project layout

```
src/
  features/      one folder per screen or feature (review, puzzles, learn, analyse, coach, ...)
  services/      background work: sync, analysis queue, reclassification, puzzle building
  engine/        UCI wrapper around Stockfish
  lib/           shared logic: types, database, evaluation, classification, settings
  components/    shared UI and chess board components
public/          engine-independent static assets: models, piece sets, sounds
scripts/         build helpers: APK build, icons, lesson validation, opening book, Lichess pack
ml/              training code for the scanner models (data and outputs are not committed)
android/         Capacitor Android project
```

## Getting started

Requires Node 22+.

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build              # type-check and production build into dist/
npm run validate:lessons   # check every lesson line with chess.js and Stockfish
```

## Android

You need the Android SDK (`ANDROID_HOME`, platform 36 and build-tools) and JDK 21 or newer. The Gradle wrapper is pinned to 9.3.1 so that JDK 25 works.

```bash
npm run android:apk
```

This builds the web app, copies it into `android/` and runs Gradle. The debug APK ends up at `android/app/build/outputs/apk/debug/app-debug.apk`.

To install it, either:
- run `adb install -r` with that path over USB, or
- copy the APK to the phone, open it from a file manager and allow installing unknown apps.

App data lives in the app's own storage, so uninstalling the app deletes it.

## Move sounds

The sound files are not included in this repository. To get sounds, put your own MP3s in `public/sounds/` with these names:

```
move-self  move-opponent  capture  castle  move-check  promote
game-start  game-end  game-win-long  illegal  puzzle-correct-2  puzzle-wrong
```

Without them the app works normally, just silently.

## Data and credits

- **Chess.com:** games and ratings come from the [Chess.com public API](https://www.chess.com/news/view/published-data-api). BlunderLab is not affiliated with Chess.com.
- **Lichess (CC0):** the [puzzle database](https://database.lichess.org/#puzzles) and the [opening list](https://github.com/lichess-org/chess-openings).
- **Stockfish:** [Stockfish](https://stockfishchess.org/) is licensed under GPLv3.
- **Piece sets:** the authors and licences are listed in the app under Settings and in `ml/LICENSES.md`.

Some bundled assets carry **non-commercial or copyleft licences**, as do the scanner's training data. This includes several piece sets and the real-board photo dataset (ChessReD, CC BY-NC-SA 4.0). The app is a personal, non-commercial project; review those licences before any commercial release.
