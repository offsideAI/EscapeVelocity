# Third-party code & attributions

Licensing posture for **EscapeVelocity itself is deferred** (project decision;
cf. PRD §8.1) and will be finalized before any distribution. This file tracks
what we depend on and where the aesthetic comes from.

## Design / aesthetic — clean-room
- The color tokens, surface layering, and the "calm, dark, keyboard-first"
  aesthetic in `src/theme/` are **independently authored**, inspired by the Zed
  editor's visual language. No Zed source, theme JSON, or assets are copied.
- The command palette and keymap (`src/commands/`, `src/command-palette/`) are
  **clean-room** reimplementations of common editor patterns (id→command
  registry feeding a palette + a chord→command keymap), not ports of Zed code.
- For reference: Zed's theme definitions are Apache-2.0 and Zed's editor crate
  is GPL-3.0. We deliberately vendor **neither** while licensing is undecided.
  If we later choose to reuse Zed source directly, this file and the project
  license will be updated to record it and to comply with the relevant terms.

## Runtime dependencies (high level)
| Area | Library | License |
|---|---|---|
| App shell | Tauri 2.x | MIT / Apache-2.0 |
| Frontend | React, React-DOM | MIT |
| Build | Vite, TypeScript | MIT / Apache-2.0 |
| Layout | react-resizable-panels | MIT |
| (M1+) LaTeX engine | Tectonic | MIT |
| (M1+) PDF preview | PDF.js | Apache-2.0 |
| (M3+) Block editor | TipTap / ProseMirror | MIT |
| (M4+) Source pane | CodeMirror 6 | MIT |
| (planned) Default fonts | EB Garamond, Libertinus, Source Serif | OFL |

Exact, complete dependency licenses are enumerated by the `package-lock.json`
and `Cargo.lock` lockfiles. This table is updated as milestones add deps.
