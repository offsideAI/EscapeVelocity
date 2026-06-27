/** Minimal external store for workspace/layout state.
 *
 *  Deliberately dependency-free: a tiny pub/sub exposed to React via
 *  `useSyncExternalStore`, and to non-React callers (keymap handlers, commands)
 *  via plain methods. Layout *sizes* are persisted by react-resizable-panels'
 *  `autoSaveId`; this store only tracks coarse visibility/mode + theme. */
import { useSyncExternalStore } from "react";
import { applyTheme, getStoredTheme, type ThemeName } from "../theme/tokens";

export type EditorView = "structured" | "latex";
export type LeftTab = "structure" | "settings";

export interface WorkspaceState {
  structureVisible: boolean;
  previewVisible: boolean;
  editorView: EditorView;
  leftTab: LeftTab;
  theme: ThemeName;
  paletteOpen: boolean;
}

let state: WorkspaceState = {
  structureVisible: true,
  previewVisible: true,
  editorView: "structured",
  leftTab: "structure",
  theme: getStoredTheme(),
  paletteOpen: false,
};

const listeners = new Set<() => void>();

function set(patch: Partial<WorkspaceState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const workspace = {
  getState: (): WorkspaceState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  toggleStructure: () => set({ structureVisible: !state.structureVisible }),
  togglePreview: () => set({ previewVisible: !state.previewVisible }),
  setLeftTab: (leftTab: LeftTab) => set({ leftTab }),
  openInspector: () => set({ leftTab: "settings", structureVisible: true }),
  setEditorView: (editorView: EditorView) => set({ editorView }),
  toggleEditorView: () =>
    set({ editorView: state.editorView === "structured" ? "latex" : "structured" }),
  toggleTheme: () => {
    const theme: ThemeName = state.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    set({ theme });
  },
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () => set({ paletteOpen: !state.paletteOpen }),
};

/** Subscribe to a slice of workspace state. Selectors must return primitives
 *  (or stable refs) so `useSyncExternalStore` doesn't loop. */
export function useWorkspace<T>(selector: (s: WorkspaceState) => T): T {
  return useSyncExternalStore(
    workspace.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
