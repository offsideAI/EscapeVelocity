/** App state for the generate→compile→preview loop (M2).
 *
 *  The **document** (+ settings) is the source of truth. On change it is sent to
 *  Rust `latexgen` to produce clean `.tex` (shown read-only in the LaTeX view),
 *  which is then compiled to a PDF. Edits debounce (~600 ms); in-flight runs are
 *  superseded by newer ones. (The visual block editor replaces the JSON view in
 *  M3; the LaTeX view becomes CodeMirror with editable Raw-LaTeX in M4.) */
import { useSyncExternalStore } from "react";
import { compileLatex, generateLatex, getDefaultSettings, isTauri } from "./api";
import type { Document, Settings } from "../model/types";
import sampleDocument from "../fixtures/sample.document.json";

export type CompileStatus = "idle" | "compiling" | "ok" | "error";

export interface AppState {
  /** Editable document.json text (M2 Structured view). */
  docJson: string;
  document: Document | null;
  docError: string | null;
  settings: Settings | null;
  /** Generated LaTeX, shown read-only in the LaTeX view. */
  tex: string;
  status: CompileStatus;
  error: string | null;
  pdf: Uint8Array | null;
  pageCount: number | null;
  ranAt: number | null;
}

const DEBOUNCE_MS = 600;
const NOT_TAURI = "Run the desktop app (`npm run tauri dev`) to generate and preview.";

let state: AppState = {
  docJson: JSON.stringify(sampleDocument, null, 2),
  document: sampleDocument as Document,
  docError: null,
  settings: null,
  tex: "",
  status: "idle",
  error: null,
  pdf: null,
  pageCount: null,
  ranAt: null,
};

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

  /** Replace the document (from the structured editor) and schedule a rebuild. */
  setDocument(doc: Document): void {
    set({ document: doc, docJson: JSON.stringify(doc, null, 2), docError: null });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compileStore.build(), DEBOUNCE_MS);
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

// Dev-only inspection hook for the console / automation (stripped in builds).
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __evStore?: typeof compileStore }).__evStore = compileStore;
}
