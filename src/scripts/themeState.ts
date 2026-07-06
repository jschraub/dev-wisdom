/**
 * Theme state machine — pure logic, no DOM. Consumed by the header control
 * (`theme.ts`) and, via `define:vars`, by the first-paint inline script in
 * `Layout.astro`, so both derive state identically. See issue #8 / ADR 0003.
 *
 * Model: the *preference* is what the visitor chose (light | system | dark);
 * the *applied* theme is what the page renders (light | dark). Only explicit
 * light/dark preferences are persisted — "system" is the absence of a stored
 * value, so it always tracks the OS live.
 */

export type ThemePreference = "light" | "system" | "dark";
export type AppliedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** Button cycle order: light → system → dark → light. */
const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
	light: "system",
	system: "dark",
	dark: "light",
};

export const cyclePreference = (current: ThemePreference): ThemePreference =>
	NEXT_PREFERENCE[current];

/**
 * Interpret a raw stored value. Anything but an explicit "light"/"dark"
 * (missing key, legacy junk) means "system".
 */
export const parsePreference = (raw: string | null): ThemePreference =>
	raw === "light" || raw === "dark" ? raw : "system";

/** What to persist for a preference — `null` means "clear the pin". */
export const storedValueFor = (pref: ThemePreference): AppliedTheme | null =>
	pref === "system" ? null : pref;

export const resolveApplied = (
	pref: ThemePreference,
	systemPrefersDark: boolean,
): AppliedTheme =>
	pref === "system" ? (systemPrefersDark ? "dark" : "light") : pref;

/** Accessible name for the control, announced on each change. */
export const themeLabel = (
	pref: ThemePreference,
	applied: AppliedTheme,
): string =>
	pref === "system" ? `Theme: system (${applied})` : `Theme: ${pref}`;
