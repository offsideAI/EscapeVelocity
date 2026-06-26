/** Bridge to the Rust `compile_latex` command. */
import { invoke } from "@tauri-apps/api/core";

/** True when running inside the Tauri shell (vs. a plain browser dev server). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Compile a complete LaTeX document to PDF bytes via the embedded Tectonic
 *  engine. The Rust side returns raw bytes, delivered here as an ArrayBuffer. */
export async function compileLatex(source: string): Promise<Uint8Array> {
  const buf = await invoke<ArrayBuffer>("compile_latex", { source });
  return new Uint8Array(buf);
}
