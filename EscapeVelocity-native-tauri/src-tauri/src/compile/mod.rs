//! Compilation pipeline.
//!
//! M1: compile LaTeX source to PDF bytes via the embedded Tectonic engine, using
//! a **pre-warmed, bundled cache** in **cache-only mode** so compilation is
//! fully offline — no TeX install, and (unlike the default web bundle) no
//! network contact at all. Later milestones extend this with SyncTeX output
//! (M4), a build directory + cancellable/debounced recompiles, and plain-language
//! diagnostics from the TeX log (M6).

use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use tectonic::config::PersistentConfig;
use tectonic::driver::{OutputFormat, ProcessingSessionBuilder};
use tectonic::status::NoopStatusBackend;

/// Compile a complete LaTeX document to PDF bytes using Tectonic, **offline**.
///
/// Uses `only_cached = true`, so the engine never contacts the network: every
/// support file must already be in the cache pointed at by `TECTONIC_CACHE_DIR`
/// (seeded from the bundled, pre-warmed cache by [`ensure_offline_cache`]). A
/// document needing a package outside the pre-warmed set will error rather than
/// silently fetch — keep the prewarm in sync with what `latexgen` emits.
pub fn latex_to_pdf(source: &str) -> Result<Vec<u8>, String> {
    compile_with(source, true)
}

/// Online variant: lets the engine fetch missing files from the network. Used
/// **only by the cache prewarm tool** to populate the bundled cache — never by
/// the app at runtime.
pub fn latex_to_pdf_fetching(source: &str) -> Result<Vec<u8>, String> {
    compile_with(source, false)
}

fn compile_with(source: &str, only_cached: bool) -> Result<Vec<u8>, String> {
    let mut status = NoopStatusBackend::default();

    let config = PersistentConfig::open(false).map_err(stringify_err)?;
    let bundle = config
        .default_bundle(only_cached)
        .map_err(stringify_err)?;
    let format_cache_path = config.format_cache_path().map_err(stringify_err)?;

    let mut files = {
        let mut sb = ProcessingSessionBuilder::default();
        sb.bundle(bundle)
            .primary_input_buffer(source.as_bytes())
            .tex_input_name("texput.tex")
            .format_name("latex")
            .keep_logs(false)
            .keep_intermediates(false)
            .format_cache_path(format_cache_path)
            .output_format(OutputFormat::Pdf)
            .do_not_write_output_files();
        let mut sess = sb.create(&mut status).map_err(stringify_err)?;
        sess.run(&mut status).map_err(stringify_err)?;
        sess.into_file_data()
    };

    match files.remove("texput.pdf") {
        Some(file) => Ok(file.data),
        None => Err("Tectonic produced no PDF output".to_string()),
    }
}

/// Flatten Tectonic's error chain into a readable message.
fn stringify_err(e: tectonic::Error) -> String {
    let mut msg = e.to_string();
    for cause in e.iter().skip(1) {
        msg.push_str("\n  caused by: ");
        msg.push_str(&cause.to_string());
    }
    msg
}

/// Guard so we only seed the cache + set the env var once per process.
static CACHE_READY: OnceLock<()> = OnceLock::new();

/// Ensure Tectonic uses a writable, pre-warmed cache so compiles work offline.
///
/// On first call, if the per-user cache isn't populated yet, it is seeded by
/// copying the bundled (read-only) `resource_cache` into `user_cache`; then
/// `TECTONIC_CACHE_DIR` is pointed there. Idempotent and cheap afterwards. If
/// neither cache is available (e.g. a dev build without the bundled resource),
/// this is a no-op and Tectonic falls back to its default cache location.
pub fn ensure_offline_cache(resource_cache: Option<PathBuf>, user_cache: PathBuf) {
    if CACHE_READY.get().is_some() {
        return;
    }

    let populated = |dir: &Path| dir.join("bundles").is_dir();

    if !populated(&user_cache) {
        if let Some(src) = resource_cache.filter(|p| populated(p)) {
            if let Err(e) = copy_dir_all(&src, &user_cache) {
                eprintln!("[compile] failed to seed offline Tectonic cache: {e}");
            }
        }
    }

    if populated(&user_cache) {
        // Safe here: called once at startup, on the main thread, before any
        // compile thread is spawned.
        std::env::set_var("TECTONIC_CACHE_DIR", &user_cache);
        let _ = CACHE_READY.set(());
    }
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let from = entry.path();
        let to = dst.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_all(&from, &to)?;
        } else {
            std::fs::copy(&from, &to)?;
        }
    }
    Ok(())
}
