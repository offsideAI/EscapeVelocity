//! Compilation pipeline.
//!
//! M1: compile LaTeX source to PDF bytes via the embedded Tectonic engine.
//! Later milestones extend this with SyncTeX output (M4), a build directory +
//! cancellable/debounced recompiles, and plain-language diagnostics from the
//! TeX log (M6). For now we use Tectonic's one-shot `latex_to_pdf`, which is
//! enough to render a real page in the preview and prove the loop.

/// Compile a complete LaTeX document to PDF bytes using Tectonic.
///
/// On the very first run Tectonic fetches its support bundle from the network
/// and caches it; subsequent compiles are served from that cache. (Shipping an
/// offline pre-bundled cache is a remaining Story 1.1 task.)
pub fn latex_to_pdf(source: &str) -> Result<Vec<u8>, String> {
    tectonic::latex_to_pdf(source).map_err(|e| {
        // Tectonic's top-level message; the detailed TeX log surfaces in M6.
        let mut msg = e.to_string();
        for cause in e.iter().skip(1) {
            msg.push_str("\n  caused by: ");
            msg.push_str(&cause.to_string());
        }
        msg
    })
}
