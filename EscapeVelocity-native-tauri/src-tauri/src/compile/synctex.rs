//! Minimal SyncTeX reader for click-to-jump between the PDF preview and the
//! generated source.
//!
//! We collect, per page, the `(vertical position, source line)` of every record
//! belonging to our input file (tag 1 = the generated `texput.tex`) and map by
//! **vertical fraction** of the page's content. That sidesteps SyncTeX's absolute
//! unit/offset calibration while giving accurate enough line jumps for editing.

use std::collections::BTreeMap;
use std::io::Read;

pub struct SyncTex {
    /// page (1-based) -> records sorted by vertical position: (v, line)
    pages: BTreeMap<u32, Vec<(i64, u32)>>,
    /// page -> (v_min, v_max) of its content
    bounds: BTreeMap<u32, (i64, i64)>,
}

impl SyncTex {
    /// Parse gzipped SyncTeX bytes. Returns `None` if there's nothing usable.
    pub fn parse(gz: &[u8]) -> Option<SyncTex> {
        let mut text = String::new();
        flate2::read::GzDecoder::new(gz)
            .read_to_string(&mut text)
            .ok()?;

        let mut pages: BTreeMap<u32, Vec<(i64, u32)>> = BTreeMap::new();
        let mut current: Option<u32> = None;
        let mut in_content = false;

        for line in text.lines() {
            if !in_content {
                if line == "Content:" {
                    in_content = true;
                }
                continue;
            }
            let Some(&first) = line.as_bytes().first() else {
                continue;
            };
            match first {
                b'{' => current = line[1..].trim().parse::<u32>().ok(),
                b'}' => current = None,
                // Records that carry a position: boxes, points, glue, kern, rule.
                b'[' | b'(' | b'h' | b'v' | b'x' | b'g' | b'k' | b'r' | b'$' => {
                    if let Some(page) = current {
                        if let Some((tag, ln, v)) = parse_record(&line[1..]) {
                            if tag == 1 {
                                pages.entry(page).or_default().push((v, ln));
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        if pages.is_empty() {
            return None;
        }

        let mut bounds = BTreeMap::new();
        for (page, recs) in pages.iter_mut() {
            recs.sort_by_key(|&(v, _)| v);
            let vmin = recs.first().map_or(0, |&(v, _)| v);
            let vmax = recs.last().map_or(0, |&(v, _)| v);
            bounds.insert(*page, (vmin, vmax));
        }
        Some(SyncTex { pages, bounds })
    }

    /// PDF click → source line. `y_frac` is 0 at the page top, 1 at the bottom.
    pub fn inverse(&self, page: u32, y_frac: f64) -> Option<u32> {
        let recs = self.pages.get(&page)?;
        let (vmin, vmax) = *self.bounds.get(&page)?;
        let span = (vmax - vmin).max(1) as f64;
        let target = vmin as f64 + y_frac.clamp(0.0, 1.0) * span;
        recs.iter()
            .min_by(|a, b| {
                let da = (a.0 as f64 - target).abs();
                let db = (b.0 as f64 - target).abs();
                da.total_cmp(&db)
            })
            .map(|&(_, ln)| ln)
    }

    /// Source line → first matching `(page, vertical fraction)`.
    pub fn forward(&self, line: u32) -> Option<(u32, f64)> {
        let mut best: Option<(u32, i64)> = None;
        for (page, recs) in &self.pages {
            for &(v, ln) in recs {
                if ln == line {
                    match best {
                        Some((_, bv)) if v >= bv => {}
                        _ => best = Some((*page, v)),
                    }
                }
            }
        }
        let (page, v) = best?;
        let (vmin, vmax) = *self.bounds.get(&page)?;
        let frac = if vmax > vmin {
            (v - vmin) as f64 / (vmax - vmin) as f64
        } else {
            0.0
        };
        Some((page, frac))
    }
}

/// Parse `<tag>,<line>:<h>,<v>[:…]` → (tag, line, v).
fn parse_record(rest: &str) -> Option<(u32, u32, i64)> {
    let mut sections = rest.split(':');
    let tag_line = sections.next()?;
    let hv = sections.next()?;

    let mut tl = tag_line.split(',');
    let tag: u32 = tl.next()?.trim().parse().ok()?;
    let ln: u32 = tl.next()?.trim().parse().ok()?;

    let mut coords = hv.split(',');
    let _h = coords.next()?;
    let v: i64 = coords.next()?.trim().parse().ok()?;
    Some((tag, ln, v))
}
