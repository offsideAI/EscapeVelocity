/** Left dock — the book outline/binder. Placeholder until M3. */
export function StructurePane() {
  return (
    <div className="ev-pane">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Structure</span>
        <span className="ev-pane__header-spacer" />
      </header>
      <div className="ev-pane__body">
        <div className="ev-empty">
          <div className="ev-empty__title">No document open</div>
          <div className="ev-empty__hint">
            The book outline — front matter, chapters, back matter — appears here,
            drag-to-reorder. <span className="ev-kbd">M3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
