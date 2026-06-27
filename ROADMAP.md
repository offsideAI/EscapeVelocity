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
| [Epic 2](#epic-2--m2-generation-contract-latexgen) | M2 | Generation contract (`latexgen`) | 🟢 |
| [Epic 3](#epic-3--m3-structured-editor) | M3 | Structured editor | 🟢 |
| [Epic 4](#epic-4--m4-latex-source-pane--synctex) | M4 | LaTeX source pane + SyncTeX | 🟢 |
| [Epic 5](#epic-5--m5-pagesetting-inspector) | M5 | PageSetting inspector | 🟢 |
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
- ✅ Resolve macOS build deps (brew: harfbuzz/graphite2/freetype/libpng/fontconfig + keg-only icu4c; `.cargo/config.toml` sets `PKG_CONFIG_PATH`)
- ✅ **Fully offline compilation**: cache-only mode (`only_cached`) over a pre-warmed cache. `npm run prewarm` (`examples/prewarm_cache.rs`) builds `vendor/tectonic-cache` (covers the generator's sizes/packages); it's bundled as a Tauri resource and seeded into a writable per-user cache on first launch. **Verified**: a distinct doc compiles with the network blocked (dead proxy) and **zero files fetched**. (gitignored/regenerated; raw-LaTeX needing un-prewarmed packages is the known exception.)
- ✅ Rust smoke test (`tests/compile_smoke.rs`): representative `memoir` → valid PDF, offline
- 🟡 Verify the bundled-resource path in a packaged `tauri build` (engine offline proven; packaged-app seeding pending a release build)

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
**DoD:** editing a sample `document.json` changes the compiled preview; golden tests pass. **Status: 🟢** (DoD met + verified on-device.)

### Story 2.1 — Data model
- ✅ `document.json` node tree (`latexgen/model.rs`): containers `front_matter`/`body`/`back_matter`, `part`/`chapter`/`section`; blocks `paragraph`/`heading`/`block_quote`/`verse`/`figure`/`scene_break`/`pull_quote`/`raw_latex`; inline `text`/`emphasis`/`strong`/`small_caps`/`link`/`footnote` (footnotes modeled inline)
- ✅ `settings.json` PageSetting model (trim, margins, body, paragraph, chapter, running_heads, output_preset)
- ✅ Shared TS mirror (`src/model/types.ts`, hand-kept; Rust authoritative)

### Story 2.2 — Pure `latexgen` function
- ✅ Preamble from `settings.json` (`\documentclass{memoir}`, `\setstocksize`/`\settrimmedsize`(+`\settrims` for bleed), `\linespread`, `microtype` protrusion, margins, widow/orphan penalties, chapter style, page styles)
- ✅ Body from `document.json` (chapter/section, quotation, verse, figure+caption, scene-break ornament, inline footnote, `raw_latex` verbatim) with LaTeX escaping
- ✅ Readable, commented output (`% --- Chapter: … ---`)
- ⏸️ `fontspec` + bundled fonts → M5 (PageSetting font selector); drop-cap/ornament chapter styles → M5
- ⏸️ node-id ↔ `.tex` source map → M4 (with SyncTeX, its consumer)

### Story 2.3 — Presets data file
- ✅ One data-driven presets module (`latexgen/presets.rs`): KDP 6×9/5×8/5.5×8.5/8.5×11 + KDP gutter-by-page-count table

### Story 2.4 — Tests & integration
- ✅ Golden test (BLESS pattern, dep-free) `tests/latexgen_golden.rs`; determinism test; **`generated_sample_compiles`** end-to-end (generated LaTeX compiles offline to PDF)
- ✅ Frontend wired to generate-from-document (`generate_latex`/`default_settings` commands); Structured view edits `document.json`, LaTeX view shows generated source read-only
- 🟢 Verified on-device: sample document generates + compiles + renders in the native window

---

## Epic 3 — M3: Structured editor
**DoD:** a user types a chapter visually and sees it typeset; never touches code. **Status: 🟢** (DoD met + verified on-device.)

### Story 3.1 — TipTap schema ↔ model
- ✅ Custom TipTap schema (`src/editor/schema.ts`): flat semantic blocks (`inline*`) — chapterTitle, heading(2/3), paragraph, blockQuote, pullQuote, verse, rawLatex, sceneBreak; marks bold↔strong, italic↔emphasis, smallCaps; footnote inline atom
- ✅ Two-way serializer (`serialize.ts`): chapter titles group following blocks; **verified lossless** (footnote + front/back matter survive a round-trip; programmatic + slash-menu edits re-serialize correctly)

### Story 3.2 — Style palette & input
- ✅ Style application via keyboard shortcuts (on each node) **and** a slash menu (`SlashMenu.tsx`, filter + ↑/↓/↵)
- ✅ Semantic-only (no font/size/spacing pickers) — appearance owned by settings
- ⏸️ Figure insert (needs asset handling) → later; footnote/link interactive editing → later (footnote round-trips; link renders as text)

### Story 3.3 — Edit → compile pipeline
- ✅ Edits → serialize → `setDocument` → `latexgen` → debounced recompile (supersede-by-runId)
- ✅ Outline pane reflects chapters/headings (read-only)
- ⏸️ Drag-to-reorder; spell-check; word/page count → later

### Story 3.4 — Verify M3
- ✅ Browser: editor renders sample, round-trip lossless, slash menu applies + serializes
- 🟢 On-device: visual editing + live typeset preview together (full loop), no code touched

---

## Epic 4 — M4: LaTeX source pane + SyncTeX
**DoD:** click a preview page → editor jumps; raw block edits survive a round-trip. **Status: 🟢** (DoD met + verified.)

### Story 4.1 — CodeMirror 6 pane
- ✅ CM6 + `stex` LaTeX highlighting + Zed theme (`src/editor/LatexPane.tsx`), read-only
- ✅ Source is generated → the pane is read-only by design; raw-LaTeX is edited in the structured editor (round-trips losslessly). Editable raw regions *in the source pane* → later (needs the node source map)

### Story 4.2 — SyncTeX both directions
- ✅ Enable SyncTeX in Tectonic; capture + gunzip; parse (`src-tauri/src/compile/synctex.rs`, fraction-based) — Rust unit test
- ✅ Preview click → source line (`synctex_inverse`); source click → preview page (`synctex_forward`); jump signals wired through the store
- ⏸️ Compose with the node-id source map (jumps land on the `.tex` line; line→node mapping later)

### Story 4.3 — Lossless Raw-LaTeX
- ✅ `raw_latex` round-trips verbatim via the structured editor (verified in M3)

### Story 4.4 — Verify M4
- ✅ Browser: LaTeX pane renders generated source with highlighting; `requestSourceJump` scrolls/highlights the target line; Rust SyncTeX unit test; native regression (compile + preview intact)

---

## Epic 5 — M5: PageSetting inspector
**DoD:** switching trim to 6×9 and changing body font visibly re-typesets the whole book. **Status: 🟢** (DoD met; verified.)

### Story 5.1 — Inspector UI
- ✅ GUI controls bound to `settings.json` (`src/inspector/`), in a tabbed left dock (Structure ↔ Settings): output preset, trim readout, bleed; font, size, leading, justify, hyphenate, microtype; paragraph style + no-first-indent; inside/outside/top/bottom margins; running heads. Command **Open PageSetting Inspector** (⌘,)
- ✅ **Fonts now work** — `fontspec` by OTF filename over the bundled fonts (EB Garamond default, + Libertinus / TeX Gyre Pagella / Latin Modern / Computer Modern); `latexgen` emits `\setmainfont[...]` with bold/italic variants
- ⏸️ Chapter-style drop-cap/ornament controls, measure, front/back + auto-ToC → later

### Story 5.2 — Binding & recompile
- ✅ Each change → `setSettings` → regenerate preamble → debounced recompile; **KDP 6×9** default + preset switching (`switchPreset` → Rust `default_settings`)
- ⏸️ Gutter auto-suggest from live page count (data-driven `kdp_gutter_in` exists; not yet wired to the compiled page count)

### Story 5.3 — Verify M5
- ✅ Browser: inspector renders all sections; font/size/toggle changes drive `settings`. Rust: golden re-blessed with `fontspec`; `generated_sample_compiles` passes offline with EB Garamond. clippy clean; native app runs.

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
