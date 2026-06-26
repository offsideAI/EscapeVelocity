/** Center dock — the editor. M1 wires the **LaTeX** view to an editable source
 *  buffer that drives the compile→preview loop; the **Structured** view remains
 *  a placeholder until M3. The LaTeX view becomes a read-mostly CodeMirror pane
 *  (with editable Raw-LaTeX regions) in M4. */
import { useWorkspace, workspace } from "../../workspace/store";
import { compileStore, useCompile } from "../../compile/store";

export function EditorPane() {
  const view = useWorkspace((s) => s.editorView);
  const source = useCompile((s) => s.source);
  const status = useCompile((s) => s.status);

  return (
    <div className="ev-pane ev-pane--center">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Editor</span>
        <span className="ev-pane__header-spacer" />
        {view === "latex" && (
          <button
            type="button"
            className="ev-iconbtn"
            title="Compile (⌘↵)"
            disabled={status === "compiling"}
            onClick={() => void compileStore.compileNow()}
          >
            {status === "compiling" ? "Compiling…" : "Compile"}
          </button>
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

      {view === "latex" ? (
        <textarea
          className="ev-latex-input"
          spellCheck={false}
          value={source}
          onChange={(e) => compileStore.setSource(e.target.value)}
        />
      ) : (
        <div className="ev-pane__body">
          <div className="ev-empty">
            <div className="ev-empty__title">Structured editor</div>
            <div className="ev-empty__hint">
              Write in semantic blocks — Body, Chapter Title, Block Quote, Verse,
              Figure… <span className="ev-kbd">M3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
