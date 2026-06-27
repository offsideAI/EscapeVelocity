/** Export dialog (M6): runs the KDP preflight, lists pass/fix for each rule, and
 *  exports a print-ready PDF (even page count, embedded fonts) or the portable
 *  LaTeX source. Hard failures block the PDF export (we don't silently "fix"
 *  structure); warnings (like an odd page count, auto-fixed on export) don't. */
import { useEffect, useState } from "react";
import { useWorkspace, workspace } from "../workspace/store";
import { compileStore } from "../compile/store";
import {
  chooseSavePath,
  exportPdf,
  exportTex,
  isTauri,
  runPreflight,
  type PreflightReport,
} from "../compile/api";

const GLYPH = { pass: "✓", warn: "!", fail: "✕" } as const;

export function ExportDialog() {
  const open = useWorkspace((s) => s.exportOpen);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReport(null);
      setMessage(null);
      return;
    }
    const { document, settings } = compileStore.getState();
    if (!isTauri() || !document || !settings) {
      // Dev preview of the report shape when the engine isn't available.
      if (import.meta.env.DEV) {
        setReport({
          page_count: 6,
          checks: [
            { label: "Trim matches preset", status: "pass", detail: "6 × 9 in", fix: null },
            { label: "Gutter adequate for page count", status: "pass", detail: "inside margin 0.875 in; KDP needs ≥ 0.375 in at 6 pages", fix: null },
            { label: "All fonts embedded", status: "pass", detail: "every font is embedded/subset", fix: null },
            { label: "Even page count", status: "pass", detail: "6 pages", fix: null },
            { label: "Images ≥ 300 DPI", status: "pass", detail: "no raster images in the document", fix: null },
            { label: "No crop marks or transparency", status: "pass", detail: "none emitted", fix: null },
          ],
        });
        setMessage("Preview only — run the desktop app to export.");
        return;
      }
      setMessage("Export runs in the desktop app (`npm run tauri dev`).");
      return;
    }
    setLoading(true);
    runPreflight(document, settings)
      .then(setReport)
      .catch((e) => setMessage(String(e)))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const exportPdfNow = async () => {
    const { document, settings } = compileStore.getState();
    if (!document || !settings) return;
    const path = await chooseSavePath("book.pdf", "pdf", "PDF");
    if (!path) return;
    setMessage("Exporting PDF…");
    try {
      const info = await exportPdf(document, settings, path);
      setMessage(
        `Exported ${info.page_count} pages${info.blank_added ? " (blank verso added)" : ""} → ${path}`,
      );
    } catch (e) {
      setMessage(`Export failed: ${e}`);
    }
  };

  const exportTexNow = async () => {
    const { document, settings } = compileStore.getState();
    if (!document || !settings) return;
    const path = await chooseSavePath("main.tex", "tex", "LaTeX source");
    if (!path) return;
    try {
      await exportTex(document, settings, path);
      setMessage(`LaTeX exported → ${path}`);
    } catch (e) {
      setMessage(`Export failed: ${e}`);
    }
  };

  const blocked = report?.checks.some((c) => c.status === "fail") ?? false;

  return (
    <div className="ev-palette-scrim" onMouseDown={() => workspace.closeExport()}>
      <div className="ev-export" onMouseDown={(e) => e.stopPropagation()}>
        <header className="ev-export__head">
          <span className="ev-export__title">Export · KDP preflight</span>
          <button type="button" className="ev-iconbtn" onClick={() => workspace.closeExport()}>
            ✕
          </button>
        </header>

        <div className="ev-export__body">
          {loading && <div className="ev-empty__hint">Running preflight…</div>}
          {report && (
            <ul className="ev-pf">
              {report.checks.map((c, i) => (
                <li key={i} className={`ev-pf__row ev-pf__row--${c.status}`}>
                  <span className="ev-pf__icon">{GLYPH[c.status]}</span>
                  <span className="ev-pf__main">
                    <span className="ev-pf__label">{c.label}</span>
                    <span className="ev-pf__detail">{c.detail}</span>
                    {c.fix && <span className="ev-pf__fix">→ {c.fix}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {message && <div className="ev-export__msg">{message}</div>}
        </div>

        <footer className="ev-export__foot">
          <button type="button" className="ev-btn" onClick={() => void exportTexNow()}>
            Export LaTeX…
          </button>
          <span className="ev-export__spacer" />
          <button
            type="button"
            className="ev-btn ev-btn--primary"
            disabled={blocked || !report}
            onClick={() => void exportPdfNow()}
          >
            {blocked ? "Fix failures to export" : "Export PDF…"}
          </button>
        </footer>
      </div>
    </div>
  );
}
