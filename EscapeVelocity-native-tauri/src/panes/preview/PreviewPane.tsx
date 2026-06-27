/** Right dock — page-true PDF preview (M1) with SyncTeX click-to-jump (M4).
 *  Renders the compiled PDF with PDF.js. Clicking a page jumps the LaTeX source
 *  pane to the matching line; a source click scrolls here (via the jump signal). */
import { useEffect, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { compileStore, useCompile } from "../../compile/store";
import { synctexInverse } from "../../compile/api";
import { workspace } from "../../workspace/store";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export function PreviewPane() {
  const pdf = useCompile((s) => s.pdf);
  const status = useCompile((s) => s.status);
  const error = useCompile((s) => s.error);
  const pageCount = useCompile((s) => s.pageCount);
  const jump = useCompile((s) => s.jumpPreview);
  const jumpKey = jump?.key;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;

    (async () => {
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
        canvas.dataset.page = String(i);
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

  // Source → preview: scroll to the page + vertical fraction, with a brief flash.
  useEffect(() => {
    const scroller = scrollRef.current;
    const pages = pagesRef.current;
    if (!scroller || !pages || !jump) return;
    const canvas = pages.children[jump.page - 1] as HTMLElement | undefined;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const sRect = scroller.getBoundingClientRect();
    const targetY =
      scroller.scrollTop + (cRect.top - sRect.top) + jump.yFrac * cRect.height - scroller.clientHeight / 2;
    scroller.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    canvas.classList.add("ev-page--flash");
    const id = setTimeout(() => canvas.classList.remove("ev-page--flash"), 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpKey]);

  // Preview → source: click a page → jump the LaTeX pane to the matching line.
  const onClick = async (e: React.MouseEvent) => {
    const canvas = (e.target as HTMLElement).closest(".ev-page") as HTMLCanvasElement | null;
    if (!canvas) return;
    const page = Number(canvas.dataset.page);
    if (!page) return;
    const rect = canvas.getBoundingClientRect();
    const yFrac = (e.clientY - rect.top) / rect.height;
    const line = await synctexInverse(page, yFrac);
    if (line != null) {
      workspace.setEditorView("latex");
      compileStore.requestSourceJump(line);
    }
  };

  const showOverlay = !pdf || status === "error";

  return (
    <div className="ev-pane">
      <header className="ev-pane__header">
        <span className="ev-pane__title">Preview</span>
        <span className="ev-pane__header-spacer" />
        {pageCount != null && pdf && <span className="ev-pane__meta">{pageCount} pp</span>}
      </header>
      <div className="ev-preview" ref={scrollRef}>
        <div className="ev-preview__pages" ref={pagesRef} hidden={showOverlay} onClick={onClick} />
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
                  Compiled by Tectonic, rendered at the real trim size. Click a page to jump to
                  its source.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
