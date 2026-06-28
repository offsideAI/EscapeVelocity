/** Markdown → `document.json` import (M7). Maps Markdown structure to our
 *  semantic model: `# ` → Chapter, `## `/`### ` → Heading, paragraphs, block
 *  quotes, `---` → scene break, fenced code → Raw-LaTeX; inline **bold**→strong,
 *  *italic*→emphasis, links, code spans. Lists flatten to paragraphs (the model
 *  has no list node — the author restructures in the review step). */
import { marked, type Token, type Tokens } from "marked";
import type { Document, Inline, Node } from "../model/types";

function inlines(tokens: Token[] | undefined): Inline[] {
  const out: Inline[] = [];
  for (const tk of tokens ?? []) {
    switch (tk.type) {
      case "text": {
        const t = tk as Tokens.Text;
        if (t.tokens && t.tokens.length) out.push(...inlines(t.tokens));
        else out.push({ type: "text", value: t.text });
        break;
      }
      case "strong":
        out.push({ type: "strong", content: inlines((tk as Tokens.Strong).tokens) });
        break;
      case "em":
        out.push({ type: "emphasis", content: inlines((tk as Tokens.Em).tokens) });
        break;
      case "codespan":
        out.push({ type: "text", value: (tk as Tokens.Codespan).text });
        break;
      case "link": {
        const l = tk as Tokens.Link;
        out.push({ type: "link", href: l.href, content: inlines(l.tokens) });
        break;
      }
      case "del":
        out.push(...inlines((tk as Tokens.Del).tokens));
        break;
      case "br":
        out.push({ type: "text", value: " " });
        break;
      case "escape":
        out.push({ type: "text", value: (tk as Tokens.Escape).text });
        break;
      default: {
        const anyTk = tk as { text?: string };
        if (anyTk.text) out.push({ type: "text", value: anyTk.text });
      }
    }
  }
  return out;
}

function blockToNode(tk: Token): Node | null {
  switch (tk.type) {
    case "paragraph":
      return { type: "paragraph", content: inlines((tk as Tokens.Paragraph).tokens) };
    case "heading": {
      const h = tk as Tokens.Heading;
      return { type: "heading", level: h.depth >= 3 ? 3 : 2, content: inlines(h.tokens) };
    }
    case "blockquote": {
      const bq = tk as Tokens.Blockquote;
      const content: Inline[] = [];
      for (const inner of bq.tokens) {
        if (inner.type === "paragraph") {
          if (content.length) content.push({ type: "text", value: " " });
          content.push(...inlines((inner as Tokens.Paragraph).tokens));
        }
      }
      return { type: "block_quote", content };
    }
    case "hr":
      return { type: "scene_break" };
    case "code":
      return { type: "raw_latex", code: (tk as Tokens.Code).text };
    default:
      return null;
  }
}

export function markdownToDocument(md: string): Document {
  const tokens = marked.lexer(md);
  const body: Node[] = [];
  let chapter: Extract<Node, { type: "chapter" }> | null = null;
  const push = (n: Node) => {
    if (chapter) chapter.children.push(n);
    else body.push(n);
  };

  for (const tk of tokens) {
    if (tk.type === "heading" && (tk as Tokens.Heading).depth === 1) {
      chapter = { type: "chapter", title: inlines((tk as Tokens.Heading).tokens), children: [] };
      body.push(chapter);
      continue;
    }
    if (tk.type === "list") {
      for (const item of (tk as Tokens.List).items) {
        push({ type: "paragraph", content: inlines(item.tokens) });
      }
      continue;
    }
    if (tk.type === "space") continue;
    const node = blockToNode(tk);
    if (node) push(node);
  }

  return { front_matter: [], body, back_matter: [] };
}

/** A short structure summary for the import review step. */
export function summarize(doc: Document): { chapters: number; headings: number; paragraphs: number } {
  let chapters = 0;
  let headings = 0;
  let paragraphs = 0;
  const visit = (nodes: Node[]) => {
    for (const n of nodes) {
      if (n.type === "chapter") {
        chapters += 1;
        visit(n.children);
      } else if (n.type === "heading") {
        headings += 1;
      } else if (n.type === "paragraph") {
        paragraphs += 1;
      }
    }
  };
  visit(doc.body);
  return { chapters, headings, paragraphs };
}
