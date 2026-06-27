/** Center dock — the editor.
 *  M2: **Structured** view edits `document.json` directly (an interim JSON view;
 *  the visual block editor replaces it in M3); **LaTeX** view shows the
 *  read-only generated source (it becomes CodeMirror with editable Raw-LaTeX
 *  blocks in M4). Either way the document is the source of truth — the LaTeX is
 *  generated, never hand-authored. */
import { useWorkspace, workspace } from "../../workspace/store";
import { compileStore, useCompile } from "../../compile/store";

export function EditorPane() {
  const view = useWorkspace((s) => s.editorView);
  const docJson = useCompile((s) => s.docJson);
  const docError = useCompile((s) => s.docError);
  const tex = useCompile((s) => s.tex);
  const status = useCompile((s) => s.status);

  return (
    <div className="ev-pane ev-pane--center">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Editor</span>
        <span className="ev-pane__header-spacer" />
        {view === "structured" && (
          <>
            <span className="ev-pane__meta">
              {docError ? (
                <span style={{ color: "var(--ev-error)" }}>invalid JSON</span>
              ) : (
                "document.json · visual editor in M3"
              )}
            </span>
            <button
              type="button"
              className="ev-iconbtn"
              title="Rebuild (⌘↵)"
              disabled={status === "compiling"}
              onClick={() => void compileStore.build()}
            >
              {status === "compiling" ? "Building…" : "Rebuild"}
            </button>
          </>
        )}
        <div className="ev-seg" role="tablist" aria-label="Editor view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "structured"}
            className={`ev-seg__btn${view === "structured" ? " ev-seg__btn--active" : ""}`}
            onClick={() => workspace.setEditorView("structured")}
          >
            Structured
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "latex"}
            className={`ev-seg__btn${view === "latex" ? " ev-seg__btn--active" : ""}`}
            onClick={() => workspace.setEditorView("latex")}
          >
            LaTeX
          </button>
        </div>
      </header>

      {view === "structured" ? (
        <textarea
          className="ev-latex-input"
          spellCheck={false}
          value={docJson}
          onChange={(e) => compileStore.setDocJson(e.target.value)}
        />
      ) : (
        <textarea
          className="ev-latex-input"
          spellCheck={false}
          readOnly
          value={tex || "% Generated LaTeX appears here once the document compiles."}
        />
      )}
    </div>
  );
}
