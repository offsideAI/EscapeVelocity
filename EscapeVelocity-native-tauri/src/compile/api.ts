/** Bridge to the Rust compile / generation / export commands. */
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type { Document, Settings } from "../model/types";

export interface PreflightCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  fix: string | null;
}
export interface PreflightReport {
  page_count: number;
  checks: PreflightCheck[];
}

/** True when running inside the Tauri shell (vs. a plain browser dev server). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Default PageSetting for a named output preset (e.g. "kdp_6x9"). */
export async function getDefaultSettings(preset: string): Promise<Settings> {
  return await invoke<Settings>("default_settings", { preset });
}

/** Generate clean memoir LaTeX from a document + settings (deterministic, pure). */
export async function generateLatex(document: Document, settings: Settings): Promise<string> {
  return await invoke<string>("generate_latex", { document, settings });
}

/** SyncTeX: preview click (page, vertical fraction) → generated-source line. */
export async function synctexInverse(page: number, yFrac: number): Promise<number | null> {
  if (!isTauri()) return null;
  return await invoke<number | null>("synctex_inverse", { page, yFrac });
}

/** SyncTeX: source line → preview location (page + vertical fraction). */
export async function synctexForward(
  line: number,
): Promise<{ page: number; y_frac: number } | null> {
  if (!isTauri()) return null;
  return await invoke<{ page: number; y_frac: number } | null>("synctex_forward", { line });
}

/** Run the KDP preflight checks. */
export async function runPreflight(document: Document, settings: Settings): Promise<PreflightReport> {
  return await invoke<PreflightReport>("preflight", { document, settings });
}

/** Export a print-ready PDF (even page count) to `path`. */
export async function exportPdf(
  document: Document,
  settings: Settings,
  path: string,
): Promise<{ page_count: number; blank_added: boolean }> {
  return await invoke("export_pdf", { document, settings, path });
}

/** Export the generated LaTeX source to `path`. */
export async function exportTex(document: Document, settings: Settings, path: string): Promise<void> {
  await invoke("export_tex", { document, settings, path });
}

/** Native save dialog → chosen path (or null if cancelled). */
export async function chooseSavePath(
  defaultName: string,
  ext: string,
  label: string,
): Promise<string | null> {
  return await save({ defaultPath: defaultName, filters: [{ name: label, extensions: [ext] }] });
}

/** Compile a complete LaTeX document to PDF bytes via the embedded Tectonic
 *  engine. The Rust side returns raw bytes, delivered here as an ArrayBuffer. */
export async function compileLatex(source: string): Promise<Uint8Array> {
  const buf = await invoke<ArrayBuffer>("compile_latex", { source });
  return new Uint8Array(buf);
}
