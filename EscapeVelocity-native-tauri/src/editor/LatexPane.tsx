/** LaTeX source pane (M4): CodeMirror 6 showing the generated `.tex`,
 *  read-only, with LaTeX highlighting and the Zed-style theme. Clicking a line
 *  scrolls the preview (SyncTeX forward); preview clicks scroll here (handled via
 *  the store's jump signal). Raw-LaTeX editing happens in the structured editor
 *  (it round-trips losslessly); this pane is read-only by design — the source is
 *  generated, not hand-authored. */
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle, StreamLanguage, bracketMatching } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { tags as t } from "@lezer/highlight";
import { compileStore, useCompile } from "../compile/store";
import { synctexForward } from "../compile/api";

const highlight = HighlightStyle.define([
  { tag: t.comment, color: "var(--ev-syn-comment)", fontStyle: "italic" },
  { tag: t.string, color: "var(--ev-syn-string)" },
  { tag: [t.keyword, t.controlKeyword], color: "var(--ev-syn-keyword)" },
  { tag: [t.tagName, t.labelName, t.meta], color: "var(--ev-syn-command)" },
  { tag: t.number, color: "var(--ev-syn-number)" },
  { tag: [t.bracket, t.brace], color: "var(--ev-syn-operator)" },
  { tag: t.atom, color: "var(--ev-syn-function)" },
]);

const theme = EditorView.theme({
  "&": { color: "var(--ev-text)", backgroundColor: "var(--ev-bg)", height: "100%", fontSize: "13px" },
  ".cm-content": { fontFamily: "var(--ev-font-mono)", caretColor: "var(--ev-accent)" },
  ".cm-gutters": { backgroundColor: "var(--ev-bg)", color: "var(--ev-text-faint)", border: "none" },
  ".cm-activeLine": { backgroundColor: "var(--ev-accent-soft)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--ev-text-muted)" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "var(--ev-accent)" },
  ".cm-selectionBackground, .cm-content ::selection": { backgroundColor: "var(--ev-selection)" },
  ".cm-scroller": { overflow: "auto", lineHeight: "1.5" },
});

async function forwardJump(line: number) {
  const hit = await synctexForward(line);
  if (hit) compileStore.requestPreviewJump(hit.page, hit.y_frac);
}

export function LatexPane() {
  const tex = useCompile((s) => s.tex);
  const jump = useCompile((s) => s.jumpSource);
  const jumpKey = jump?.key;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: compileStore.getState().tex,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          bracketMatching(),
          StreamLanguage.define(stex),
          syntaxHighlighting(highlight),
          theme,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.updateListener.of((u) => {
            // Only on a real pointer selection (not programmatic jumps).
            if (u.transactions.some((tr) => tr.isUserEvent("select.pointer"))) {
              const line = u.state.doc.lineAt(u.state.selection.main.head).number;
              void forwardJump(line);
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Keep the document in sync with the generated LaTeX.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() !== tex) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: tex } });
    }
  }, [tex]);

  // Preview → source jump: scroll + highlight the target line.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !jump) return;
    const n = Math.min(Math.max(jump.line, 1), view.state.doc.lines);
    const line = view.state.doc.line(n);
    view.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpKey]);

  return <div className="ev-latexpane" ref={hostRef} />;
}
