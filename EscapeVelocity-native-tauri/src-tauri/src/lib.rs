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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![app_version])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
