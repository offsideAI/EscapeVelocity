# EscapeVelocity — Product Requirements Document (PRD)

**A typesetting & page-layout editor for book authors and self-publishers.**
*"PageMaker's flow, LaTeX's typography, Zed's craft."*

---

## 1. Summary

EscapeVelocity is a cross-platform desktop application that lets an author lay out and typeset an entire book — interior pages, not just prose — and export a print-ready PDF (and later EPUB) suitable for Amazon KDP, IngramSpark, and similar platforms.

It occupies a deliberate middle ground:

- **Above** Microsoft Word / Google Docs, whose page models are flow-approximations that produce amateur-looking interiors (bad rivers, no real hyphenation/justification, weak widow/orphan control, fonts that don't embed cleanly).
- **Below** the cliff of raw LaTeX / Overleaf, which produces beautiful results but demands the author learn a programming language and a 40-year-old macro ecosystem.
- **Alongside** Vellum (the Mac-only incumbent), but cross-platform, with finer typographic control, and — crucially — with the generated source **visible and editable**, so the author is never locked out of the output and never locked into our app.

The product feels like the Zed editor: native, fast, dark by default, keyboard-first, quiet, no "Christmas-tree" toolbars. Underneath, every visual action emits clean LaTeX, which compiles to a live page-accurate preview at the real trim size.

---

## 2. Problem statement

Self-publishing has exploded, but interior typesetting is still the most underestimated and most damaging step. A broken layout reaches every reader and generates formatting-related one-star reviews that are very hard to recover from. Authors today choose between three bad options:

1. **Word/Docs** — familiar but structurally wrong for books. Margins and gutters are guesswork, justification is crude, font embedding is unreliable, and the output reads as self-published at a glance.
2. **LaTeX/Overleaf** — produces professional results but is code-first and intimidating. Most authors cannot and will not learn it.
3. **Vellum/Atticus/Reedsy** — closer to the right idea, but Vellum is Mac-only and opinionated (you take its templates or leave them), and the web tools trade typographic quality for convenience. None expose the underlying typesetting source, so the author can't fine-tune and can't take the output elsewhere.

There is no tool that gives a non-technical author **LaTeX-grade typography through a visual, document-structured interface, on any OS, with the code visible as an escape hatch rather than a wall.**

---

## 3. Goals and non-goals

### Goals (v1)
- Let an author structure and write a complete book (front matter → body → back matter) in a visual, semantic editor.
- Generate clean, human-readable LaTeX deterministically from that structure, shown live and editable in a code pane.
- Provide a **PageSetting inspector**: trim size, margins/gutter, bleed, fonts, leading, chapter styles, running heads, folios — all GUI controls that map to LaTeX preamble.
- Render a **live, page-accurate PDF preview** at the chosen trim size, with correct pagination, running heads, and page numbers.
- Export a **KDP-compliant print-ready PDF** (embedded fonts, correct page size incl. optional bleed, no crop marks, even page count).
- Ship **dark-mode-first**, reproducing the Zed visual language and interaction feel.
- Run on **macOS, Windows, and Linux**.

### Non-goals (v1)
- Pixel-precise free-form page layout (drag-anywhere text boxes, illustrated children's-book spreads). EscapeVelocity is **flow-based typesetting** for text-forward books; fixed layout is explicitly out of scope for v1.
- Cover design (KDP cover is a separate artifact with its own bleed/spine math; EscapeVelocity does *interiors*. A cover-spine calculator is a later "nice-to-have," not core.)
- Full bidirectional WYSIWYG↔LaTeX parsing (round-tripping arbitrary hand-written LaTeX back into the visual model). See §6 for the deliberate scoping decision that avoids this.
- Collaborative real-time editing, cloud sync, or an account system (local-first in v1).
- A general-purpose LaTeX IDE. EscapeVelocity targets books, not papers, theses, or slides.

---

## 4. Target users & personas

**Primary: the self-publishing author (non-technical).**
Has a finished manuscript in Word/Docs. Wants a professional interior without learning LaTeX or paying a formatter $300/book. Cares about: chapter-opening style, readable body type, a clean title page, correct KDP trim and margins, and *not* embarrassing themselves. Will never open the LaTeX pane unless gently invited — but is reassured it exists.

**Secondary: the technical / "prosumer" author.**
Comfortable with Markdown or light code. Wants the visual speed of a structured editor but reaches into the LaTeX pane to tune kerning, add a custom environment, or drop in a package. EscapeVelocity's escape hatch is the reason this user picks it over Vellum.

**Tertiary: the small/indie publisher or book formatter.**
Formats many books. Wants reusable house styles (templates), batch-consistent output, and trustworthy KDP/IngramSpark presets. Values that the output is portable LaTeX they own.

---

## 5. Product principles

1. **WYSIWYM, not WYSIWYG.** The author edits *meaning* (this is a Chapter Title, this is a Block Quote, this is a Figure), and EscapeVelocity owns the *appearance* via a typeset style. This is what makes LaTeX-quality output achievable from a simple UI, and it's genuinely *better* for flowing-text books than drag-a-textbox layout.
2. **The code is always visible, never required.** The LaTeX pane is a first-class citizen and an escape hatch — not a thing you're forced through.
3. **Page-true preview is the payoff.** The PageMaker magic is seeing real pages — real pagination, real running heads, real widows — at the real trim size, updating as you work.
4. **The author owns the output.** Generated LaTeX and the compiled PDF belong to the user, are portable, and carry no lock-in.
5. **Zed-grade craft.** Native speed, dark-first, keyboard-driven, calm UI, command palette, no clutter.
6. **Print-correctness is a feature, not an afterthought.** KDP/IngramSpark rules (trim, gutter-by-page-count, bleed, font embedding, even page count, no crop marks) are encoded as presets and validated before export.

---

## 6. The core UX model

A three-pane workspace (all panes dockable/collapsible, Zed-style):

### Pane A — Document structure (left)
A binder/outline tree of the book: front matter (half-title, title page, copyright, dedication, epigraph, ToC), body (parts → chapters → sections), back matter (acknowledgments, about the author, also-by). Drag to reorder. Each node is a semantic container, not a page.

### Pane B — Editor (center) — the heart of the product
Two coupled views, toggle or split:

- **Structured view (default):** a clean prose editor where text carries *semantic styles* applied from a small, curated palette — Body, Chapter Title, Heading 2/3, Block Quote, Verse, Figure + caption, Footnote, Scene Break, Pull Quote, Raw-LaTeX block. No font pickers, no manual spacing. It reads like writing in a calm editor, not formatting in Word.
- **LaTeX source view:** the generated `.tex`, syntax-highlighted (tree-sitter LaTeX grammar), with a Zed-like theme. Read-mostly, but editable in defined ways (see scoping decision below). Click a line → preview scrolls to it (SyncTeX).

> **Critical scoping decision — direction of truth.** The **structured model is the single source of truth for content.** It *generates* LaTeX deterministically. We do **not** attempt to parse arbitrary hand-written LaTeX back into the structured model (that's the impossible general case). Instead:
> - Document-level typesetting (preamble) is owned by the **PageSetting inspector** and regenerated from settings.
> - Per-author raw control is provided via an explicit **Raw-LaTeX block**: a verbatim passthrough region the author can type LaTeX into, which is preserved exactly and round-trips losslessly because it's stored as-is.
> - This gives "code visible + editable where it matters" without the unsolvable round-trip problem. It is the difference between a shippable v1 and a research project.

### Pane C — Live page preview (right)
The compiled PDF rendered page-by-page at the actual trim size, showing true pagination, running heads, folios, and widow/orphan behavior. Incrementally recompiled (debounced) on edit. Click a page → jump to the source/structure location. A status strip shows page count (and flags odd counts that need a blank page for KDP), compile status, and any TeX warnings in plain language ("a heading fell on the last line of a page").

### The PageSetting inspector (a panel, invoked from the toolbar/command palette)
The GUI for document-wide typesetting. Every control maps to LaTeX preamble:

| Control group | Settings | Maps to |
|---|---|---|
| **Trim & geometry** | Trim size (KDP presets + custom), inside/outside/top/bottom margins, gutter (auto-suggested from page count), bleed on/off | `memoir` stock/trim (`\setstocksize`, `\settrimmedsize`, `\settrims`) + margin setup |
| **Body type** | Font (system/OTF via fontspec), size, leading, measure, justification, hyphenation, microtype protrusion | `fontspec`, `\linespread`, `microtype` |
| **Paragraphs** | Indent vs. spaced, first-paragraph-no-indent, widow/orphan control | `\setlength`, `\clubpenalty`/`\widowpenalty` |
| **Chapter openings** | Style (plain / drop-cap / versal / ornament / small-caps first line), drop folio on chapter page, recto-start | `memoir` chapter styles |
| **Running heads & folios** | Verso/recto content, page-number style & position, suppress on chapter pages | `memoir` page styles |
| **Front/back matter** | Toggle & order standard pages, auto-ToC | scaffolding macros |
| **Output preset** | KDP Paperback 6×9 / 5×8 / 5.5×8.5 / 8.5×11, IngramSpark, custom, (EPUB later) | bundles all of the above + export rules |

---

## 7. Functional requirements

### 7.1 Authoring
- Import a manuscript from **DOCX and Markdown** (map Word styles → semantic styles; flag ambiguous styles for review). *(Plain paste also supported.)*
- Apply semantic styles via keyboard shortcuts and a slash/command menu.
- Insert figures (image + caption), with 300 DPI guidance and automatic placement.
- Footnotes/endnotes, block quotes, verse/poetry, scene breaks, pull quotes.
- Spell-check; word/page count.
- Raw-LaTeX block for power users (verbatim passthrough).

### 7.2 LaTeX generation
- Deterministic, **clean, readable** LaTeX output (not minified spaghetti) using **`memoir`** as the default book class.
- Engine: **XeLaTeX-class compilation** so system/OTF fonts and full Unicode work via `fontspec`; `microtype` for protrusion.
- Preamble generated entirely from PageSetting settings; body generated from the structured model; raw blocks passed through.
- Generated `.tex` is exportable and self-contained (or with assets in a folder) so the author can compile it anywhere.

### 7.3 Preview & compilation
- Embedded LaTeX engine: **Tectonic** (self-contained, Rust, XeTeX-based, auto-fetches packages) so users need **no separate TeX install**.
- Incremental, debounced recompile; cancellable; never blocks typing.
- **SyncTeX** mapping for click-to-jump both directions (source ↔ page).
- Compile errors surfaced as **plain-language diagnostics** with a "show raw log" affordance, mapped back to the structured element where possible.

### 7.4 Export & print-correctness
- **Print-ready PDF** with: correct page size (trim, or trim + 0.125″ bleed when enabled), **all fonts embedded/subset**, **no crop marks**, images ≥ 300 DPI, **even page count** (auto-insert blank verso where needed), file under platform size limits.
- **Pre-export validator** ("KDP preflight"): checks trim vs. preset, gutter adequacy for page count, font embedding, image DPI, odd-page count, stray crop marks/transparency, and lists fixes before export.
- Export the **`.tex` source + assets** bundle.
- *(Later)* EPUB export from the same structured model.

### 7.5 Projects, templates & settings
- Local-first **project format**: a `.escvel` folder (or zipped bundle) containing the structured document (JSON), settings, assets, and generated `.tex`. Human-inspectable, diffable, git-friendly.
- **House-style templates**: save/share a complete PageSetting + style configuration; ship a starter set (Literary Fiction 5×8, Nonfiction 6×9, Memoir 5.5×8.5, etc.).
- Autosave + local version history.

### 7.6 UI / aesthetic
- **Dark mode by default**, light theme available; reproduce Zed's color tokens, typography, spacing, and quiet chrome.
- **Command palette** (Zed-style), keyboard-first, minimal toolbars.
- Dockable/collapsible panes; remembered layout.

---

## 8. Technical architecture — and what "reuse Zed" should actually mean

This is the most important engineering section, because the request to "fork Zed and reuse as much source as possible" runs into a hard licensing fact.

### 8.1 The licensing reality
- **Zed's editor codebase is GPL-3.0-or-later (copyleft).** Forking it makes EscapeVelocity a derivative work that must *also* be GPL-3.0 and source-available. That's fine for an open-source project, but it forecloses a closed-source/commercial model.
- **GPUI (Zed's GPU UI framework) is Apache 2.0 (permissive).** You may build a brand-new application on GPUI and license it however you want.
- Practical translation: **don't fork the GPL editor crate. Reuse the *aesthetic* and, optionally, *GPUI itself*.** You get the Zed look and the "renders like a video game" performance without inheriting either GPL obligations *or* the enormous, irrelevant scope of a full code editor.

### 8.2 Two viable stacks

**Stack A — Tauri + web frontend (recommended for the MVP).**
- **Shell:** Tauri (Rust backend + system webview) → small native binaries, all three OSes.
- **Frontend:** a UI that *reproduces Zed's visual language* (Zed's theme is straightforward to mirror in CSS tokens). **CodeMirror 6** for the LaTeX source pane (tree-sitter LaTeX highlighting, Zed-like theme). A structured/block editor (e.g. ProseMirror/TipTap or a custom model) for the visual pane.
- **Preview:** **PDF.js** in the webview.
- **LaTeX engine:** **Tectonic**, invoked from the Rust side.
- **Why:** this is *actually shippable* on a realistic timeline, is license-clean (any license you want), and the proven Tectonic + PDF.js + CodeMirror combination de-risks the hardest parts. A document editor does not need GPUI's frame budget.

**Stack B — GPUI-native (the "north star," higher effort).**
- Rust + **GPUI** (Apache 2.0) for maximum native fidelity to Zed's feel; **Tectonic** for compilation; a Rust PDF renderer (pdfium/mupdf bindings) drawn into a GPUI surface for preview.
- **Caveat:** GPUI as a standalone, externally-consumed framework is comparatively young and sparsely documented; the LaTeX source pane would need a capable text editor on GPUI (Zed's own editor crate is **GPL** — avoid it; either accept GPL or build a lighter editor). This path buys the most authentic Zed feel at materially higher cost and risk.

**Recommendation:** Build the **MVP on Stack A**, reproducing Zed's aesthetic faithfully and (optionally) vendoring Zed's **Apache-2.0 theme definitions**. Treat **Stack B (GPUI-native)** as a possible v2 rewrite *if and only if* native fidelity becomes a competitive necessity — with the GPL caveat understood. The companion Claude Code prompt targets Stack A.

### 8.3 Engine note (acknowledged alternative)
**Typst** (MIT, Rust, near-instant incremental compile, far simpler than LaTeX) would slot beautifully into this stack and would make the live preview faster. Per the explicit requirement, **LaTeX (via Tectonic) is the v1 default** — LaTeX has the broader ecosystem, printer familiarity, and is what "code-visible" authors expect. Typst is worth keeping as a pluggable second engine on the roadmap, not as the v1 spec.

### 8.4 Component map (Stack A)
```
escapevelocity/
├─ src-tauri/                # Rust backend
│  ├─ compile/               # Tectonic invocation, caching, SyncTeX
│  ├─ project/               # .escvel load/save, autosave, history
│  ├─ import/                # DOCX/Markdown → structured model
│  ├─ export/                # PDF post-process, preflight validator
│  └─ latexgen/              # structured model → memoir LaTeX (the contract)
└─ src/                      # Frontend (TS/React)
   ├─ theme/                 # Zed-derived tokens, dark-first
   ├─ panes/structure/       # outline/binder
   ├─ panes/editor/          # structured (block) + LaTeX (CodeMirror) views
   ├─ panes/preview/         # PDF.js page-true preview, SyncTeX jumps
   ├─ inspector/             # PageSetting UI ↔ settings model
   └─ command-palette/
```

---

## 9. Roadmap (phased)

**Phase 0 — Skeleton (weeks 1–3).** Tauri shell, Zed-themed dark UI, three-pane layout, command palette, Tectonic embedded and compiling a hardcoded `memoir` doc to a PDF.js preview.

**Phase 1 — MVP "typeset a real book" (weeks 4–10).** Structured editor with the core style palette; deterministic `memoir` LaTeX generation; PageSetting inspector for trim/margins/gutter/font/leading/chapter style; live page-true preview with SyncTeX; one KDP preset (6×9); print-ready PDF export with embedded fonts, even-page fix, and a basic preflight validator. **Definition of done: a non-technical user can import a manuscript and export a KDP-acceptable 6×9 interior.**

**Phase 2 — Self-publisher polish (weeks 11–18).** DOCX import maturity; full KDP trim-size preset set + IngramSpark; front/back-matter scaffolding + auto-ToC; chapter-opening styles (drop caps, ornaments); house-style templates + starter library; richer preflight; plain-language diagnostics.

**Phase 3 — Reach (later).** EPUB export; Typst as alternate engine; cover/spine calculator; raw-LaTeX power features; optional cloud sync; possible GPUI-native rewrite (Stack B).

---

## 10. Success metrics
- **Time-to-first-export:** new user → KDP-acceptable PDF in < 30 minutes.
- **Preflight pass rate:** > 95% of exports pass KDP's Print Previewer on first upload.
- **Escape-hatch usage:** % of users who open the LaTeX pane (signal of trust, not failure) and % who edit it (prosumer adoption).
- **Retention:** authors who format a 2nd book in EscapeVelocity.
- **Quality proxy:** reduction in formatting-related review complaints (survey-based).

---

## 11. Risks & open questions
- **Compile latency on large books.** Tectonic recompiles can lag on 300-page books. Mitigation: incremental/partial compilation, draft-mode (single-pass), caching, and compiling only the visible chapter for preview where feasible. (This is also the strongest argument for keeping Typst on the roadmap.)
- **DOCX import fidelity.** Word styles are messy; mapping is heuristic. Mitigation: an import-review step rather than silent guessing.
- **The round-trip temptation.** Pressure to parse hand-edited LaTeX back into the model will recur. Hold the line on §6's direction-of-truth decision; expand the Raw-LaTeX-block surface instead.
- **GPUI maturity (if Stack B is ever pursued).** Externally consuming GPUI is still rough; budget accordingly.
- **Print-spec drift.** KDP/IngramSpark rules change. Keep presets data-driven and easy to update; don't hardcode geometry across the codebase.
- **Font licensing.** Embedding commercial fonts has license implications for distributed PDFs. Surface guidance; ship with open-licensed defaults (e.g. EB Garamond, Libertinus, Source Serif).

---

*End of PRD.*
