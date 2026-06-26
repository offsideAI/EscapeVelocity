/** Center dock — the editor. Toggles between the Structured (block) view and
 *  the generated LaTeX source view. Both are placeholders until M3/M4. */
import { useWorkspace, workspace } from "../../workspace/store";

export function EditorPane() {
  const view = useWorkspace((s) => s.editorView);

  return (
    <div className="ev-pane ev-pane--center">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Editor</span>
        <span className="ev-pane__header-spacer" />
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
      <div className="ev-pane__body">
        <div className="ev-empty">
          <div className="ev-empty__title">
            {view === "structured" ? "Structured editor" : "LaTeX source"}
          </div>
          <div className="ev-empty__hint">
            {view === "structured"
              ? "Write in semantic blocks — Body, Chapter Title, Block Quote, Verse, Figure… "
              : "Clean, generated memoir LaTeX with SyncTeX jumps and editable Raw-LaTeX blocks. "}
            <span className="ev-kbd">{view === "structured" ? "M3" : "M4"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
