# EscapeVelocity — Roadmap

Engineering breakdown of the build. **Epics map 1:1 to the PRD/brief milestones (M0–M7).**
Source of truth: [`PRD.md`](./PRD.md) (spec) + [`PROMPT.md`](./PROMPT.md) (implementation brief).
App lives in [`EscapeVelocity-native-tauri/`](./EscapeVelocity-native-tauri/).

> Status legend: ⬜ not started · 🟡 in progress · ✅ done · ⏸️ blocked/deferred · 🟢 verified on-device

## Milestone ↔ Epic map
| Epic | Milestone | Theme | Status |
|---|---|---|---|
| [Epic 0](#epic-0--m0-project-shell--reuse-foundation) | M0 | Project shell & reuse foundation | 🟢 |
| [Epic 1](#epic-1--m1-compile-loop-tectonic--pdfjs) | M1 | Compile loop (Tectonic → PDF.js) · *checkpoint* | 🟢 |
| [Epic 2](#epic-2--m2-generation-contract-latexgen) | M2 | Generation contract (`latexgen`) | ⬜ |
| [Epic 3](#epic-3--m3-structured-editor) | M3 | Structured editor | ⬜ |
| [Epic 4](#epic-4--m4-latex-source-pane--synctex) | M4 | LaTeX source pane + SyncTeX | ⬜ |
| [Epic 5](#epic-5--m5-pagesetting-inspector) | M5 | PageSetting inspector | ⬜ |
| [Epic 6](#epic-6--m6-export--kdp-preflight) | M6 | Export + KDP preflight · *checkpoint* | ⬜ |
| [Epic 7](#epic-7--m7-import--templates) | M7 | Import + templates (Phase 2 start) | ⬜ |

Locked decisions (from the interview): Stack A (Tauri 2 + React + Vite + TS); licensing **deferred** → clean-room Zed aesthetic, no vendored Zed source; block editor = TipTap/ProseMirror custom schema; LaTeX = embedded `tectonic` crate, pre-bundled for offline; flowing-text books only (v1); `latexgen` emits a node-id ↔ `.tex` source map; generated `.tex` read-only, Raw-LaTeX editable/verbatim; all trim/bleed/margin geometry in one data-driven presets file; Rust = rust-analyzer LSP live + clippy/tests at each gate.

---

## Epic 0 — M0: Project shell & reuse foundation
**DoD:** app launches; dark with Zed-derived tokens; three empty panes; palette opens; `THIRD_PARTY.md` records sources. **Status: 🟢** (verified on-device — the shell renders in the native window during M1).

### Story 0.1 — Scaffold & structure
- ✅ Scaffold Tauri 2 + React + Vite + TypeScript (strict)
- ✅ Restructure to the PRD §8.4 component map (`theme/`, `panes/`, `commands/`, `command-palette/`, `workspace/`; `src-tauri/{compile,latexgen,project,import,export}`)
- ✅ Gates: `tsc` strict clean · `cargo clippy` clean · native debug binary links
- 🟢 Verified on-device: `npm run tauri dev` renders the shell in the native window

### Story 0.2 — Theme system (clean-room Zed tokens)
- ✅ Dark-first CSS token set (surfaces, text, accent, status, syntax)
- ✅ Light theme override + runtime switch + persistence
- ✅ `THIRD_PARTY.md` clean-room/aesthetic posture (licensing deferred)

### Story 0.3 — Workspace shell (three docks)
- ✅ Resizable/collapsible structure | editor | preview (react-resizable-panels)
- ✅ Persisted layout (`autoSaveId`)
- ✅ Title bar (drag region, macOS overlay traffic-light inset) + status strip
- ✅ Editor Structured/LaTeX view toggle (stub)

### Story 0.4 — Command system (clean-room)
- ✅ Action registry (id → command)
- ✅ Data-driven, platform-aware keymap dispatch (chord normalization, `mod` = ⌘/Ctrl)
- ✅ Command palette + fuzzy matcher + keyboard nav
- ✅ Default commands (palette toggle, dock toggles, view toggle, theme toggle)

---

## Epic 1 — M1: Compile loop (Tectonic → PDF.js)
**DoD:** a real PDF page renders in-app; changing the hardcoded `.tex` and recompiling updates the preview. **← checkpoint: confirm before M2.** **Status: 🟢** (DoD met and verified on-device; some refinements deferred — see ⏸️ below.)

### Story 1.1 — Embed Tectonic
- ✅ Add the pinned `tectonic` crate (`=0.16.9`) to `src-tauri`
- ✅ Resolve macOS build deps (brew: harfbuzz/graphite2/freetype/libpng/fontconfig + keg-only icu4c; `src-tauri/.cargo/config.toml` sets `PKG_CONFIG_PATH`)
- ⏸️ Pre-bundle the TeX support files for fully-offline first compile (currently fetched once from the network, then cached — offline packaging deferred)
- ✅ Rust smoke test (`tests/compile_smoke.rs`): minimal `memoir` → valid PDF

### Story 1.2 — Compile module (Rust `compile/`)
- ✅ `compile::latex_to_pdf(source) -> PDF bytes` via the embedded engine
- ✅ Tauri command `compile_latex(source)` → bytes (ArrayBuffer), run on a blocking thread
- ⏸️ **SyncTeX** output + `raw_log`/`synctex_path` (planned with M4)
- 🟡 Debounced (~600 ms) recompile ✅ (frontend); true engine cancellation deferred (currently supersede-by-runId)

### Story 1.3 — Hardcoded memoir fixture
- ✅ Representative `memoir` fixture at 6×9 (chapter opening, body, two pages)
- ✅ Editable LaTeX view + "Compile" command/button (⌘↵)

### Story 1.4 — PDF.js preview pane
- ✅ `pdfjs-dist`; PDF delivered as bytes over IPC, rendered one canvas per page
- ✅ Pages at true trim size, fit-to-width (scroll navigation; explicit page nav/zoom deferred)
- ✅ Status strip wired to real compile state + page count (flags odd counts for KDP)

### Story 1.5 — Verify M1
- ✅ Editing the source + recompile visibly updates the preview (chapter-title change confirmed)
- ✅ `cargo clippy` clean · `tsc` strict clean · smoke test green · screenshots captured
- 🟢 Verified on-device (native window: live page renders, recompile updates) — **checkpoint: confirm before M2**

---

## Epic 2 — M2: Generation contract (`latexgen`)
**DoD:** editing a sample `document.json` changes the compiled preview; golden tests pass. **Status: ⬜**

### Story 2.1 — Data model
- ⬜ `document.json` node tree types (containers `front_matter`/`body`/`back_matter`, `part`/`chapter`/`section`; blocks `paragraph`/`heading`/`block_quote`/`verse`/`figure`/`footnote`/`scene_break`/`pull_quote`/`raw_latex`; marks `emphasis`/`strong`/`small_caps`/`link`)
- ⬜ `settings.json` PageSetting model (trim, margins/gutter, body, paragraph, chapter_style, running_heads, front_back, output_preset)
- ⬜ Rust ↔ shared TS type parity (serde; codegen or hand-kept)

### Story 2.2 — Pure `latexgen` function
- ⬜ Preamble from `settings.json` (`\documentclass{memoir}`, `\setstocksize`/`\settrimmedsize`/`\settrims` incl. bleed, `fontspec`, `\linespread`, `microtype` protrusion, margins/gutter, widow/orphan penalties, chapter style, page styles)
- ⬜ Body from `document.json` (chapter/section, quote/quotation, verse, figure+caption, scene-break ornament, footnote, `raw_latex` verbatim)
- ⬜ Readable, commented output (`% --- Chapter N ---`)
- ⬜ Emit node-id ↔ `.tex` line-range **source map**

### Story 2.3 — Presets data file
- ⬜ One data-driven presets module (`kdp_6x9`, `kdp_5x8`, … : trim, bleed, margins, gutter-by-page-count)

### Story 2.4 — Tests & integration
- ⬜ Golden-file tests (`insta`): fixed `document.json` + `settings.json` → expected `.tex`
- ⬜ Replace the hardcoded `.tex` in the compile loop with generated output
- ⬜ Verify + gate

---

## Epic 3 — M3: Structured editor
**DoD:** a user types a chapter visually and sees it typeset; never touches code. **Status: ⬜**

### Story 3.1 — TipTap schema ↔ model
- ⬜ Custom ProseMirror/TipTap schema = the semantic nodes/marks
- ⬜ Serialize TipTap doc ↔ `document.json` (lossless round-trip)

### Story 3.2 — Style palette & input
- ⬜ Core style palette (Body, Chapter Title, H2/H3, Block Quote, Verse, Figure+caption, Footnote, Scene Break, Pull Quote, Raw-LaTeX) via shortcuts + slash menu
- ⬜ Figure insert (image + caption, 300-DPI guidance)
- ⬜ Semantic-only (no font/size/spacing pickers)

### Story 3.3 — Edit → compile pipeline
- ⬜ Edits update `document.json` → `latexgen` → debounced/cancellable recompile
- ⬜ Structure/outline pane reflects the tree + drag-to-reorder
- ⏸️ Spell-check, word/page count (deferred within M3 or to M7)

### Story 3.4 — Verify M3
- ⬜ Visual chapter authoring → live typeset preview; gate; on-device

---

## Epic 4 — M4: LaTeX source pane + SyncTeX
**DoD:** click a preview page → editor jumps; raw block edits survive a round-trip. **Status: ⬜**

### Story 4.1 — CodeMirror 6 pane
- ⬜ CM6 + LaTeX (Lezer/tree-sitter) highlighting + Zed dark theme
- ⬜ Read-only decorations on generated regions; editable on `raw_latex` regions

### Story 4.2 — SyncTeX both directions
- ⬜ Parse SyncTeX (PDF ↔ `.tex`)
- ⬜ Compose with the `latexgen` source map: page click → node/editor; caret → preview scroll

### Story 4.3 — Lossless Raw-LaTeX
- ⬜ Capture raw-block edits back into `document.json` verbatim; round-trip test

### Story 4.4 — Verify M4

---

## Epic 5 — M5: PageSetting inspector
**DoD:** switching trim to 6×9 and changing body font visibly re-typesets the whole book. **Status: ⬜**

### Story 5.1 — Inspector UI
- ⬜ GUI controls bound to `settings.json` (trim/margins/gutter; font/size/leading/measure/justification/hyphenation/microtype; paragraph indent-vs-spaced + penalties; chapter style; running heads/folios; front/back + auto-ToC; output preset)

### Story 5.2 — Binding & recompile
- ⬜ Each change → regenerate preamble → recompile; **KDP 6×9 preset**
- ⬜ Gutter auto-suggest from page count (post-compile, data-driven table)

### Story 5.3 — Verify M5

---

## Epic 6 — M6: Export + KDP preflight
**DoD:** exported PDF opens with fonts embedded, correct page size, even page count. **← checkpoint: demo full import→export.** **Status: ⬜**

### Story 6.1 — Print-ready export
- ⬜ Page size (trim, or trim + 0.125″ bleed); embed/subset all fonts; no crop marks; even page count (auto blank verso); flatten transparency; images ≥ 300 DPI
- ⬜ Export the `.tex` + assets bundle

### Story 6.2 — KDP preflight validator
- ⬜ Checks: trim vs preset, gutter adequacy by page count, font embedding, image DPI, odd page count, stray crop marks/transparency — list concrete fixes (no silent structural fixes)
- ⬜ Unit tests for the validator

### Story 6.3 — Plain-language diagnostics
- ⬜ Map Tectonic warnings/errors to plain language + "show raw log" + link to the originating node

### Story 6.4 — Verify / demo
- ⬜ Full import → export of a sample book — **checkpoint**

---

## Epic 7 — M7: Import + templates
**DoD (Phase 2 start):** import a manuscript with a review step; full presets; templates; scaffolding. **Status: ⬜**

### Story 7.1 — Import
- ⬜ Markdown import (standard parser)
- ⬜ DOCX import (mammoth or a Rust docx reader) with an **import-review** step (no silent guessing)

### Story 7.2 — Presets
- ⬜ Full KDP trim-size set + IngramSpark (data-driven)

### Story 7.3 — Templates
- ⬜ House-style save/share (PageSetting + styles) + a small starter library

### Story 7.4 — Front/back-matter
- ⬜ Standard front/back-matter scaffolding + auto-ToC

### Story 7.5 — Fonts
- ⬜ Ship open-licensed defaults (EB Garamond / Libertinus / Source Serif)

### Story 7.6 — Verify

---

### v1 Definition of Done (across epics)
A non-technical user can import a manuscript, choose a KDP 6×9 preset, see a live page-accurate preview, and export a PDF that passes KDP's Print Previewer on first upload — while a technical user can open the LaTeX pane, read clean generated source, and tweak via Raw-LaTeX blocks.
