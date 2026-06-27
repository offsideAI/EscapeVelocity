//! Pre-warm a Tectonic cache with **exactly the LaTeX the generator emits**, so
//! the shipped app compiles fully offline (cache-only mode, zero network).
//!
//! It runs the real `latexgen` over the sample document at each body size the
//! inspector exposes — guaranteeing the cache covers the generator's package /
//! feature / font-metric footprint. As M5 adds `fontspec` + bundled fonts and
//! more chapter styles, this stays correct automatically (it compiles generator
//! output), only needing new sizes/presets added below.
//!
//! Populate the bundled cache (needs network once):
//! ```sh
//! npm run prewarm            # -> src-tauri/vendor/tectonic-cache
//! ```

use escapevelocity_native_tauri_lib::compile::latex_to_pdf_fetching;
use escapevelocity_native_tauri_lib::latexgen::{generate, model::Document, presets::default_settings};

const SAMPLE: &str = include_str!("../../src/fixtures/sample.document.json");

fn main() {
    let cache = std::env::var("TECTONIC_CACHE_DIR").unwrap_or_else(|_| "<default>".into());
    eprintln!("prewarming Tectonic cache at: {cache}");

    let doc: Document = serde_json::from_str(SAMPLE).expect("sample.document.json parses");

    for size in [10.0_f64, 11.0, 12.0] {
        let mut settings = default_settings("kdp_6x9").expect("preset exists");
        settings.body.size_pt = size;
        let tex = generate(&doc, &settings);

        eprint!("  compiling generator output @ {size}pt … ");
        match latex_to_pdf_fetching(&tex) {
            Ok(pdf) => eprintln!("ok ({} bytes)", pdf.len()),
            Err(e) => {
                eprintln!("FAILED:\n{e}");
                std::process::exit(1);
            }
        }
    }
    eprintln!("prewarm complete.");
}
