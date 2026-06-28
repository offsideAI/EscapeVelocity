/** The three-pane workspace shell: title bar, resizable/collapsible
 *  structure | editor | preview docks, and a status strip. Panel sizes persist
 *  via react-resizable-panels' `autoSaveId`; coarse visibility lives in the
 *  workspace store. */
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { ReactNode } from "react";
import { useWorkspace, workspace } from "./store";
import { useCompile } from "../compile/store";
import { LeftDock } from "./LeftDock";
import { EditorPane } from "../panes/editor/EditorPane";
import { PreviewPane } from "../panes/preview/PreviewPane";

function TitleBar() {
  return (
    <div className="ev-titlebar" data-tauri-drag-region>
      <span className="ev-titlebar__brand" data-tauri-drag-region>
        EscapeVelocity
      </span>
      <span className="ev-titlebar__spacer" data-tauri-drag-region />
      <button type="button" className="ev-titlebar__btn" onClick={() => workspace.openImport()}>
        Import
      </button>
      <button type="button" className="ev-titlebar__btn" onClick={() => workspace.openExport()}>
        Export
      </button>
      <span className="ev-titlebar__hint">
        <span className="ev-kbd">⌘⇧P</span> commands
      </span>
    </div>
  );
}

function StatusBar() {
  const view = useWorkspace((s) => s.editorView);
  const status = useCompile((s) => s.status);
  const pageCount = useCompile((s) => s.pageCount);
  const error = useCompile((s) => s.error);

  const statusText =
    status === "compiling"
      ? "Compiling…"
      : status === "ok"
        ? "Ready"
        : status === "error"
          ? "Compile error"
          : "Idle";
  const oddPages = pageCount != null && pageCount % 2 === 1;

  return (
    <div className="ev-statusbar">
      <span className="ev-status-item" title={error ?? undefined}>
        <span className={`ev-status-dot ev-status-dot--${status}`} />
        {statusText}
      </span>
      <span className="ev-status-item">
        {pageCount != null ? `${pageCount} page${pageCount === 1 ? "" : "s"}` : "— pages"}
        {oddPages && (
          <span
            className="ev-status-flag"
            title="KDP needs an even page count; export will add a blank verso"
          >
            &nbsp;· odd
          </span>
        )}
      </span>
      <span className="ev-statusbar__spacer" />
      <span className="ev-status-item">{view === "latex" ? "LaTeX" : "Structured"}</span>
    </div>
  );
}

export function Workspace() {
  const structureVisible = useWorkspace((s) => s.structureVisible);
  const previewVisible = useWorkspace((s) => s.previewVisible);

  // Build children explicitly (no fragments) so PanelGroup sees a flat
  // panel/handle/panel sequence even as docks toggle.
  const children: ReactNode[] = [];
  if (structureVisible) {
    children.push(
      <Panel key="structure" id="structure" order={1} defaultSize={22} minSize={14} maxSize={42}>
        <LeftDock />
      </Panel>,
    );
    children.push(<PanelResizeHandle key="rh-left" className="ev-resize" />);
  }
  children.push(
    <Panel key="editor" id="editor" order={2} minSize={28}>
      <EditorPane />
    </Panel>,
  );
  if (previewVisible) {
    children.push(<PanelResizeHandle key="rh-right" className="ev-resize" />);
    children.push(
      <Panel key="preview" id="preview" order={3} defaultSize={34} minSize={18} maxSize={56}>
        <PreviewPane />
      </Panel>,
    );
  }

  return (
    <div className="ev-app">
      <TitleBar />
      <div className="ev-body">
        <PanelGroup direction="horizontal" autoSaveId="ev.workspace.layout">
          {children}
        </PanelGroup>
      </div>
      <StatusBar />
    </div>
  );
}
