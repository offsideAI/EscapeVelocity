//! Export & print-correctness (M6).
//!
//! The compiled PDF is already print-ready in most respects — XeTeX embeds and
//! subsets all fonts, the page size is the real trim (or trim+bleed), and we
//! emit no crop marks. Export adds the **even-page-count** guarantee (KDP) by
//! recompiling with a trailing blank verso when needed, and the **KDP preflight**
//! validator reports pass/fix for the print rules before export.

use crate::compile;
use crate::latexgen::{self, model::Document, model::Settings, presets};

/// Append one blank, unnumbered page (used to make the count even).
const BLANK_VERSO: &str = "\\clearpage\\thispagestyle{empty}\\null\\clearpage\n";

#[derive(serde::Serialize)]
pub struct ExportInfo {
    pub page_count: usize,
    pub blank_added: bool,
}

pub struct ExportOutput {
    pub pdf: Vec<u8>,
    pub info: ExportInfo,
}

/// Compile the document and guarantee an even page count (KDP requirement) by
/// recompiling with a trailing blank verso if the first pass is odd.
pub fn export(document: &Document, settings: &Settings) -> Result<ExportOutput, String> {
    let tex = latexgen::generate(document, settings);
    let out = compile::compile_offline(&tex)?;
    let count = page_count(&out.pdf).ok_or("could not read the compiled PDF's page count")?;

    if count % 2 == 1 {
        let tex2 = tex.replace("\\end{document}", &format!("{BLANK_VERSO}\\end{{document}}"));
        let out2 = compile::compile_offline(&tex2)?;
        let count2 = page_count(&out2.pdf).unwrap_or(count + 1);
        return Ok(ExportOutput {
            pdf: out2.pdf,
            info: ExportInfo { page_count: count2, blank_added: true },
        });
    }

    Ok(ExportOutput {
        pdf: out.pdf,
        info: ExportInfo { page_count: count, blank_added: false },
    })
}

#[derive(serde::Serialize)]
pub struct Check {
    pub label: String,
    /// "pass" | "warn" | "fail"
    pub status: &'static str,
    pub detail: String,
    pub fix: Option<String>,
}

#[derive(serde::Serialize)]
pub struct PreflightReport {
    pub page_count: usize,
    pub checks: Vec<Check>,
}

/// Run the KDP preflight checks (compiles once to learn the page count).
pub fn preflight(document: &Document, settings: &Settings) -> Result<PreflightReport, String> {
    let tex = latexgen::generate(document, settings);
    let out = compile::compile_offline(&tex)?;
    let count = page_count(&out.pdf).ok_or("could not read the compiled PDF's page count")?;

    let mut checks = Vec::new();

    // Trim matches the chosen preset.
    let preset = presets::find(&settings.output_preset);
    let trim_ok = preset.is_none_or(|p| {
        (p.trim_w_in - settings.trim.width_in).abs() < 1e-3
            && (p.trim_h_in - settings.trim.height_in).abs() < 1e-3
    });
    checks.push(Check {
        label: "Trim matches preset".into(),
        status: if trim_ok { "pass" } else { "warn" },
        detail: format!("{} × {} in", settings.trim.width_in, settings.trim.height_in),
        fix: (!trim_ok).then(|| "Set the trim to the preset's size, or use a custom preset.".into()),
    });

    // Inside (gutter) margin adequate for the page count.
    let required = presets::kdp_gutter_in(count as u32);
    let gutter_ok = settings.margins.inside_in + 1e-9 >= required;
    checks.push(Check {
        label: "Gutter adequate for page count".into(),
        status: if gutter_ok { "pass" } else { "fail" },
        detail: format!(
            "inside margin {:.3} in; KDP needs ≥ {:.3} in at {} pages",
            settings.margins.inside_in, required, count
        ),
        fix: (!gutter_ok)
            .then(|| format!("Increase the inside margin to at least {required:.3} in.")),
    });

    // Fonts embedded.
    let fonts_ok = fonts_embedded(&out.pdf);
    checks.push(Check {
        label: "All fonts embedded".into(),
        status: if fonts_ok { "pass" } else { "fail" },
        detail: if fonts_ok {
            "every font is embedded/subset".into()
        } else {
            "a font is not embedded".into()
        },
        fix: (!fonts_ok).then(|| "Choose a bundled font in the inspector.".into()),
    });

    // Even page count (export fixes this automatically).
    let even = count % 2 == 0;
    checks.push(Check {
        label: "Even page count".into(),
        status: if even { "pass" } else { "warn" },
        detail: format!("{count} pages"),
        fix: (!even).then(|| "Export adds a blank final page to make the count even.".into()),
    });

    // No raster images yet (figures arrive later); no crop marks/transparency emitted.
    checks.push(Check {
        label: "Images ≥ 300 DPI".into(),
        status: "pass",
        detail: "no raster images in the document".into(),
        fix: None,
    });
    checks.push(Check {
        label: "No crop marks or transparency".into(),
        status: "pass",
        detail: "none emitted".into(),
        fix: None,
    });

    Ok(PreflightReport { page_count: count, checks })
}

/// Number of pages in a PDF, via lopdf.
fn page_count(pdf: &[u8]) -> Option<usize> {
    lopdf::Document::load_mem(pdf).ok().map(|d| d.get_pages().len())
}

/// True if every FontDescriptor in the PDF embeds its font program.
fn fonts_embedded(pdf: &[u8]) -> bool {
    let Ok(doc) = lopdf::Document::load_mem(pdf) else {
        return false;
    };
    for obj in doc.objects.values() {
        if let lopdf::Object::Dictionary(d) = obj {
            let is_fd = d
                .get(b"Type")
                .ok()
                .and_then(|t| t.as_name().ok())
                .map(|n| n == b"FontDescriptor")
                .unwrap_or(false);
            if is_fd {
                let embedded = d.get(b"FontFile").is_ok()
                    || d.get(b"FontFile2").is_ok()
                    || d.get(b"FontFile3").is_ok();
                if !embedded {
                    return false;
                }
            }
        }
    }
    true
}
