/** TipTap schema for the structured editor.
 *
 *  Every custom block holds `inline*` (or `text*`) content, giving a clean 1:1
 *  mapping with our `document.json` nodes. Chapter titles are flat markers; the
 *  serializer groups following blocks under them. Marks map: bold↔strong,
 *  italic↔emphasis, smallCaps↔small_caps. (Figure, footnote, and link land in
 *  later milestones — see serialize.ts.) */
import { Mark, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

const block = (
  name: string,
  tag: string,
  className: string,
  shortcut: string,
  content = "inline*",
) =>
  Node.create({
    name,
    group: "block",
    content,
    defining: true,
    parseHTML() {
      return [{ tag: `${tag}[data-ev="${name}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes, { "data-ev": name, class: className }), 0];
    },
    addKeyboardShortcuts() {
      return { [shortcut]: () => this.editor.commands.setNode(this.name) };
    },
  });

export const ChapterTitle = block("chapterTitle", "h1", "ev-ed-chapter", "Mod-Alt-1");
export const BlockQuote = block("blockQuote", "blockquote", "ev-ed-quote", "Mod-Alt-q");
export const PullQuote = block("pullQuote", "aside", "ev-ed-pull", "Mod-Alt-p");
export const Verse = block("verse", "div", "ev-ed-verse", "Mod-Alt-v");

export const RawLatex = Node.create({
  name: "rawLatex",
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,
  parseHTML() {
    return [{ tag: 'pre[data-ev="rawLatex"]', preserveWhitespace: "full" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["pre", mergeAttributes(HTMLAttributes, { "data-ev": "rawLatex", class: "ev-ed-raw" }), ["code", 0]];
  },
  addKeyboardShortcuts() {
    return { "Mod-Alt-r": () => this.editor.commands.setNode(this.name) };
  },
});

export const SceneBreak = Node.create({
  name: "sceneBreak",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-ev="sceneBreak"]' }];
  },
  renderHTML() {
    return ["div", { "data-ev": "sceneBreak", class: "ev-ed-scenebreak" }, "* * *"];
  },
  addKeyboardShortcuts() {
    return { "Mod-Alt-0": () => this.editor.commands.insertContent({ type: this.name }) };
  },
});

/** Footnote as an inline atom; its text lives in `attrs.text` (plain for M3).
 *  Displayed as a dagger marker so authors see where notes anchor. */
export const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { text: { default: "" } };
  },
  parseHTML() {
    return [{ tag: 'span[data-ev="footnote"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-ev": "footnote", class: "ev-ed-footnote" }), "†"];
  },
});

export const SmallCaps = Mark.create({
  name: "smallCaps",
  parseHTML() {
    return [{ tag: 'span[data-ev="smallCaps"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-ev": "smallCaps", class: "ev-ed-smallcaps" }), 0];
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-k": () => this.editor.commands.toggleMark(this.name) };
  },
});

/** The full extension set. StarterKit provides document/paragraph/text, bold
 *  (=strong), italic (=emphasis), heading (H2/H3), hard breaks, and undo/redo;
 *  unmapped nodes/marks are disabled so nothing can be authored that we'd lose
 *  on serialize. */
export const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    blockquote: false,
    codeBlock: false,
    code: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
  }),
  ChapterTitle,
  BlockQuote,
  PullQuote,
  Verse,
  RawLatex,
  SceneBreak,
  Footnote,
  SmallCaps,
];
