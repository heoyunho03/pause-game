# UI v2.0 evidence log (2026-11-02)

## Scope
Source: a copy of `/mnt/data/PAUSE_v1_9_identity` with only launcher rendering, shared shell text/visuals, and additional CSS modified. No remote systems written. Previous game mechanics and existing storage keys preserved. New `pause:v20:recent` stores only local game IDs in order.

## Passed
- `python build.py`: generated a standalone ~419KB HTML document.
- `node --check compiled-test.js`: 0 syntax errors on compiled inline JavaScript.
- Chromium browser (set_content, NOT file://): 1440, 768, 390 and 320 px — 12 cards, no horizontal overflow and no page JS errors on checked flows.
- At 1440 / 768 px: search for Sudoku, sort by quick play, 2048 play/pause/resume/close.
- At 390 / 320 px: full library + Sudoku game open/close without JS errors.
- `tests/test_v20_all.py`: game modules 12/12 can mount and close; recent game ordering, empty favorites and reset, random play; no JS errors.
- `tests/test_v20_mobile_modules.py`: all 12 games mount and close at 390 px; no page overflow or JS exceptions.
- Browser screenshot captures saved for home PC/mobile, Sudoku and sample arcade games.

## Limitations / not verified
- `file://` navigation blocked by browser administrative policy; generated code was injected in the browser with `set_content()`.
- Two legacy long-running deep-game regression scripts timed out in this environment, so full game-by-game mechanic regression is **not** claimed.
- WebGL GPU / real mobile physical input / browser-specific scroll quirks / offline ZIP direct-open are unverified.
- No deployment or Firebase integration.

## Release blockers for production
Actual mobile input QA for all games, verified browser WebGL and long-running loops, full regression suite, real website hosting smoke test, and thorough color contrast/accessibility pass.
