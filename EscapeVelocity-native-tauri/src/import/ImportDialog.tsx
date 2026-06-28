/** Import manuscript dialog (M7). Paste Markdown or open a `.md` file; the
 *  review step shows the parsed structure before it replaces the document
 *  (no silent guessing). DOCX import is a later addition. */
import { useMemo, useState } from "react";
import { useWorkspace, workspace } from "../workspace/store";
import { compileStore } from "../compile/store";
import { openMarkdownFile } from "../compile/api";
import { markdownToDocument, summarize } from "./markdown";

export function ImportDialog() {
  const open = useWorkspace((s) => s.importOpen);
  const [text, setText] = useState("");

  const doc = useMemo(() => (text.trim() ? markdownToDocument(text) : null), [text]);
  const summary = doc ? summarize(doc) : null;

  if (!open) return null;

  const pickFile = async () => {
    const md = await openMarkdownFile();
    if (md != null) setText(md);
  };

  const doImport = () => {
    if (!doc) return;
    compileStore.replaceDocument(doc);
    setText("");
    workspace.closeImport();
  };

  return (
    <div className="ev-palette-scrim" onMouseDown={() => workspace.closeImport()}>
      <div className="ev-export" onMouseDown={(e) => e.stopPropagation()}>
        <header className="ev-export__head">
          <span className="ev-export__title">Import manuscript</span>
          <button type="button" className="ev-iconbtn" onClick={() => workspace.closeImport()}>
            ✕
          </button>
        </header>

        <div className="ev-export__body">
          <div className="ev-import__hint">
            Paste Markdown or open a <code>.md</code> file. <code># </code> becomes a chapter,
            <code> ## </code>/<code>### </code> headings, plus paragraphs, block quotes,
            <code> --- </code> scene breaks, and <strong>bold</strong>/<em>italic</em>. (DOCX import
            is coming.)
          </div>
          <textarea
            className="ev-import__text"
            spellCheck={false}
            placeholder={"# Chapter One\n\nYour prose here, with *emphasis* and **strong**.\n\n> A quote.\n\n---\n\nThe next scene."}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {summary && (
            <div className="ev-import__summary">
              Review: <strong>{summary.chapters}</strong> chapter(s),{" "}
              <strong>{summary.headings}</strong> heading(s),{" "}
              <strong>{summary.paragraphs}</strong> paragraph(s). Importing replaces the current
              document.
            </div>
          )}
        </div>

        <footer className="ev-export__foot">
          <button type="button" className="ev-btn" onClick={() => void pickFile()}>
            Open .md file…
          </button>
          <span className="ev-export__spacer" />
          <button type="button" className="ev-btn ev-btn--primary" disabled={!doc} onClick={doImport}>
            Import
          </button>
        </footer>
      </div>
    </div>
  );
}
