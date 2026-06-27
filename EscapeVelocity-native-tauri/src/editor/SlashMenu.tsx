/** A lightweight slash menu for applying semantic block styles. Type "/" at the
 *  start of an empty block to open it; filter by typing; ↑/↓/↵ to choose. Block
 *  styles also have keyboard shortcuts (shown here) defined on each node. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface Item {
  label: string;
  hint: string;
  keywords: string;
  apply: (editor: Editor) => void;
}

const ITEMS: Item[] = [
  { label: "Body", hint: "", keywords: "body paragraph text", apply: (e) => e.chain().focus().setNode("paragraph").run() },
  { label: "Chapter Title", hint: "⌘⌥1", keywords: "chapter title", apply: (e) => e.chain().focus().setNode("chapterTitle").run() },
  { label: "Heading 2", hint: "", keywords: "heading 2 section", apply: (e) => e.chain().focus().setNode("heading", { level: 2 }).run() },
  { label: "Heading 3", hint: "", keywords: "heading 3 subsection", apply: (e) => e.chain().focus().setNode("heading", { level: 3 }).run() },
  { label: "Block Quote", hint: "⌘⌥Q", keywords: "block quote", apply: (e) => e.chain().focus().setNode("blockQuote").run() },
  { label: "Verse", hint: "⌘⌥V", keywords: "verse poetry", apply: (e) => e.chain().focus().setNode("verse").run() },
  { label: "Pull Quote", hint: "⌘⌥P", keywords: "pull quote", apply: (e) => e.chain().focus().setNode("pullQuote").run() },
  { label: "Scene Break", hint: "⌘⌥0", keywords: "scene break divider", apply: (e) => e.chain().focus().insertContent({ type: "sceneBreak" }).run() },
  { label: "Raw LaTeX", hint: "⌘⌥R", keywords: "raw latex code", apply: (e) => e.chain().focus().setNode("rawLatex").run() },
];

interface MenuState {
  open: boolean;
  query: string;
  left: number;
  top: number;
  blockStart: number;
  cursor: number;
}

const CLOSED: MenuState = { open: false, query: "", left: 0, top: 0, blockStart: 0, cursor: 0 };

export function SlashMenu({ editor }: { editor: Editor | null }) {
  const [menu, setMenu] = useState<MenuState>(CLOSED);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = menu.open
    ? ITEMS.filter((it) => {
        const q = menu.query.toLowerCase();
        return !q || `${it.label} ${it.keywords}`.toLowerCase().includes(q);
      })
    : [];

  // Detect "/" at the start of a text block on every editor transaction.
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { state } = editor;
      const { $from, empty } = state.selection;
      const parent = $from.parent;
      const text = parent.textContent;
      const isTextblock = parent.isTextblock && parent.type.name !== "rawLatex";
      if (empty && isTextblock && text.startsWith("/")) {
        const coords = editor.view.coordsAtPos($from.pos);
        setMenu({
          open: true,
          query: text.slice(1),
          left: coords.left,
          top: coords.bottom,
          blockStart: $from.start(),
          cursor: $from.pos,
        });
      } else {
        setMenu((m) => (m.open ? CLOSED : m));
      }
    };
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  useEffect(() => setActive(0), [menu.query]);
  useLayoutEffect(() => {
    listRef.current?.querySelector(".ev-slash__item--active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = useCallback(
    (item: Item | undefined) => {
      if (!editor || !item) return;
      // Remove the "/query" text, then apply the chosen style.
      editor.chain().focus().deleteRange({ from: menu.blockStart, to: menu.cursor }).run();
      item.apply(editor);
      setMenu(CLOSED);
    },
    [editor, menu.blockStart, menu.cursor],
  );

  // Intercept navigation keys while open (letters fall through to the editor,
  // updating the query).
  useEffect(() => {
    if (!menu.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(results[active]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMenu(CLOSED);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [menu.open, results, active, choose]);

  if (!menu.open || results.length === 0) return null;

  return (
    <ul
      ref={listRef}
      className="ev-slash"
      style={{ left: menu.left, top: menu.top }}
      // keep editor focus; act on mousedown
      onMouseDown={(e) => e.preventDefault()}
    >
      {results.map((it, i) => (
        <li
          key={it.label}
          className={`ev-slash__item${i === active ? " ev-slash__item--active" : ""}`}
          onMouseEnter={() => setActive(i)}
          onMouseDown={() => choose(it)}
        >
          <span className="ev-slash__label">{it.label}</span>
          {it.hint && <span className="ev-kbd">{it.hint}</span>}
        </li>
      ))}
    </ul>
  );
}
