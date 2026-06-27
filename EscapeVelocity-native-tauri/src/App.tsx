import { useEffect } from "react";
import { Workspace } from "./workspace/Workspace";
import { CommandPalette } from "./command-palette/CommandPalette";
import { ExportDialog } from "./export/ExportDialog";
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
      title: "Rebuild",
      keybinding: "⌘↵",
      run: () => void compileStore.build(),
    },
    {
      id: "inspector.open",
      category: "View",
      title: "Open PageSetting Inspector",
      keybinding: "⌘,",
      run: workspace.openInspector,
    },
    {
      id: "export.open",
      category: "File",
      title: "Export… (KDP preflight)",
      keybinding: "⌘E",
      run: workspace.openExport,
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
  { key: "mod-,", command: "inspector.open" },
  { key: "mod-e", command: "export.open" },
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
    // Load default settings + the sample document and build on launch.
    void compileStore.init();
    return uninstall;
  }, []);

  return (
    <>
      <Workspace />
      <CommandPalette />
      <ExportDialog />
    </>
  );
}

export default App;
