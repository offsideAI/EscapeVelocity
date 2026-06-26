/** Zed-style command palette (clean-room). Fuzzy-filters the action registry,
 *  keyboard-navigable, runs the selected command on Enter. */
import { useEffect, useMemo, useRef, useState } from "react";
import { allCommands } from "../commands/registry";
import { useWorkspace, workspace } from "../workspace/store";
import { fuzzyScore } from "./fuzzy";

export function CommandPalette() {
  const open = useWorkspace((s) => s.paletteOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const cmds = allCommands().filter((c) => !c.isEnabled || c.isEnabled());
    if (!query.trim()) return cmds;
    return cmds
      .map((c) => ({ c, s: fuzzyScore(query, `${c.category ?? ""} ${c.title}`) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.c);
    // `open` re-seeds the list when the palette is reopened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const run = (idx: number) => {
    const cmd = results[idx];
    if (!cmd) return;
    workspace.closePalette();
    cmd.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      workspace.closePalette();
    }
  };

  return (
    <div className="ev-palette-scrim" onMouseDown={() => workspace.closePalette()}>
      <div className="ev-palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="ev-palette__input"
          placeholder="Type a command…"
          value={query}
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {results.length === 0 ? (
          <div className="ev-palette__empty">No matching commands</div>
        ) : (
          <ul className="ev-palette__list">
            {results.map((c, i) => (
              <li
                key={c.id}
                className={`ev-palette__item${i === active ? " ev-palette__item--active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  run(i);
                }}
              >
                {c.category && <span className="ev-palette__cat">{c.category}:</span>}
                <span className="ev-palette__title">{c.title}</span>
                {c.keybinding && <span className="ev-kbd">{c.keybinding}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
