//! Pre-warm a Tectonic cache with **exactly the LaTeX the generator emits**, so
//! the shipped app compiles fully offline (cache-only mode, zero network).
//!
//! It runs the real `latexgen` over the sample document for every curated body
//! font (each pulls its OTF + the `fontspec` machinery) and across the body
//! sizes the inspector exposes — guaranteeing the offline cache covers the
//! generator's footprint. Extend the loops below as M5+ add fonts/sizes.
//!
//! Populate the bundled cache (needs network once):
//! ```sh
//! npm run prewarm            # -> src-tauri/vendor/tectonic-cache
//! ```

use escapevelocity_native_tauri_lib::compile::latex_to_pdf_fetching;
use escapevelocity_native_tauri_lib::latexgen::{
    generate,
    model::Document,
    presets::{default_settings, FONTS},
};

const SAMPLE: &str = include_str!("../../src/fixtures/sample.document.json");

fn main() {
    let cache = std::env::var("TECTONIC_CACHE_DIR").unwrap_or_else(|_| "<default>".into());
    eprintln!("prewarming Tectonic cache at: {cache}");

    let doc: Document = serde_json::from_str(SAMPLE).expect("sample.document.json parses");

    let warm = |label: String, tex: String| {
        eprint!("  {label} … ");
        match latex_to_pdf_fetching(&tex) {
            Ok(pdf) => eprintln!("ok ({} bytes)", pdf.len()),
            Err(e) => {
                eprintln!("FAILED:\n{e}");
                std::process::exit(1);
            }
        }
    };

    // Every curated font at the default size.
    for font in FONTS {
        let mut settings = default_settings("kdp_6x9").expect("preset exists");
        settings.body.font = font.id.to_string();
        warm(format!("font {}", font.id), generate(&doc, &settings));
    }

    // The default font across the other body sizes.
    for size in [10.0_f64, 12.0] {
        let mut settings = default_settings("kdp_6x9").expect("preset exists");
        settings.body.size_pt = size;
        warm(format!("size {size}pt"), generate(&doc, &settings));
    }

    eprintln!("prewarm complete.");
}
