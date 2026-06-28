/** App state for the generate→compile→preview loop (M2).
 *
 *  The **document** (+ settings) is the source of truth. On change it is sent to
 *  Rust `latexgen` to produce clean `.tex` (shown read-only in the LaTeX view),
 *  which is then compiled to a PDF. Edits debounce (~600 ms); in-flight runs are
 *  superseded by newer ones. (The visual block editor replaces the JSON view in
 *  M3; the LaTeX view becomes CodeMirror with editable Raw-LaTeX in M4.) */
import { useSyncExternalStore } from "react";
import { compileLatex, fetchTemplate, generateLatex, getDefaultSettings, isTauri } from "./api";
import type { Document, Settings } from "../model/types";
import sampleDocument from "../fixtures/sample.document.json";

export type CompileStatus = "idle" | "compiling" | "ok" | "error";

export interface AppState {
  /** Editable document.json text (M2 Structured view). */
  docJson: string;
  document: Document | null;
  docError: string | null;
  /** Bumped only on external document replacement (import), so the editor reloads. */
  docVersion: number;
  settings: Settings | null;
  /** Generated LaTeX, shown read-only in the LaTeX view. */
  tex: string;
  status: CompileStatus;
  error: string | null;
  pdf: Uint8Array | null;
  pageCount: number | null;
  ranAt: number | null;
  /** One-shot SyncTeX jump signals; `key` retriggers identical targets. */
  jumpSource: { line: number; key: number } | null;
  jumpPreview: { page: number; yFrac: number; key: number } | null;
}

const DEBOUNCE_MS = 600;
const NOT_TAURI = "Run the desktop app (`npm run tauri dev`) to generate and preview.";

/** Mirror of Rust `default_settings("kdp_6x9")`. Used as the initial value so
 *  the inspector renders immediately; Rust overwrites it (identically) on init. */
const DEFAULT_SETTINGS: Settings = {
  output_preset: "kdp_6x9",
  trim: { width_in: 6, height_in: 9 },
  bleed: false,
  margins: { inside_in: 0.875, outside_in: 0.625, top_in: 0.9, bottom_in: 0.9 },
  body: {
    font: "ebgaramond",
    size_pt: 11,
    leading_pt: 14.5,
    justify: true,
    hyphenate: true,
    microtype: true,
  },
  paragraph: { style: "indent", suppress_first_indent: true, widow_orphan_penalty: 10000 },
  chapter: { kind: "plain", recto_start: true, drop_folio: true },
  running_heads: { enabled: true },
};

let state: AppState = {
  docJson: JSON.stringify(sampleDocument, null, 2),
  document: sampleDocument as Document,
  docError: null,
  docVersion: 0,
  settings: DEFAULT_SETTINGS,
  tex: "",
  status: "idle",
  error: null,
  pdf: null,
  pageCount: null,
  ranAt: null,
  jumpSource: null,
  jumpPreview: null,
};

let signalKey = 0;
const listeners = new Set<() => void>();
function set(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let runId = 0;

export const compileStore = {
  getState: (): AppState => state,
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  /** Load default settings from Rust, then do the first build. */
  async init(): Promise<void> {
    if (!isTauri()) {
      set({ status: "error", error: NOT_TAURI });
      return;
    }
    try {
      const settings = await getDefaultSettings("kdp_6x9");
      set({ settings });
      await compileStore.build();
    } catch (e) {
      set({ status: "error", error: String(e) });
    }
  },

  /** Update the document JSON; parse and (if valid) schedule a rebuild. */
  setDocJson(text: string): void {
    set({ docJson: text });
    try {
      const parsed = JSON.parse(text) as Document;
      set({ document: parsed, docError: null });
    } catch (e) {
      set({ docError: e instanceof Error ? e.message : String(e) });
      return; // don't build on invalid JSON
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compileStore.build(), DEBOUNCE_MS);
  },

  setPageCount(n: number): void {
    set({ pageCount: n });
  },

  /** Ask the LaTeX source pane to scroll to a generated-source line. */
  requestSourceJump(line: number): void {
    set({ jumpSource: { line, key: ++signalKey } });
  },

  /** Ask the preview to scroll to a page + vertical fraction. */
  requestPreviewJump(page: number, yFrac: number): void {
    set({ jumpPreview: { page, yFrac, key: ++signalKey } });
  },

  /** Replace the document (from the structured editor) and schedule a rebuild. */
  setDocument(doc: Document): void {
    set({ document: doc, docJson: JSON.stringify(doc, null, 2), docError: null });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compileStore.build(), DEBOUNCE_MS);
  },

  /** Replace the whole document (from import) — bumps docVersion so the editor
   *  reloads its content — and rebuild. */
  replaceDocument(doc: Document): void {
    set({
      document: doc,
      docJson: JSON.stringify(doc, null, 2),
      docError: null,
      docVersion: state.docVersion + 1,
    });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compileStore.build(), DEBOUNCE_MS);
  },

  /** Replace the PageSetting settings (from the inspector) and rebuild. */
  setSettings(settings: Settings): void {
    set({ settings });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compileStore.build(), DEBOUNCE_MS);
  },

  /** Switch the output preset: load its default settings from Rust, then rebuild. */
  async switchPreset(preset: string): Promise<void> {
    if (!isTauri()) return;
    try {
      const settings = await getDefaultSettings(preset);
      compileStore.setSettings(settings);
    } catch (e) {
      set({ status: "error", error: String(e) });
    }
  },

  /** Apply a house-style template (a complete settings starting point). */
  async applyTemplate(template: string): Promise<void> {
    if (!isTauri() || !template) return;
    try {
      const settings = await fetchTemplate(template);
      compileStore.setSettings(settings);
    } catch (e) {
      set({ status: "error", error: String(e) });
    }
  },

  /** Generate LaTeX from the current document + settings, then compile it. */
  async build(): Promise<void> {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (!isTauri()) {
      set({ status: "error", error: NOT_TAURI });
      return;
    }
    const { document, settings } = state;
    if (!document || !settings) return;

    const id = ++runId;
    set({ status: "compiling", error: null });
    try {
      const tex = await generateLatex(document, settings);
      if (id !== runId) return;
      set({ tex });
      const pdf = await compileLatex(tex);
      if (id !== runId) return;
      set({ status: "ok", pdf, error: null, ranAt: Date.now() });
    } catch (e) {
      if (id !== runId) return;
      set({ status: "error", error: String(e) });
    }
  },
};

export function useCompile<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    compileStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

// Dev-only inspection hooks for the console / automation (stripped in builds).
if (import.meta.env.DEV && typeof window !== "undefined") {
  const w = window as unknown as {
    __evStore?: typeof compileStore;
    __evSetTex?: (t: string) => void;
  };
  w.__evStore = compileStore;
  w.__evSetTex = (t: string) => set({ tex: t });
  (w as { __evSetPdf?: (b: number[]) => void }).__evSetPdf = (b: number[]) =>
    set({ pdf: new Uint8Array(b), status: "ok", error: null });
}
