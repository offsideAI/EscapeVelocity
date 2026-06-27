/** Left dock — the book outline. Reflects the document's chapters and headings.
 *  Read-only in M3; drag-to-reorder is a later refinement. */
import { useCompile } from "../../compile/store";
import type { Inline, Node } from "../../model/types";

function plain(items: Inline[]): string {
  let s = "";
  for (const it of items) {
    if (it.type === "text") s += it.value;
    else s += plain(it.content);
  }
  return s;
}

interface Row {
  kind: "chapter" | "h2" | "h3";
  label: string;
}

function outline(body: Node[]): Row[] {
  const rows: Row[] = [];
  const visit = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.type === "chapter" || node.type === "part") {
        rows.push({ kind: "chapter", label: plain(node.title) || "Untitled chapter" });
        visit(node.children);
      } else if (node.type === "section") {
        rows.push({ kind: "h2", label: plain(node.title) || "Section" });
        visit(node.children);
      } else if (node.type === "heading") {
        rows.push({ kind: node.level >= 3 ? "h3" : "h2", label: plain(node.content) || "Heading" });
      }
    }
  };
  visit(body);
  return rows;
}

/** Body-only outline; the pane chrome + tabs live in LeftDock. */
export function StructureOutline() {
  const document = useCompile((s) => s.document);
  const rows = document ? outline(document.body) : [];

  return (
    <div className="ev-pane__body ev-outline">
      {rows.length === 0 ? (
        <div className="ev-empty">
          <div className="ev-empty__title">No chapters yet</div>
          <div className="ev-empty__hint">
            Add a Chapter Title in the editor (<span className="ev-kbd">⌘⌥1</span>) and it appears
            here.
          </div>
        </div>
      ) : (
        <ul className="ev-outline__list">
          {rows.map((r, i) => (
            <li key={i} className={`ev-outline__row ev-outline__row--${r.kind}`} title={r.label}>
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
