# PAUSE v2.0 — Game Experience / Deep Sunset

This is an offline-friendly, standalone HTML/CSS/JavaScript web arcade. **No account or database is required to play.** The project builds a single self-contained `index.html` from `src/base_v03.html`, the shared game shell and 12 game modules.

## Changes from v1.9

- A redesigned 12-game library with individually designed (inline SVG) covers, visible launch action, readable genre and play-duration metadata, text search, genre filters, sort modes, randomized game launch and meaningful empty states.
- Actual recently-played game list, instead of presenting the entire catalog as 'Continue'. Persisted under `pause:v20:recent`; does not modify prior save keys.
- A cohesive PAUSE game shell with per-game color accents, descriptive game identity, consistent play controls, help, scores/status and restart/home affordances. Clearer visual hierarchy, compact responsive layout and accessible focus styles.
- More coherent deep blue `#335D9E`, muted sunset `#D58D61` and a neutral mid-tone gradient. Gameplay scenes keep their distinct colors and mechanics: Sky Roll precision/physics and Endless Run urban parkour remain different games.
- Mobile 2-column library, keyboard/touch and reduced-motion support. No external libraries or image services are required.

## Run

Unzip the offline release and open `index.html` in a modern browser, ideally Chrome/Edge. Some embedded preview environments block HTML execution. Alternatively serve the directory using a local static file server.

## Build

`python build.py`

The generated `index.html` includes the updated `src/pause-v20-ui.css` at the end of the game CSS so earlier game modules are visually polished without logic rewrites.

## QA

`python tests/test_v20_all.py` — game module mounting, recent history, empty/favorite navigation and random launch

`python tests/test_v20_mobile.py` — small-screen layout, key library flows and Sudoku mobile game

`python tests/test_v20_mobile_modules.py` — all twelve games on a mobile-width screen

Actual QA results in `docs/UI_RELEASE_v2.0.md`. Some legacy long-running test suites may time out in this sandbox; no claims are made about full-device or GPU WebGL checks.

## Not implemented

- Firebase Google login and cross-device saves.
- Official site deployment, hosted URL or GitHub publication.
- Comprehensive long-session playtesting on physical iOS/Android hardware.
- Verified GPU WebGL runtime; Canvas fallback was the validated environment earlier.
- Advanced game-art overhaul of every underlying object or replacement of all pre-existing assets.

All previous game modules remain available. In particular the postponed traffic escape difficulty + actual bus/barrier-art upgrades are *not* part of this UI release.
