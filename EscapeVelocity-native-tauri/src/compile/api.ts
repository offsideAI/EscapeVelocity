/** Bridge to the Rust compile / generation commands. */
import { invoke } from "@tauri-apps/api/core";
import type { Document, Settings } from "../model/types";

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

/** Compile a complete LaTeX document to PDF bytes via the embedded Tectonic
 *  engine. The Rust side returns raw bytes, delivered here as an ArrayBuffer. */
export async function compileLatex(source: string): Promise<Uint8Array> {
  const buf = await invoke<ArrayBuffer>("compile_latex", { source });
  return new Uint8Array(buf);
}
