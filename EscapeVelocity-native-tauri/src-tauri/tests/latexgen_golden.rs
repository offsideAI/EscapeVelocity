//! Golden + integration tests for the `latexgen` contract.
//!
//! - `golden_sample_6x9` pins the exact generated `.tex` for a fixed
//!   document + settings. Run with `BLESS=1` to regenerate after an intended
//!   change, then review the diff.
//! - `generation_is_deterministic` guards the "pure function" promise.
//! - `generated_sample_compiles` is the end-to-end check: generated LaTeX must
//!   actually compile (offline) to a PDF.

use escapevelocity_native_tauri_lib::compile::latex_to_pdf;
use escapevelocity_native_tauri_lib::latexgen::model::{Document, Settings};
use escapevelocity_native_tauri_lib::latexgen::{generate, presets::default_settings};

const SAMPLE_DOC: &str = include_str!("../../src/fixtures/sample.document.json");

fn sample() -> (Document, Settings) {
    let doc: Document = serde_json::from_str(SAMPLE_DOC).expect("sample.document.json parses");
    let settings = default_settings("kdp_6x9").expect("kdp_6x9 preset exists");
    (doc, settings)
}

#[test]
fn golden_sample_6x9() {
    let (doc, settings) = sample();
    let actual = generate(&doc, &settings);
    let golden = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/sample_6x9.tex");
    if std::env::var("BLESS").is_ok() {
        std::fs::write(golden, &actual).expect("write golden file");
    }
    let expected = std::fs::read_to_string(golden).unwrap_or_default();
    assert_eq!(actual, expected, "golden mismatch — run with BLESS=1 to update");
}

#[test]
fn generation_is_deterministic() {
    let (doc, settings) = sample();
    assert_eq!(
        generate(&doc, &settings),
        generate(&doc, &settings),
        "generate must be a pure function of its inputs"
    );
}

#[test]
fn generated_sample_compiles() {
    let (doc, settings) = sample();
    let tex = generate(&doc, &settings);
    let pdf = latex_to_pdf(&tex).expect("generated sample should compile to a PDF");
    assert!(pdf.starts_with(b"%PDF"), "output should be a PDF");
    assert!(pdf.len() > 1_000, "expected a multi-page PDF, got {} bytes", pdf.len());
}
