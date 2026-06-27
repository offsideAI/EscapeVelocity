/** Two-way mapping between the TipTap (ProseMirror) JSON document and our
 *  `document.json` *body*. Front/back matter is preserved separately by the
 *  store (front/back-matter authoring is M7).
 *
 *  Direction of truth: the editor is a *view*; this serializes its content back
 *  to the model on every change. Marks map bold↔strong, italic↔emphasis,
 *  smallCaps↔small_caps; chapter titles are flat markers that group the blocks
 *  that follow. Known M3 simplifications: Section containers normalize to flat
 *  Headings (identical LaTeX); links render as plain text; footnotes carry
 *  plain text; figures are deferred (asset handling). */
import type { Document, Inline, Node } from "../model/types";

interface PMMark {
  type: string;
}
interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
}

// ---------------- inline: model -> ProseMirror ----------------

function addMark(marks: PMMark[], type: string): PMMark[] {
  return marks.some((m) => m.type === type) ? marks : [...marks, { type }];
}

function plainInline(items: Inline[]): string {
  let s = "";
  for (const it of items) {
    if (it.type === "text") s += it.value;
    else s += plainInline(it.content);
  }
  return s;
}

function inlinesToPM(items: Inline[], marks: PMMark[] = []): PMNode[] {
  const out: PMNode[] = [];
  for (const it of items) {
    switch (it.type) {
      case "text":
        if (it.value.length) {
          out.push({ type: "text", text: it.value, ...(marks.length ? { marks } : {}) });
        }
        break;
      case "strong":
        out.push(...inlinesToPM(it.content, addMark(marks, "bold")));
        break;
      case "emphasis":
        out.push(...inlinesToPM(it.content, addMark(marks, "italic")));
        break;
      case "small_caps":
        out.push(...inlinesToPM(it.content, addMark(marks, "smallCaps")));
        break;
      case "link": // M3: render link text only
        out.push(...inlinesToPM(it.content, marks));
        break;
      case "footnote":
        out.push({ type: "footnote", attrs: { text: plainInline(it.content) } });
        break;
    }
  }
  return out;
}

// ---------------- inline: ProseMirror -> model ----------------

function pmToInlines(nodes: PMNode[] | undefined): Inline[] {
  const out: Inline[] = [];
  for (const node of nodes ?? []) {
    if (node.type === "text") {
      let inline: Inline = { type: "text", value: node.text ?? "" };
      const marks = node.marks ?? [];
      // Nest innermost→outermost so it round-trips with inlinesToPM's order.
      if (marks.some((m) => m.type === "smallCaps")) inline = { type: "small_caps", content: [inline] };
      if (marks.some((m) => m.type === "italic")) inline = { type: "emphasis", content: [inline] };
      if (marks.some((m) => m.type === "bold")) inline = { type: "strong", content: [inline] };
      out.push(inline);
    } else if (node.type === "footnote") {
      const text = String(node.attrs?.text ?? "");
      out.push({ type: "footnote", content: [{ type: "text", value: text }] });
    }
    // hardBreak is handled by the verse splitter; ignored elsewhere.
  }
  return out;
}

// ---------------- blocks ----------------

function content(arr: PMNode[]): PMNode[] | undefined {
  return arr.length ? arr : undefined;
}

function verseToPM(lines: Inline[][]): PMNode[] {
  const out: PMNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push({ type: "hardBreak" });
    out.push(...inlinesToPM(line));
  });
  return out;
}

function nodeToPMBlocks(node: Node): PMNode[] {
  switch (node.type) {
    case "chapter":
    case "part":
      return [
        { type: "chapterTitle", content: content(inlinesToPM(node.title)) },
        ...node.children.flatMap(nodeToPMBlocks),
      ];
    case "section":
      return [
        { type: "heading", attrs: { level: 2 }, content: content(inlinesToPM(node.title)) },
        ...node.children.flatMap(nodeToPMBlocks),
      ];
    case "heading": {
      const level = node.level >= 3 ? 3 : 2;
      return [{ type: "heading", attrs: { level }, content: content(inlinesToPM(node.content)) }];
    }
    case "paragraph":
      return [{ type: "paragraph", content: content(inlinesToPM(node.content)) }];
    case "block_quote":
      return [{ type: "blockQuote", content: content(inlinesToPM(node.content)) }];
    case "pull_quote":
      return [{ type: "pullQuote", content: content(inlinesToPM(node.content)) }];
    case "verse":
      return [{ type: "verse", content: content(verseToPM(node.lines)) }];
    case "scene_break":
      return [{ type: "sceneBreak" }];
    case "raw_latex":
      return [{ type: "rawLatex", content: node.code ? [{ type: "text", text: node.code }] : undefined }];
    case "figure":
      return []; // deferred (needs asset handling)
  }
}

function pmVerseToLines(nodes: PMNode[] | undefined): Inline[][] {
  const lines: Inline[][] = [];
  let current: PMNode[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "hardBreak") {
      lines.push(pmToInlines(current));
      current = [];
    } else {
      current.push(n);
    }
  }
  lines.push(pmToInlines(current));
  return lines;
}

function pmBlockToNode(b: PMNode): Node | null {
  switch (b.type) {
    case "heading":
      return { type: "heading", level: Number(b.attrs?.level ?? 2), content: pmToInlines(b.content) };
    case "paragraph":
      return { type: "paragraph", content: pmToInlines(b.content) };
    case "blockQuote":
      return { type: "block_quote", content: pmToInlines(b.content) };
    case "pullQuote":
      return { type: "pull_quote", content: pmToInlines(b.content) };
    case "verse":
      return { type: "verse", lines: pmVerseToLines(b.content) };
    case "sceneBreak":
      return { type: "scene_break" };
    case "rawLatex":
      return { type: "raw_latex", code: (b.content ?? []).map((n) => n.text ?? "").join("") };
    default:
      return null;
  }
}

// ---------------- public API ----------------

/** ProseMirror `doc` JSON for the editor, from a document body. */
export function bodyToEditorDoc(body: Node[]): PMNode {
  const blocks = body.flatMap(nodeToPMBlocks);
  return { type: "doc", content: blocks.length ? blocks : [{ type: "paragraph" }] };
}

/** Document body from the editor's ProseMirror `doc` JSON. Chapter titles group
 *  the blocks that follow them; blocks before any chapter stay at top level. */
export function editorDocToBody(doc: PMNode): Node[] {
  const body: Node[] = [];
  let chapter: Extract<Node, { type: "chapter" }> | null = null;
  for (const b of doc.content ?? []) {
    if (b.type === "chapterTitle") {
      chapter = { type: "chapter", title: pmToInlines(b.content), children: [] };
      body.push(chapter);
    } else {
      const node = pmBlockToNode(b);
      if (!node) continue;
      if (chapter) chapter.children.push(node);
      else body.push(node);
    }
  }
  return body;
}

/** Merge an edited body back into a full document, preserving front/back. */
export function withBody(base: Document, body: Node[]): Document {
  return { front_matter: base.front_matter, body, back_matter: base.back_matter };
}
