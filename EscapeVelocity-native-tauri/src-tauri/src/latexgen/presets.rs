//! Print presets — the **single, data-driven** source for trim sizes and the
//! KDP gutter-by-page-count table. Print-spec changes happen here, never spread
//! across the generator. (PRD risk: "print-spec drift".)

use super::model::{
    Body, ChapterStyle, Margins, Paragraph, RunningHeads, Settings, Trim,
};

/// A named output preset: a trim size and whether bleed is meaningful.
pub struct Preset {
    pub id: &'static str,
    pub label: &'static str,
    pub trim_w_in: f64,
    pub trim_h_in: f64,
}

/// Supported presets. IngramSpark + more trims are added in M7.
pub const PRESETS: &[Preset] = &[
    Preset { id: "kdp_6x9", label: "KDP Paperback 6 × 9 in", trim_w_in: 6.0, trim_h_in: 9.0 },
    Preset { id: "kdp_5x8", label: "KDP Paperback 5 × 8 in", trim_w_in: 5.0, trim_h_in: 8.0 },
    Preset { id: "kdp_5.5x8.5", label: "KDP Paperback 5.5 × 8.5 in", trim_w_in: 5.5, trim_h_in: 8.5 },
    Preset { id: "kdp_8.5x11", label: "KDP 8.5 × 11 in", trim_w_in: 8.5, trim_h_in: 11.0 },
];

pub fn find(id: &str) -> Option<&'static Preset> {
    PRESETS.iter().find(|p| p.id == id)
}

/// KDP's minimum inside (gutter) margin by page count, in inches. The inside
/// margin must grow with thickness so text isn't lost in the spine.
/// Source: KDP paperback manuscript guidelines.
pub fn kdp_gutter_in(page_count: u32) -> f64 {
    match page_count {
        0..=150 => 0.375,
        151..=300 => 0.5,
        301..=500 => 0.625,
        501..=700 => 0.75,
        _ => 0.875,
    }
}

/// A sensible default `Settings` for a preset — a readable literary interior.
/// The PageSetting inspector (M5) lets the user override every field; this is
/// the starting point and the basis for golden tests.
pub fn default_settings(preset_id: &str) -> Option<Settings> {
    let p = find(preset_id)?;
    // Outer margins scale gently with trim; inside margin uses the smallest
    // gutter bucket (the inspector refines it from the real page count in M5).
    Some(Settings {
        output_preset: p.id.to_string(),
        trim: Trim { width_in: p.trim_w_in, height_in: p.trim_h_in },
        bleed: false,
        margins: Margins {
            inside_in: 0.875,
            outside_in: 0.625,
            top_in: 0.9,
            bottom_in: 0.9,
        },
        body: Body {
            font: "Latin Modern Roman".to_string(),
            size_pt: 11.0,
            leading_pt: 14.5,
            justify: true,
            hyphenate: true,
            microtype: true,
        },
        paragraph: Paragraph::default(),
        chapter: ChapterStyle::default(),
        running_heads: RunningHeads { enabled: true },
    })
}
