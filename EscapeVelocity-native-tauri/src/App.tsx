import { useEffect } from "react";
import { Workspace } from "./workspace/Workspace";
import { CommandPalette } from "./command-palette/CommandPalette";
import { registerCommands } from "./commands/registry";
import { installKeymap, type KeyBinding } from "./commands/keymap";
import { workspace } from "./workspace/store";
import { compileStore } from "./compile/store";
import { applyTheme, getStoredTheme } from "./theme/tokens";

/** Default actions exposed in the command palette and bound below. */
function registerDefaultCommands() {
  registerCommands([
    {
      id: "command_palette.toggle",
      category: "View",
      title: "Command Palette: Toggle",
      keybinding: "⌘⇧P",
      run: workspace.togglePalette,
    },
    {
      id: "workspace.toggle_structure",
      category: "View",
      title: "Toggle Structure Panel",
      keybinding: "⌘1",
      run: workspace.toggleStructure,
    },
    {
      id: "workspace.toggle_preview",
      category: "View",
      title: "Toggle Preview Panel",
      keybinding: "⌘2",
      run: workspace.togglePreview,
    },
    {
      id: "editor.toggle_view",
      category: "Editor",
      title: "Toggle Structured / LaTeX View",
      keybinding: "⌘⇧L",
      run: workspace.toggleEditorView,
    },
    {
      id: "theme.toggle",
      category: "View",
      title: "Toggle Light / Dark Theme",
      keybinding: "⌘⇧T",
      run: workspace.toggleTheme,
    },
    {
      id: "compile.run",
      category: "LaTeX",
      title: "Compile",
      keybinding: "⌘↵",
      run: () => void compileStore.compileNow(),
    },
  ]);
}

const KEYMAP: KeyBinding[] = [
  { key: "mod-shift-p", command: "command_palette.toggle" },
  { key: "mod-p", command: "command_palette.toggle" },
  { key: "mod-1", command: "workspace.toggle_structure" },
  { key: "mod-2", command: "workspace.toggle_preview" },
  { key: "mod-shift-l", command: "editor.toggle_view" },
  { key: "mod-shift-t", command: "theme.toggle" },
  { key: "mod-enter", command: "compile.run" },
];

let commandsRegistered = false;

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
    if (!commandsRegistered) {
      registerDefaultCommands();
      commandsRegistered = true;
    }
    const uninstall = installKeymap(KEYMAP);
    // Compile the sample document on launch so the preview isn't empty.
    void compileStore.compileNow();
    return uninstall;
  }, []);

  return (
    <>
      <Workspace />
      <CommandPalette />
    </>
  );
}

export default App;
