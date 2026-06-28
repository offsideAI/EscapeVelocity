/** Inspector option lists. Mirror the Rust registries (`latexgen::presets`):
 *  ids are authoritative there; these are just labels for the UI. */
export const PRESETS = [
  { id: "kdp_6x9", label: "KDP Paperback 6 × 9 in" },
  { id: "kdp_5x8", label: "KDP Paperback 5 × 8 in" },
  { id: "kdp_5.5x8.5", label: "KDP Paperback 5.5 × 8.5 in" },
  { id: "kdp_8.5x11", label: "KDP 8.5 × 11 in" },
  { id: "ingramspark_5.5x8.5", label: "IngramSpark 5.5 × 8.5 in" },
  { id: "ingramspark_6x9", label: "IngramSpark 6 × 9 in" },
] as const;

export const TEMPLATES = [
  { id: "", label: "Start from a template…" },
  { id: "literary_5x8", label: "Literary Fiction · 5 × 8" },
  { id: "nonfiction_6x9", label: "Nonfiction · 6 × 9" },
  { id: "memoir_5.5x8.5", label: "Memoir · 5.5 × 8.5" },
] as const;

export const FONTS = [
  { id: "ebgaramond", label: "EB Garamond" },
  { id: "libertinus", label: "Libertinus Serif" },
  { id: "pagella", label: "TeX Gyre Pagella" },
  { id: "lmroman", label: "Latin Modern Roman" },
  { id: "cm", label: "Computer Modern" },
] as const;

export const PARAGRAPH_STYLES = [
  { id: "indent", label: "Indented" },
  { id: "spaced", label: "Spaced" },
] as const;
