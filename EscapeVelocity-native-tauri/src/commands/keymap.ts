/** Data-driven, platform-aware keybinding dispatch.
 *
 *  Clean-room reimplementation of the common "chord string -> command id"
 *  pattern. A chord looks like "mod-shift-p"; `mod` resolves to ⌘ on macOS and
 *  Ctrl elsewhere. Both the binding table and the live KeyboardEvent are reduced
 *  to the same canonical "<mods…>-<key>" string and compared. */
import { runCommand } from "./registry";

export interface KeyBinding {
  /** e.g. "mod-shift-p". `mod` = ⌘ (macOS) / Ctrl (others). */
  key: string;
  command: string;
}

const isMac =
  typeof navigator !== "undefined" &&
  /mac/i.test(navigator.platform || navigator.userAgent || "");

const MOD_ORDER = ["meta", "ctrl", "alt", "shift"] as const;

/** Reduce a chord string to canonical "<mods…>-<key>" form. */
function canonical(chord: string): string {
  const mods = new Set<string>();
  let key = "";
  for (const raw of chord.split("-")) {
    const t = raw.toLowerCase().trim();
    if (!t) continue;
    switch (t) {
      case "cmd":
      case "command":
      case "meta":
      case "super":
      case "win":
        mods.add("meta");
        break;
      case "mod":
        mods.add(isMac ? "meta" : "ctrl");
        break;
      case "ctrl":
      case "control":
        mods.add("ctrl");
        break;
      case "alt":
      case "option":
      case "opt":
        mods.add("alt");
        break;
      case "shift":
        mods.add("shift");
        break;
      default:
        key = t;
    }
  }
  return [...MOD_ORDER.filter((m) => mods.has(m)), key].join("-");
}

/** Reduce a live KeyboardEvent to the same canonical form. */
function eventChord(e: KeyboardEvent): string {
  const mods: string[] = [];
  if (e.metaKey) mods.push("meta");
  if (e.ctrlKey) mods.push("ctrl");
  if (e.altKey) mods.push("alt");
  if (e.shiftKey) mods.push("shift");
  let key = e.key.toLowerCase();
  if (key === " ") key = "space";
  return [...mods, key].join("-");
}

/** Install a global keymap. Returns a disposer. */
export function installKeymap(table: KeyBinding[]): () => void {
  const bindings = new Map(table.map((b) => [canonical(b.key), b.command]));
  const handler = (e: KeyboardEvent) => {
    const command = bindings.get(eventChord(e));
    if (!command) return;
    e.preventDefault();
    e.stopPropagation();
    runCommand(command);
  };
  window.addEventListener("keydown", handler, { capture: true });
  return () => window.removeEventListener("keydown", handler, { capture: true });
}
