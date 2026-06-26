/** Right dock — page-true PDF preview (M1).
 *  Renders the compiled PDF with PDF.js, one canvas per page, scaled to fit the
 *  pane width (true trim aspect ratio preserved). SyncTeX click-to-jump is M4. */
import { useEffect, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { compileStore, useCompile } from "../../compile/store";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export function PreviewPane() {
  const pdf = useCompile((s) => s.pdf);
  const status = useCompile((s) => s.status);
  const error = useCompile((s) => s.error);
  const pageCount = useCompile((s) => s.pageCount);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;

    (async () => {
      // Copy: PDF.js takes ownership of the buffer and may detach it.
      const doc = await pdfjs.getDocument({ data: pdf.slice() }).promise;
      if (cancelled) return;
      compileStore.setPageCount(doc.numPages);

      const pagesEl = pagesRef.current;
      const scrollEl = scrollRef.current;
      if (!pagesEl || !scrollEl) return;
      pagesEl.replaceChildren();

      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.max(120, scrollEl.clientWidth - 40);

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (targetWidth / base.width) * dpr;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.className = "ev-page";
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        pagesEl.appendChild(canvas);
      }
    })().catch((e) => {
      if (!cancelled) console.error("[preview] render failed", e);
    });

    return () => {
      cancelled = true;
    };
  }, [pdf]);

  const showOverlay = !pdf || status === "error";

  return (
    <div className="ev-pane">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Preview</span>
        <span className="ev-pane__header-spacer" />
        {pageCount != null && pdf && <span className="ev-pane__meta">{pageCount} pp</span>}
      </header>
      <div className="ev-preview" ref={scrollRef}>
        <div className="ev-preview__pages" ref={pagesRef} hidden={showOverlay} />
        {showOverlay && (
          <div className="ev-empty">
            {status === "error" ? (
              <>
                <div className="ev-empty__title" style={{ color: "var(--ev-error)" }}>
                  Compile failed
                </div>
                <div className="ev-empty__hint">{error}</div>
              </>
            ) : status === "compiling" ? (
              <div className="ev-empty__title">Compiling…</div>
            ) : (
              <>
                <div className="ev-empty__title">Page-true preview</div>
                <div className="ev-empty__hint">
                  Compiled by Tectonic, rendered at the real trim size. Edit the LaTeX
                  view and recompile to see it update.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
