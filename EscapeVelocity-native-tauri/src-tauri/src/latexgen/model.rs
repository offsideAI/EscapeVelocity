//! The structured document model (`document.json`) and the page-setting model
//! (`settings.json`) — the typed inputs to the deterministic `latexgen`
//! contract. The document is the single source of truth for *content*; settings
//! own *layout*. Neither carries raw font/size/spacing on content nodes — only
//! semantic style — per the WYSIWYM principle.

use serde::{Deserialize, Serialize};

// ===================== document.json =====================

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Document {
    #[serde(default)]
    pub front_matter: Vec<Node>,
    #[serde(default)]
    pub body: Vec<Node>,
    #[serde(default)]
    pub back_matter: Vec<Node>,
}

/// A structured content node. Containers (`part`/`chapter`/`section`) nest
/// children; blocks carry inline content. Footnotes are modeled inline (they
/// anchor to a point in text), not as standalone blocks.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Node {
    Part {
        #[serde(default)]
        title: Vec<Inline>,
        #[serde(default)]
        children: Vec<Node>,
    },
    Chapter {
        #[serde(default)]
        title: Vec<Inline>,
        #[serde(default)]
        children: Vec<Node>,
    },
    Section {
        #[serde(default)]
        title: Vec<Inline>,
        #[serde(default)]
        children: Vec<Node>,
    },
    Paragraph {
        #[serde(default)]
        content: Vec<Inline>,
    },
    Heading {
        level: u8,
        #[serde(default)]
        content: Vec<Inline>,
    },
    BlockQuote {
        #[serde(default)]
        content: Vec<Inline>,
    },
    Verse {
        #[serde(default)]
        lines: Vec<Vec<Inline>>,
    },
    Figure {
        src: String,
        #[serde(default)]
        caption: Vec<Inline>,
    },
    SceneBreak,
    PullQuote {
        #[serde(default)]
        content: Vec<Inline>,
    },
    RawLatex {
        code: String,
    },
}

/// Inline content: plain text, semantic marks, and inline-anchored footnotes.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Inline {
    Text {
        value: String,
    },
    Emphasis {
        #[serde(default)]
        content: Vec<Inline>,
    },
    Strong {
        #[serde(default)]
        content: Vec<Inline>,
    },
    SmallCaps {
        #[serde(default)]
        content: Vec<Inline>,
    },
    Link {
        href: String,
        #[serde(default)]
        content: Vec<Inline>,
    },
    Footnote {
        #[serde(default)]
        content: Vec<Inline>,
    },
}

// ===================== settings.json =====================

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    /// Preset id (`kdp_6x9`, …) or `custom`. Informational; geometry below is
    /// authoritative once resolved.
    pub output_preset: String,
    pub trim: Trim,
    #[serde(default)]
    pub bleed: bool,
    pub margins: Margins,
    pub body: Body,
    #[serde(default)]
    pub paragraph: Paragraph,
    #[serde(default)]
    pub chapter: ChapterStyle,
    #[serde(default)]
    pub running_heads: RunningHeads,
}

/// Trimmed (final) page size in inches.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trim {
    pub width_in: f64,
    pub height_in: f64,
}

/// Margins in inches. `inside` is the spine/gutter side; with a two-sided book
/// it mirrors across recto/verso.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Margins {
    pub inside_in: f64,
    pub outside_in: f64,
    pub top_in: f64,
    pub bottom_in: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Body {
    /// Display name of the body font. M2 renders with the default Latin Modern
    /// (no `fontspec`); font selection via `fontspec` + bundled OTF arrives in M5.
    pub font: String,
    pub size_pt: f64,
    /// Baseline-to-baseline leading in points; `\linespread` is derived from it.
    pub leading_pt: f64,
    #[serde(default = "default_true")]
    pub justify: bool,
    #[serde(default = "default_true")]
    pub hyphenate: bool,
    #[serde(default = "default_true")]
    pub microtype: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ParagraphStyle {
    #[default]
    Indent,
    Spaced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paragraph {
    #[serde(default)]
    pub style: ParagraphStyle,
    #[serde(default = "default_true")]
    pub suppress_first_indent: bool,
    /// `\clubpenalty`/`\widowpenalty` value (higher = stronger avoidance).
    #[serde(default = "default_widow_penalty")]
    pub widow_orphan_penalty: i32,
}

fn default_widow_penalty() -> i32 {
    10_000
}

impl Default for Paragraph {
    fn default() -> Self {
        Self {
            style: ParagraphStyle::Indent,
            suppress_first_indent: true,
            widow_orphan_penalty: default_widow_penalty(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ChapterStyleKind {
    #[default]
    Plain,
    Dropcap,
    Versal,
    Ornament,
    Smallcaps,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterStyle {
    #[serde(default)]
    pub kind: ChapterStyleKind,
    /// Chapters open on a recto (right-hand) page.
    #[serde(default = "default_true")]
    pub recto_start: bool,
    /// Suppress the running head / use a plain folio on chapter-opening pages.
    #[serde(default = "default_true")]
    pub drop_folio: bool,
}

impl Default for ChapterStyle {
    fn default() -> Self {
        Self {
            kind: ChapterStyleKind::Plain,
            recto_start: true,
            drop_folio: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RunningHeads {
    #[serde(default)]
    pub enabled: bool,
}
