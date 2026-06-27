//! SyncTeX is produced and parses into usable preview↔source mappings.
use escapevelocity_native_tauri_lib::compile::{compile_offline, synctex::SyncTex};
use escapevelocity_native_tauri_lib::latexgen::{generate, model::Document, presets::default_settings};

#[test]
fn synctex_maps_preview_and_source() {
    let doc: Document =
        serde_json::from_str(include_str!("../../src/fixtures/sample.document.json")).unwrap();
    let settings = default_settings("kdp_6x9").unwrap();
    let tex = generate(&doc, &settings);

    let out = compile_offline(&tex).expect("compile");
    let raw = out.synctex.expect("synctex produced");
    let syn = SyncTex::parse(&raw).expect("synctex parses");

    assert!(syn.inverse(1, 0.3).is_some(), "inverse should resolve a source line");
    assert!(syn.forward(38).is_some(), "forward should resolve a preview page");
}
