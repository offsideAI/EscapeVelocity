# Claude Code build prompt — EscapeVelocity

> Paste everything below the line into Claude Code at the root of a directory that contains **`PRD.md`** (the EscapeVelocity Product Requirements Document). Claude Code must **read `PRD.md` first**, then run **interview mode** (ask clarifying questions and wait for answers) **before writing any code**. Only after the interview is resolved should it scaffold, build, run, and iterate against the milestones, pausing for confirmation at the marked checkpoints.

---

## Mission

Build **EscapeVelocity**, a cross-platform desktop app for typesetting self-published books. It is a structured ("what you see is what you *mean*") editor that deterministically generates clean **LaTeX**, compiles it to a **page-accurate live PDF preview** at the real book trim size, and exports a **print-ready, KDP-compliant PDF**. It must feel like the **Zed editor**: native, fast, **dark-mode by default**, keyboard-first, calm, with a command palette and minimal chrome.

Target user is a **non-technical self-publishing author** (primary) and a **technical "prosumer" author** (secondary) who occasionally edits the generated LaTeX directly.

## Your role

Act as a **senior staff engineer at a major FAANG company** who has been handed this project. Bring that level of rigor: read the spec critically before touching code, interrogate ambiguous or risky requirements, weigh trade-offs explicitly, design for maintainability and testability, call out where the PRD is underspecified or where a requirement will cause problems downstream, and propose the pragmatic path rather than the most code. You are expected to push back with reasoning when something in `PRD.md` is unclear, conflicting, or unwise — not to silently comply.

## Source of truth

**`PRD.md` (the EscapeVelocity Product Requirements Document) is the authoritative spec.** Read it in full before anything else. This prompt is the implementation brief that operationalizes it. If this prompt and `PRD.md` ever conflict, surface the conflict during the interview rather than guessing.

## Before you write any code — interview mode

**Do not scaffold or implement until the interview is complete.** First read `PRD.md` and this brief end to end. Then enter **interview mode**: present your clarifying questions, wait for my answers, and confirm a short implementation plan back to me. Conduct it like a senior engineer scoping a project — batch related questions, explain *why* each matters and how different answers change the design, and propose a sensible default for each so I can simply confirm or override.

At minimum, you must explicitly ask:

1. **Frontend stack — should the frontend use React + Vite?** (Proposed default: yes — React + Vite + TypeScript inside the Tauri shell, for fast HMR and a simple build.) Offer alternatives (e.g. SolidJS, Svelte, or plain TS) and note the trade-offs, but ask before committing.
2. **Stack A vs. Stack B** (Tauri + web frontend vs. GPUI-native fork of Zed) — see "Reusing Zed's code." Confirm which to build, given the licensing decision below.
3. **Any open questions from `PRD.md`** you judge material — at least the two it flags: (a) commercial/closed vs. open-source posture (already resolved to **GPL-3.0 open-source** in the constraints below — confirm), and (b) v1 scope: flowing-text books only, or must fixed-layout/illustrated books be supported (which would change the architecture).
4. **Anything genuinely ambiguous, conflicting, or risky** you surfaced while reading `PRD.md` — raise it now, with your recommended resolution.

Keep the interview tight and decision-oriented; once I answer, restate the locked decisions and the milestone plan, then begin M0.

## Hard constraints & guardrails (read first)

1. **Reuse Zed's code directly — GPL is acceptable.** You may **clone, fork, vendor, and adapt `zed-industries/zed` source directly**, including its **GPL-3.0 editor code**, wherever it helps. The deliberate consequence: **EscapeVelocity itself will be licensed GPL-3.0-or-later and source-available.** That is an accepted project decision. Comply with GPL obligations as you go: keep upstream copyright/license notices, mark files you modify as changed, ship the corresponding source, and keep a `THIRD_PARTY.md` / `NOTICES` file recording what came from Zed (GPL) vs. GPUI/themes (Apache-2.0). Apache-2.0 parts (GPUI, themes) remain reusable too, with attribution. (AGPL only applies to Zed's server components, which are out of scope here.) Prefer reusing solid Zed code over reimplementing when it saves real work.
2. **Stack = Tauri (Rust) + TypeScript/React frontend.** Native, small binaries, macOS/Windows/Linux. (A GPUI-native Rust version exists as a future "north star" — **do not** attempt it here.)
3. **LaTeX engine = Tectonic**, embedded/invoked from the Rust side, so users need **no separate TeX install**. Pin a known-good Tectonic version. Use a **XeLaTeX-class** workflow (`fontspec` for system/OTF fonts + full Unicode).
4. **Book class = `memoir`** by default (it has native trim/stock-size control ideal for KDP trim + bleed, and rich chapter styles).
5. **Direction of truth:** the **structured document model is the single source of truth for content** and *generates* LaTeX. **Do not** build a general LaTeX→model parser. Author-level raw control comes only via an explicit **Raw-LaTeX block** stored verbatim (lossless round-trip for that block only). Preamble is generated from the **PageSetting settings model**.
6. **Local-first.** No accounts, no cloud, no telemetry in this build.
7. Generated LaTeX must be **clean and human-readable**, not minified — the author can open and learn from it.
8. After each milestone, **run the app, verify the acceptance criteria, and show me the result** before moving on.

## Reusing Zed's code

**Clone `https://github.com/zed-industries/zed` into a `reference/` directory** and reuse from it directly wherever it saves work. Because the project is GPL-3.0, you are not limited to "inspiration" — you can lift, fork, and adapt actual Zed source. Highest-value reuse:

- **Theme system & tokens** *(Apache-2.0):* take Zed's dark palette, surface layering, syntax colors, and semantic color roles directly into our `theme/`, and replicate its typed-token structure + theme switching.
- **Command palette, action registry & dispatch** *(GPL editor code):* reuse Zed's action/command and palette model; port or adapt it into our stack rather than rebuilding from nothing.
- **Pane / dock / workspace layout** *(GPL):* reuse Zed's workspace/dock model (left/center/right docks, collapsible, layout persistence).
- **Keymap design** *(GPL):* reuse Zed's data-driven, context-scoped keybinding approach and its actual keymap definitions where they fit a typesetting app.
- **Editor internals** *(GPL):* where the LaTeX source pane needs buffer handling, tree-sitter highlighting wiring, or selection/cursor logic, adapt Zed's implementation instead of reinventing it.

**Stack implication — decide explicitly.** Zed's editor/UI code is **Rust on GPUI**, so *direct* reuse of Zed's editor and UI components is only possible on a **GPUI-native build (Stack B)**. In the default **Tauri + React (Stack A)** build, "reuse" mainly means lifting Zed's **themes, keymaps, action/command structures, and porting logic** into TypeScript — its Rust UI code can't drop into a web frontend. If the priority is **maximal literal reuse of Zed's source** (a true fork), prefer **Stack B (GPUI-native)** and reuse Zed's editor crate directly for the LaTeX source pane; if the priority is **shipping speed and cross-platform simplicity**, stay on **Stack A** and reuse what ports cleanly. **Confirm which before M1.** Record all borrowed code and its origin/license in `THIRD_PARTY.md`.

## Recommended libraries
- Shell: **Tauri 2.x**.
- Frontend (Stack A): **React + Vite + TypeScript** *(proposed default — confirm in the interview)*.
- LaTeX source pane: **CodeMirror 6** with a tree-sitter/Lezer LaTeX grammar and a Zed-style dark theme.
- Structured/block editor: **ProseMirror** or **TipTap** (or a small custom model) — content is semantic blocks, *not* free formatting.
- PDF preview: **PDF.js**.
- Compilation: **Tectonic** (Rust crate or pinned binary) with **SyncTeX** enabled.
- DOCX import (Phase 2): **mammoth** or a Rust docx reader; Markdown import via a standard parser.

---

## Data model (define this first, in `src-tauri/latexgen` + shared TS types)

**Project = a `.escvel` folder** (human-inspectable, git-friendly):
```
MyBook.escvel/
├─ document.json     # the structured model (source of truth)
├─ settings.json     # PageSetting model (trim, fonts, styles, preset)
├─ assets/           # images, fonts
└─ build/            # generated main.tex + compiled output.pdf + synctex
```

**`document.json`** — an ordered tree of typed nodes:
- containers: `front_matter`, `body`, `back_matter`; `part`, `chapter`, `section`
- blocks: `paragraph`, `heading{level}`, `block_quote`, `verse`, `figure{src,caption}`, `footnote`, `scene_break`, `pull_quote`, `raw_latex{code}`
- inline marks: `emphasis`, `strong`, `small_caps`, `link`
Each node carries a semantic style id, **never** raw font/size/spacing.

**`settings.json`** — the PageSetting model:
- `trim`: preset id or `{w,h}` in inches; `bleed: bool`
- `margins`: inside/outside/top/bottom; `gutter` (auto-suggested from page count)
- `body`: font family, size (pt), leading, justification, hyphenation, microtype on/off
- `paragraph`: indent | spaced, suppress-first-indent, widow/orphan penalty
- `chapter_style`: plain | dropcap | versal | ornament | smallcaps; recto-start; drop-folio
- `running_heads` / `folios`: verso/recto content, number style/position
- `front_back`: which standard pages exist, in what order; auto-ToC
- `output_preset`: `kdp_6x9` | `kdp_5x8` | `kdp_5.5x8.5` | `kdp_8.5x11` | `ingramspark` | `custom`

## The LaTeX generation contract (the core of the app)

In `src-tauri/latexgen`, implement a **pure, deterministic** function: `(document.json, settings.json) → main.tex`.

- **Preamble** is generated entirely from `settings.json`:
  - `\documentclass{memoir}` + trim/stock via `memoir`'s `\setstocksize`, `\settrimmedsize`, and `\settrims` (apply bleed by enlarging stock by 0.125″ on top/bottom/outside when `bleed=true`).
  - `\usepackage{fontspec}` + chosen body font; `\linespread` from leading; `\usepackage{microtype}` (protrusion) when enabled.
  - Margin/gutter setup, widow/orphan penalties, chapter style, page styles for running heads/folios.
- **Body** is generated from `document.json` by mapping each semantic node to the corresponding `memoir` construct (chapters → `\chapter`, block quote → `quote`/`quotation`, verse → `verse`, figure → `figure`+`\caption`, scene break → a centered ornament, etc.).
- **Raw-LaTeX blocks** are emitted **verbatim**.
- Output must be **formatted and commented** (e.g. `% --- Chapter 3 ---`) so it's readable.
- Provide golden-file tests: fixed `document.json` + `settings.json` → expected `.tex`.

## Compilation & preview pipeline

- Rust `compile` module: write `build/main.tex`, run **Tectonic** with SyncTeX, return PDF path + SyncTeX data + parsed diagnostics.
- **Debounce** recompiles (~600 ms after last edit); make them **cancellable**; never block the UI.
- Map Tectonic warnings/errors to **plain-language diagnostics** ("a heading landed on the last line of a page"; "missing font — using fallback") with a "show raw log" toggle, and link each back to the originating structured node where possible.
- Frontend preview (PDF.js): render pages at true trim size; **click a page → jump** to source via SyncTeX, and **click in editor → scroll preview**.
- Status strip: live **page count** (flag odd counts that need a blank verso for KDP), compile state, warning count.

## Export & KDP preflight

- **Export print-ready PDF:** correct page size (trim, or trim + 0.125″ bleed when enabled), **embed/subset all fonts**, **no crop marks**, ensure **even page count** (auto-insert a blank verso), flatten transparency, images ≥ 300 DPI.
- **Preflight validator** ("KDP preflight") runs before export and reports pass/fix for: trim matches preset; **gutter adequate for page count** (e.g. larger inside margin as page count grows); fonts embedded; image DPI; odd page count; stray crop marks/transparency. List concrete fixes; don't silently "fix" structure.
- Also export the **`.tex` + assets** bundle so the author owns portable source.

## UI / aesthetic (Zed-grade, dark-first)

- **Three panes:** left = document **structure/outline** (drag to reorder); center = **editor** (toggle/split **Structured** ↔ **LaTeX source**); right = **page-true PDF preview**. All panes dockable/collapsible; remember layout.
- **PageSetting inspector** panel: GUI controls bound to `settings.json`; every change regenerates preamble and recompiles.
- **Command palette** (Zed-style), keyboard-first; semantic styles applied via shortcuts and a slash menu; minimal toolbars.
- **Dark theme by default** using Zed-derived tokens (define a `theme/` token set: background, surfaces, text, accent, syntax colors matching Zed's calm palette); light theme available. No "Christmas-tree" toolbar.

---

## Build order (milestones — run & verify each)

**M0 — Scaffold & reuse.** Clone `zed-industries/zed` into `reference/`. Decide Stack A vs. Stack B (see "Reusing Zed's code"). Bring Zed's dark theme tokens into `theme/`, and reuse/port its command-palette and dock/workspace patterns. Then build the three-pane shell + command palette stub (Tauri 2 + React/TS for Stack A; GPUI-native if Stack B). *DoD: app launches on this OS, dark with Zed's tokens, three empty panes, palette opens; `THIRD_PARTY.md` records Zed-sourced code and its license.*

**M1 — Compile loop.** Embed Tectonic; compile a hardcoded `memoir` document to PDF; render it in the PDF.js pane. *DoD: a real PDF page renders in-app; changing the hardcoded `.tex` and recompiling updates the preview.* **← checkpoint: confirm before M2.**

**M2 — Generation contract.** Implement `document.json` + `settings.json` types and the pure `latexgen` function with golden tests. Replace the hardcoded `.tex` with generated output. *DoD: editing a sample `document.json` changes the compiled preview; golden tests pass.*

**M3 — Structured editor.** Block editor with the core style palette (Body, Chapter Title, H2/H3, Block Quote, Verse, Figure+caption, Footnote, Scene Break, Pull Quote, Raw-LaTeX). Edits update `document.json` → regenerate → debounced recompile. *DoD: a user types a chapter visually and sees it typeset in the preview, never touching code.*

**M4 — LaTeX source pane + SyncTeX.** CodeMirror 6 read-mostly view of generated `.tex` with LaTeX highlighting and Zed theme; SyncTeX click-to-jump both directions; Raw-LaTeX blocks editable and lossless. *DoD: click a preview page → editor jumps; raw block edits survive a round-trip.*

**M5 — PageSetting inspector.** GUI for trim/margins/gutter/font/leading/justification/chapter-style/running-heads/folios, bound to `settings.json`, with the **KDP 6×9 preset**. *DoD: switching trim to 6×9 and changing body font visibly re-typesets the whole book.*

**M6 — Export + preflight.** Print-ready PDF export (embedded fonts, bleed option, even-page fix, no crop marks) + KDP preflight report. *DoD: exported PDF opens with fonts embedded, correct page size, even page count.* **← checkpoint: demo a full import→export of a sample book.**

**M7 — Import + templates (Phase 2 start).** Markdown + DOCX import with a review step; full KDP trim presets + IngramSpark; house-style templates + a small starter library; front/back-matter scaffolding + auto-ToC.

## Definition of done for v1
A non-technical user can **import a manuscript, choose a KDP 6×9 preset, see a live page-accurate preview, and export a PDF that passes KDP's Print Previewer on first upload** — while a technical user can open the LaTeX pane, read clean generated source, and tweak via Raw-LaTeX blocks.

## Engineering practices
- TypeScript strict; Rust with `clippy` clean.
- Unit tests for `latexgen` (golden files) and the preflight validator; an integration test that compiles the sample book end-to-end.
- Keep trim/margin/preset data **data-driven** (a presets file), never hardcoded across modules, so print-spec changes are one-file edits.
- Ship with **open-licensed default fonts** (e.g. EB Garamond, Libertinus, Source Serif) to avoid embedding-license issues.
- Commit per milestone with a short README section documenting how to run.

Start by scaffolding M0 and confirming the app launches, then proceed through the milestones, pausing at the marked checkpoints.
