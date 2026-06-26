/**
 * Theme control.
 *
 * The token *values* live in `theme/theme.css` as CSS custom properties
 * (dark-first, with a `[data-theme="light"]` override). This module only flips
 * the active theme on the document root and persists the choice. The palette is
 * Zed-inspired but independently authored — see THIRD_PARTY.md.
 */
export type ThemeName = "dark" | "light";

const STORAGE_KEY = "ev.theme";

export function getStoredTheme(): ThemeName {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage may be unavailable; theme still applies for this session */
  }
}
