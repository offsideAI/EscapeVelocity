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

/// Point Tectonic at a writable, pre-warmed cache (seeded from the bundled
/// `tectonic-cache` resource) so compiles are fully offline. Idempotent.
fn prepare_tectonic_cache(app: &tauri::AppHandle) {
    use tauri::Manager;
    // Accept either bundling layout (mapped to `tectonic-cache`, or copied under
    // `vendor/tectonic-cache`); use whichever actually holds the cache.
    let resource_cache = app.path().resource_dir().ok().and_then(|d| {
        [d.join("tectonic-cache"), d.join("vendor/tectonic-cache")]
            .into_iter()
            .find(|p| p.join("bundles").is_dir())
    });
    if let Ok(base) = app.path().app_cache_dir() {
        compile::ensure_offline_cache(resource_cache, base.join("tectonic-cache"));
    }
}

/// Compile LaTeX source to a PDF, returned as raw bytes (an `ArrayBuffer` on the
/// JS side). Runs on a blocking thread so the UI never stalls. On failure the
/// error string carries Tectonic's message.
#[tauri::command]
async fn compile_latex(app: tauri::AppHandle, source: String) -> Result<tauri::ipc::Response, String> {
    prepare_tectonic_cache(&app);
    let result = tauri::async_runtime::spawn_blocking(move || compile::latex_to_pdf(&source))
        .await
        .map_err(|e| format!("compile task panicked: {e}"))?;
    let bytes = result?;
    Ok(tauri::ipc::Response::new(bytes))
}

/// Default PageSetting for a named output preset (e.g. "kdp_6x9").
#[tauri::command]
fn default_settings(preset: String) -> Result<latexgen::model::Settings, String> {
    latexgen::presets::default_settings(&preset).ok_or_else(|| format!("unknown preset: {preset}"))
}

/// Generate clean `memoir` LaTeX from a document + settings. Pure; no compile.
#[tauri::command]
fn generate_latex(
    document: latexgen::model::Document,
    settings: latexgen::model::Settings,
) -> String {
    latexgen::generate(&document, &settings)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            app_version,
            compile_latex,
            default_settings,
            generate_latex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
