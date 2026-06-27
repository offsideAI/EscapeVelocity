/** Center dock — the editor.
 *  M3: **Structured** view is the visual block editor (TipTap); the author writes
 *  in semantic blocks and never sees code. **LaTeX** view shows the generated
 *  source read-only (it becomes CodeMirror with editable Raw-LaTeX blocks in M4).
 *  The document is the source of truth; LaTeX is generated. */
import { useWorkspace, workspace } from "../../workspace/store";
import { useCompile } from "../../compile/store";
import { StructuredEditor } from "../../editor/StructuredEditor";

export function EditorPane() {
  const view = useWorkspace((s) => s.editorView);
  const tex = useCompile((s) => s.tex);
  const status = useCompile((s) => s.status);

  return (
    <div className="ev-pane ev-pane--center">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Editor</span>
        <span className="ev-pane__header-spacer" />
        {status === "compiling" && <span className="ev-pane__meta">typesetting…</span>}
        {view === "structured" && <span className="ev-pane__meta">type “/” for styles</span>}
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
        <StructuredEditor />
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
