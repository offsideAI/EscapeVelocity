//! Export produces an even-page, font-embedded PDF; preflight passes for the
//! default 6×9 sample.
use escapevelocity_native_tauri_lib::export::{export, preflight};
use escapevelocity_native_tauri_lib::latexgen::model::{Document, Settings};
use escapevelocity_native_tauri_lib::latexgen::presets::default_settings;

fn sample() -> (Document, Settings) {
    let doc: Document =
        serde_json::from_str(include_str!("../../src/fixtures/sample.document.json")).unwrap();
    (doc, default_settings("kdp_6x9").unwrap())
}

#[test]
fn export_is_even_pages_and_valid_pdf() {
    let (doc, settings) = sample();
    let out = export(&doc, &settings).expect("export");
    assert!(out.pdf.starts_with(b"%PDF"), "must be a PDF");
    assert_eq!(out.info.page_count % 2, 0, "page count must be even ({})", out.info.page_count);
}

#[test]
fn preflight_has_no_failures_for_sample() {
    let (doc, settings) = sample();
    let report = preflight(&doc, &settings).expect("preflight");
    let fails: Vec<_> = report.checks.iter().filter(|c| c.status == "fail").map(|c| &c.label).collect();
    assert!(fails.is_empty(), "unexpected failures: {fails:?}");
    assert!(
        report.checks.iter().any(|c| c.label.contains("embedded") && c.status == "pass"),
        "fonts-embedded check should pass"
    );
}
