/** Shared TypeScript mirror of the Rust `latexgen::model` types. The Rust side
 *  is authoritative (it deserializes these); keep them in sync. From M3 the
 *  block editor serializes its document to this shape. */

export type Inline =
  | { type: "text"; value: string }
  | { type: "emphasis"; content: Inline[] }
  | { type: "strong"; content: Inline[] }
  | { type: "small_caps"; content: Inline[] }
  | { type: "link"; href: string; content: Inline[] }
  | { type: "footnote"; content: Inline[] };

export type Node =
  | { type: "part"; title: Inline[]; children: Node[] }
  | { type: "chapter"; title: Inline[]; children: Node[] }
  | { type: "section"; title: Inline[]; children: Node[] }
  | { type: "paragraph"; content: Inline[] }
  | { type: "heading"; level: number; content: Inline[] }
  | { type: "block_quote"; content: Inline[] }
  | { type: "verse"; lines: Inline[][] }
  | { type: "figure"; src: string; caption: Inline[] }
  | { type: "scene_break" }
  | { type: "pull_quote"; content: Inline[] }
  | { type: "raw_latex"; code: string };

export interface Document {
  front_matter: Node[];
  body: Node[];
  back_matter: Node[];
}

export type ParagraphStyle = "indent" | "spaced";
export type ChapterStyleKind = "plain" | "dropcap" | "versal" | "ornament" | "smallcaps";

export interface Settings {
  output_preset: string;
  trim: { width_in: number; height_in: number };
  bleed: boolean;
  margins: { inside_in: number; outside_in: number; top_in: number; bottom_in: number };
  body: {
    font: string;
    size_pt: number;
    leading_pt: number;
    justify: boolean;
    hyphenate: boolean;
    microtype: boolean;
  };
  paragraph: {
    style: ParagraphStyle;
    suppress_first_indent: boolean;
    widow_orphan_penalty: number;
  };
  chapter: { kind: ChapterStyleKind; recto_start: boolean; drop_folio: boolean };
  running_heads: { enabled: boolean };
}
