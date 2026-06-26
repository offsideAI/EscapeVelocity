# EscapeVelocity

A cross-platform desktop app for typesetting self-published books: a structured
("what you see is what you *mean*") editor that deterministically generates clean
LaTeX, compiles it with Tectonic to a page-accurate live PDF preview at the real
trim size, and exports a print-ready, KDP-compliant PDF. Native, fast, dark by
default — built in the spirit of the Zed editor.

See [`../PRD.md`](../PRD.md) for the full product spec.

## Stack
- **Shell:** Tauri 2 (Rust)
- **Frontend:** React + Vite + TypeScript
- **Editor:** TipTap/ProseMirror (structured) + CodeMirror 6 (LaTeX source) — later milestones
- **LaTeX:** Tectonic (embedded), `memoir` class, XeLaTeX-class via `fontspec`
- **Preview:** PDF.js

## Prerequisites
- Node ≥ 18 and npm
- Rust (stable) + Cargo
- Platform webview deps — macOS: Xcode Command Line Tools; Linux: `webkit2gtk`;
  Windows: WebView2

## Run
```bash
npm install
npm run tauri dev      # launches the desktop app with HMR
```
Frontend only (in a browser, no native shell):
```bash
npm run dev            # http://localhost:1420
```
Build:
```bash
npm run build          # type-check + bundle the frontend
npm run tauri build    # produce native installers
```

## Keyboard
| Action | Shortcut |
|---|---|
| Command palette | ⌘⇧P · ⌘P  (Ctrl on Windows/Linux) |
| Toggle structure panel | ⌘1 |
| Toggle preview panel | ⌘2 |
| Toggle Structured / LaTeX view | ⌘⇧L |
| Toggle light / dark theme | ⌘⇧T |

## Layout
```
src/
  theme/            Zed-inspired dark tokens (clean-room) + theme switching
  commands/         action registry + data-driven keymap dispatch
  command-palette/  Zed-style palette + fuzzy matcher
  workspace/        layout store + three-pane shell
  panes/            structure | editor | preview
src-tauri/
  src/
    compile/        Tectonic + SyncTeX + diagnostics      (M1)
    latexgen/       structured model → memoir LaTeX        (M2)
    project/        .escvel load/save, autosave, history
    import/         DOCX/Markdown → model                  (M7)
    export/         print-ready PDF + KDP preflight        (M6)
```

## Milestones
- [x] **M0** — Tauri+React shell: dark Zed-token theme, three collapsible panes, command-palette stub.
- [ ] **M1** — Embed Tectonic; compile a hardcoded `memoir` doc → PDF.js preview. *(checkpoint)*
- [ ] **M2** — `document.json` / `settings.json` types + pure `latexgen` with golden tests.
- [ ] **M3** — Structured block editor + core style palette.
- [ ] **M4** — CodeMirror LaTeX pane + SyncTeX + lossless Raw-LaTeX.
- [ ] **M5** — PageSetting inspector (KDP 6×9).
- [ ] **M6** — Export + KDP preflight. *(checkpoint)*
- [ ] **M7** — Import (Markdown/DOCX) + templates.
