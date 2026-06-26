//! Pre-warm a Tectonic cache with the package/feature set EscapeVelocity's
//! generator emits, so the shipped app compiles **fully offline** (cache-only
//! mode, zero network).
//!
//! Run it pointed at the cache dir to populate (needs network *once*):
//!
//! ```sh
//! TECTONIC_CACHE_DIR="$PWD/src-tauri/vendor/tectonic-cache" \
//!   cargo run --manifest-path src-tauri/Cargo.toml --example prewarm_cache
//! ```
//!
//! The resulting `vendor/tectonic-cache/` is bundled as a Tauri resource and
//! seeded into a writable per-user cache on first launch (see `compile`).
//!
//! It compiles several documents so the cache covers what real documents touch:
//! the body font sizes we expose (10/11/12 pt — each pulls its own `cmr*`/font
//! metrics) and the package/feature set (microtype, graphicx, chapter/section,
//! emphasis/strong/small-caps, footnotes, quotation, verse, ToC).
//!
//! NOTE: keep this in sync with what `latexgen` emits. As M2/M5 add `fontspec` +
//! bundled fonts, drop caps (`lettrine`), ornaments, etc., extend the documents
//! below so the offline cache stays complete.

use escapevelocity_native_tauri_lib::compile::latex_to_pdf_fetching;

fn document(class_options: &str) -> String {
    format!(
        r"\documentclass[{class_options}]{{memoir}}
\usepackage{{graphicx}}
\usepackage{{microtype}}

\setstocksize{{9in}}{{6in}}
\settrimmedsize{{9in}}{{6in}}{{*}}
\setlrmarginsandblock{{0.875in}}{{0.625in}}{{*}}
\setulmarginsandblock{{0.9in}}{{0.9in}}{{*}}
\checkandfixthelayout

\begin{{document}}
\frontmatter
\tableofcontents

\mainmatter
\chapter{{Sample Chapter}}
\section{{A Section}}

Body text with \emph{{emphasis}}, \textbf{{strong}}, and \textsc{{small caps}},
plus a footnote.\footnote{{Footnotes pull in their support files.}}

\begin{{quotation}}
A block quotation.
\end{{quotation}}

\begin{{verse}}
A line of verse \\
and another line.
\end{{verse}}

\clearpage
\end{{document}}
"
    )
}

fn main() {
    let cache = std::env::var("TECTONIC_CACHE_DIR").unwrap_or_else(|_| "<default>".into());
    eprintln!("prewarming Tectonic cache at: {cache}");

    // Cover the body sizes the inspector exposes; default (10pt) matches the
    // minimal smoke-test document, 11pt matches the sample fixture.
    for opts in ["10pt", "11pt", "12pt", "11pt,oneside", "12pt,oneside"] {
        eprint!("  compiling [{opts}] … ");
        match latex_to_pdf_fetching(&document(opts)) {
            Ok(pdf) => eprintln!("ok ({} bytes)", pdf.len()),
            Err(e) => {
                eprintln!("FAILED:\n{e}");
                std::process::exit(1);
            }
        }
    }
    eprintln!("prewarm complete.");
}
