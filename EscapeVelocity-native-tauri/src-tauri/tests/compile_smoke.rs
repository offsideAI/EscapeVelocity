//! Smoke test: the embedded Tectonic engine compiles a representative `memoir`
//! document — the *shape* EscapeVelocity's generator emits (sized class + trim
//! setup + chapter) — to a valid PDF, **offline** (cache-only mode).
//!
//! The offline guarantee covers documents in the generator's shape, which the
//! prewarm (`examples/prewarm_cache.rs`) exercises. Run that prewarm once (it
//! needs the network) to populate the cache; this test then needs no network.

use escapevelocity_native_tauri_lib::compile::latex_to_pdf;

#[test]
fn compiles_representative_memoir_to_pdf() {
    let tex = r"\documentclass[11pt,oneside]{memoir}
\setstocksize{9in}{6in}
\settrimmedsize{9in}{6in}{*}
\setlrmarginsandblock{0.875in}{0.625in}{*}
\setulmarginsandblock{0.9in}{0.9in}{*}
\checkandfixthelayout
\begin{document}
\chapter{Smoke Test}
Hello from EscapeVelocity.
\end{document}";
    let pdf = latex_to_pdf(tex).expect("Tectonic should compile a representative memoir doc");
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
