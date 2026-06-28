⏺ Confirmed — and it's actually doing real work here, not just a precaution. Evidence:

  1. It doesn't touch vite.config.ts. The pattern is .vite/ (trailing slash), so it only matches a directory named .vite. Verified: vite.config.ts is not ignored and is still tracked.
  2. There's a genuine .vite/ in your repo — EscapeVelocity-native-tauri/.vite/deps/ (Vite's dependency pre-bundle cache: _metadata.json + package.json, ~8 KB). It's regenerated on every dev
  run and was never tracked. This is exactly the kind of throwaway cache .gitignore should catch.

  So .vite/ is safe and correct — keep it.

  Quick why-this-matters: Vite's pre-bundle cache normally lives at node_modules/.vite/ (covered by node_modules/), but in some setups (like this one) it resolves to a project-root .vite/.
  Without the .vite/ rule, that cache would show up as untracked and could get committed by accident. It's in the official Vite .gitignore template for the same reason.

  Net: nothing to change. The only thing in your .gitignore I'd call genuinely optional is *.pem (only matters if you ever drop certs/keys in the tree) — harmless to keep.

✻ Churned for 1m 18s

❯ Please help me manually test what has been implemented and walk me through the steps for running and testing (Please do not run anything yourself. Please tell me the steps only and I will
  run manually in a separate terminal).

⏺ Here's a complete manual test walkthrough. Run everything in your own terminal — I won't execute anything.

  A. One-time setup

  All commands run from the app folder:

  cd /Users/coder/repos/offsideai/githubrepos_workspace_active_1/OffsideIDE/EscapeVelocity-native-tauri

  1. Check toolchain (you already have these, but to confirm):
  node --version    # ≥ 18
  cargo --version   # Rust stable
  xcode-select -p   # Xcode CLT present
  2. Native deps for Tectonic (already installed on this machine — only needed on a fresh box):
  brew install harfbuzz graphite2 freetype libpng fontconfig icu4c
  3. Install JS deps:
  npm install

  You do not need to set PKG_CONFIG_PATH — .cargo/config.toml handles it.

  B. Run the app

  npm run tauri dev

  - The first run compiles the Rust/Tectonic stack — could take a few minutes. Later runs are fast.
  - A native window titled EscapeVelocity opens. Within ~1–2s the right pane should show the sample book typeset in EB Garamond (a "Preface" page).
  - Stop with Ctrl-C in the terminal (or close the window).

  ▎ If the preview ever says "Compile failed / halted on a recoverable error" on first compile, the offline Tectonic cache is cold. Warm it once (needs network), then restart npm run tauri
  ▎ dev:
  ▎ cargo run --manifest-path src-tauri/Cargo.toml --example prewarm_cache

  C. Feature checklist (in the running app)

  M0 — shell & theme
  - [ ] Three panes: Structure/Settings (left), Editor (center), Preview (right).
  - [ ] Press ⌘⇧P → command palette opens; type "theme", Enter → light/dark flips.
  - [ ] ⌘1 hides/shows the left pane; ⌘2 the preview; ⌘⇧T toggles theme.
  - [ ] Drag the dividers between panes — they resize and the layout persists across restarts.

  M1/M3 — write visually, see it typeset
  - [ ] In the center editor (Structured tab), click into a paragraph and type — after ~0.6s the preview re-typesets.
  - [ ] Type / at the start of an empty line → slash menu; type "verse"/"pull"/"quote", Enter → block style applies.
  - [ ] Block shortcuts: ⌘⌥1 chapter title, ⌘⌥Q block quote, ⌘⌥V verse, ⌘⌥P pull quote, ⌘⌥0 scene break, ⌘⌥R raw-LaTeX.
  - [ ] Marks: select text, ⌘B bold, ⌘I italic, ⌘⇧K small caps.
  - [ ] Add a new Chapter Title (⌘⌥1) → it appears in the Structure outline (left) and as a new chapter in the preview.
    - Note: the editor edits the body; the sample's "Preface" (front matter) and "About the Author" (back matter) show in the preview but not in the editor — that's by design.

  M4 — LaTeX source + SyncTeX
  - [ ] Click the LaTeX tab (or ⌘⇧L) → CodeMirror shows the clean generated source, syntax-highlighted, read-only.
  - [ ] Click anywhere on a preview page → the LaTeX view switches in and scrolls/highlights the matching source line.
  - [ ] Switch to LaTeX view, click a line → the preview scrolls to that page.

  M5 — PageSetting inspector
  - [ ] Click the Settings tab (left), or ⌘,.
  - [ ] Change Font (e.g. EB Garamond → Libertinus) → the whole book re-typesets in the new font.
  - [ ] Change Size, Leading, margins, toggle Justify/Hyphenate → preview updates.
  - [ ] Change Preset to a different KDP trim (e.g. 5 × 8) → the page size changes.
  - [ ] Pick a Template (e.g. "Literary Fiction · 5 × 8") → font + trim + type all change at once.

  M6 — export + KDP preflight
  - [ ] Click Export (title bar) or ⌘E → dialog runs preflight; all checks should be green ✓ (trim, gutter, fonts embedded, even pages, …).
  - [ ] Click Export PDF… → save dialog → save as e.g. ~/Desktop/book.pdf.
  - [ ] Open the saved PDF (Preview.app). Confirm: opens fine, even page count, 6×9 page size, text in EB Garamond. (Check fonts via Preview → Tools → Show Inspector → the font/"i" tab, or
  mdls book.pdf.)
  - [ ] Click Export LaTeX… → saves a main.tex you can compile anywhere.

  M7 — import
  - [ ] Click Import (title bar) or ⌘⇧I.
  - [ ] Paste some Markdown, e.g.:
  # The Crossing

  It was a **dark** and *stormy* night.

  ## Departure

  They left at dawn.

  > Nothing good comes easy.

  ---

  And so it began.
  - [ ] The Review line shows "1 chapter(s), 1 heading(s), 3 paragraph(s)".
  - [ ] Click Import → the editor + outline + preview replace with your imported manuscript (bold/italic preserved).
  - [ ] Or click Open .md file… to import from a file.

  D. (Optional) Run the automated tests

  From the app folder:

  # Rust: golden, compile, SyncTeX, export tests (offline; ~30s)
  cargo test --manifest-path src-tauri/Cargo.toml

  # Rust lint
  cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets

  # Frontend type-check + bundle
  npm run build

  Expected: all tests pass, clippy clean, build succeeds.

  E. (Optional) Build a release installer

  npm run prewarm        # warm the bundled offline cache (needs network once, ~1 min)
  npm run tauri build    # produces a .app / .dmg under src-tauri/target/release/bundle/

  ---
  If anything doesn't behave as described, copy the terminal output (or the in-app error text) back to me and I'll diagnose. The most likely snag is the cold-cache case in B — the prewarm
  command there fixes it.
