//! Smoke test: the embedded Tectonic engine compiles a minimal `memoir`
//! document to a valid PDF.
//!
//! Note: Tectonic fetches its support bundle from the network on first run (then
//! caches it), so the first run of this test on a machine needs network access.

use escapevelocity_native_tauri_lib::compile::latex_to_pdf;

#[test]
fn compiles_minimal_memoir_to_pdf() {
    let tex = r"\documentclass{memoir}
\begin{document}
Hello from EscapeVelocity.
\end{document}";
    let pdf = latex_to_pdf(tex).expect("Tectonic should compile a minimal memoir doc");
    assert!(
        pdf.starts_with(b"%PDF"),
        "output should start with the PDF magic bytes"
    );
    assert!(
        pdf.len() > 1_000,
        "a one-page PDF should exceed 1KB, got {} bytes",
        pdf.len()
    );
}
