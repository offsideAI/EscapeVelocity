/** Right dock — page-true PDF preview. Placeholder until M1 (Tectonic + PDF.js). */
export function PreviewPane() {
  return (
    <div className="ev-pane">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Preview</span>
        <span className="ev-pane__header-spacer" />
      </header>
      <div className="ev-pane__body">
        <div className="ev-empty">
          <div className="ev-empty__title">Page-true preview</div>
          <div className="ev-empty__hint">
            Your book, compiled by Tectonic and rendered at the real trim size,
            updating as you write. <span className="ev-kbd">M1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
