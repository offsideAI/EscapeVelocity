//! EscapeVelocity — Tauri backend entry point.
//!
//! Backend modules mirror the PRD §8.4 component map. They are stubbed at M0
//! and filled in across later milestones:
//!   - `compile`  — Tectonic invocation, SyncTeX, diagnostics (M1)
//!   - `latexgen` — structured model → `memoir` LaTeX; the generation contract (M2)
//!   - `project`  — `.escvel` load/save, autosave, history
//!   - `import`   — DOCX / Markdown → structured model (M7)
//!   - `export`   — print-ready PDF post-processing + KDP preflight (M6)

pub mod compile;
pub mod export;
pub mod import;
pub mod latexgen;
pub mod project;

/// App name + version, for the About box / status bar.
#[tauri::command]
fn app_version() -> String {
    format!("EscapeVelocity {}", env!("CARGO_PKG_VERSION"))
}

/// Compile LaTeX source to a PDF, returned as raw bytes (an `ArrayBuffer` on the
/// JS side). Runs on a blocking thread so the UI never stalls. On failure the
/// error string carries Tectonic's message.
#[tauri::command]
async fn compile_latex(source: String) -> Result<tauri::ipc::Response, String> {
    let result = tauri::async_runtime::spawn_blocking(move || compile::latex_to_pdf(&source))
        .await
        .map_err(|e| format!("compile task panicked: {e}"))?;
    let bytes = result?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![app_version, compile_latex])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
