/** Left dock: tabbed between the document Structure (outline) and the
 *  PageSetting inspector (Settings). */
import { useWorkspace, workspace } from "./store";
import { StructureOutline } from "../panes/structure/StructurePane";
import { Inspector } from "../inspector/Inspector";

export function LeftDock() {
  const tab = useWorkspace((s) => s.leftTab);
  return (
    <div className="ev-pane">
      <header className="ev-pane__header ev-pane__header--tabs">
        <button
          type="button"
          className={`ev-tab${tab === "structure" ? " ev-tab--active" : ""}`}
          onClick={() => workspace.setLeftTab("structure")}
        >
          Structure
        </button>
        <button
          type="button"
          className={`ev-tab${tab === "settings" ? " ev-tab--active" : ""}`}
          onClick={() => workspace.setLeftTab("settings")}
        >
          Settings
        </button>
      </header>
      {tab === "structure" ? <StructureOutline /> : <Inspector />}
    </div>
  );
}
