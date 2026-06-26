/** A user-invokable action. The dispatch keymap lives in `commands/keymap.ts`;
 *  `keybinding` here is a display-only hint shown in the palette. */
export interface Command {
  id: string;
  title: string;
  category?: string;
  /** Pretty hint for the palette, e.g. "⌘⇧P". Not used for matching. */
  keybinding?: string;
  run: () => void;
  /** When present and returning false, the command is hidden/disabled. */
  isEnabled?: () => boolean;
}
