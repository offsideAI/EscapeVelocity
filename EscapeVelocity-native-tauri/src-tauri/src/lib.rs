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

use std::sync::Mutex;

/// Parsed SyncTeX for the most recent compile, used by the jump commands.
static SYNCTEX: Mutex<Option<compile::synctex::SyncTex>> = Mutex::new(None);

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
    let out = tauri::async_runtime::spawn_blocking(move || compile::compile_offline(&source))
        .await
        .map_err(|e| format!("compile task panicked: {e}"))??;
    // Cache the parsed SyncTeX for click-to-jump (best-effort).
    let parsed = out.synctex.as_deref().and_then(compile::synctex::SyncTex::parse);
    if let Ok(mut guard) = SYNCTEX.lock() {
        *guard = parsed;
    }
    Ok(tauri::ipc::Response::new(out.pdf))
}

/// PDF preview click (page + vertical fraction 0..1) → generated-source line.
#[tauri::command]
fn synctex_inverse(page: u32, y_frac: f64) -> Option<u32> {
    SYNCTEX.lock().ok()?.as_ref()?.inverse(page, y_frac)
}

#[derive(serde::Serialize)]
struct ForwardHit {
    page: u32,
    y_frac: f64,
}

/// Source line → preview location (page + vertical fraction 0..1).
#[tauri::command]
fn synctex_forward(line: u32) -> Option<ForwardHit> {
    let (page, y_frac) = SYNCTEX.lock().ok()?.as_ref()?.forward(line)?;
    Some(ForwardHit { page, y_frac })
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

/// Run the KDP preflight checks for a document + settings.
#[tauri::command]
async fn preflight(
    app: tauri::AppHandle,
    document: latexgen::model::Document,
    settings: latexgen::model::Settings,
) -> Result<export::PreflightReport, String> {
    prepare_tectonic_cache(&app);
    tauri::async_runtime::spawn_blocking(move || export::preflight(&document, &settings))
        .await
        .map_err(|e| format!("preflight task panicked: {e}"))?
}

/// Export a print-ready PDF (even page count guaranteed) to `path`.
#[tauri::command]
async fn export_pdf(
    app: tauri::AppHandle,
    document: latexgen::model::Document,
    settings: latexgen::model::Settings,
    path: String,
) -> Result<export::ExportInfo, String> {
    prepare_tectonic_cache(&app);
    let out = tauri::async_runtime::spawn_blocking(move || export::export(&document, &settings))
        .await
        .map_err(|e| format!("export task panicked: {e}"))??;
    std::fs::write(&path, &out.pdf).map_err(|e| format!("failed to write {path}: {e}"))?;
    Ok(out.info)
}

/// Export the generated LaTeX source to `path` (portable, no lock-in).
#[tauri::command]
fn export_tex(
    document: latexgen::model::Document,
    settings: latexgen::model::Settings,
    path: String,
) -> Result<(), String> {
    let tex = latexgen::generate(&document, &settings);
    std::fs::write(&path, tex).map_err(|e| format!("failed to write {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            app_version,
            compile_latex,
            default_settings,
            generate_latex,
            synctex_inverse,
            synctex_forward,
            preflight,
            export_pdf,
            export_tex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
