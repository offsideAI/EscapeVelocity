/** Compile state: the current LaTeX source, the resulting PDF bytes, and the
 *  compile status. Edits debounce (~600 ms) into a recompile; in-flight compiles
 *  are superseded by newer ones (frontend-side cancellation — true engine
 *  cancellation is a later refinement). */
import { useSyncExternalStore } from "react";
import { compileLatex, isTauri } from "./api";
import { MEMOIR_SAMPLE } from "../fixtures/memoirSample";

export type CompileStatus = "idle" | "compiling" | "ok" | "error";

export interface CompileState {
  source: string;
  status: CompileStatus;
  error: string | null;
  pdf: Uint8Array | null;
  pageCount: number | null;
  ranAt: number | null;
}

const DEBOUNCE_MS = 600;

let state: CompileState = {
  source: MEMOIR_SAMPLE,
  status: "idle",
  error: null,
  pdf: null,
  pageCount: null,
  ranAt: null,
};

const listeners = new Set<() => void>();
function set(patch: Partial<CompileState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let runId = 0;

export const compileStore = {
  getState: (): CompileState => state,
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  /** Update the source and schedule a debounced recompile. */
  setSource(source: string): void {
    set({ source });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compileStore.compileNow(), DEBOUNCE_MS);
  },

  /** PDF.js reports the page count once the document is parsed. */
  setPageCount(n: number): void {
    set({ pageCount: n });
  },

  /** Compile immediately, cancelling any pending debounce. */
  async compileNow(): Promise<void> {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (!isTauri()) {
      set({
        status: "error",
        error:
          "Compilation runs in the desktop app. Launch it with `npm run tauri dev` to see the live preview.",
      });
      return;
    }
    const id = ++runId;
    set({ status: "compiling", error: null });
    try {
      const pdf = await compileLatex(state.source);
      if (id !== runId) return; // a newer compile superseded this one
      set({ status: "ok", pdf, error: null, ranAt: Date.now() });
    } catch (e) {
      if (id !== runId) return;
      set({ status: "error", error: String(e) });
    }
  },
};

export function useCompile<T>(selector: (s: CompileState) => T): T {
  return useSyncExternalStore(
    compileStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
