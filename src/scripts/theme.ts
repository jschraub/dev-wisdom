import {
	type AppliedTheme,
	cyclePreference,
	DARK_SCHEME_QUERY,
	parsePreference,
	resolveApplied,
	storedValueFor,
	THEME_STORAGE_KEY,
	type ThemePreference,
	themeLabel,
} from "./themeState";

const darkScheme = window.matchMedia(DARK_SCHEME_QUERY);

function readStoredPreference(): ThemePreference {
	try {
		return parsePreference(localStorage.getItem(THEME_STORAGE_KEY));
	} catch {
		return "system";
	}
}

/**
 * In-memory preference. Module state survives view transitions (the module
 * runs once per real page load), so navigations don't re-read storage.
 */
let preference: ThemePreference = readStoredPreference();

function persistPreference(pref: ThemePreference): void {
	try {
		const value = storedValueFor(pref);
		if (value === null) {
			localStorage.removeItem(THEME_STORAGE_KEY);
		} else {
			localStorage.setItem(THEME_STORAGE_KEY, value);
		}
	} catch {
		/* storage unavailable (private mode) — theme still works per-page */
	}
}

/** Reflect preference + applied theme onto the DOM. */
function apply(): void {
	const applied: AppliedTheme = resolveApplied(preference, darkScheme.matches);
	const root = document.documentElement;
	root.setAttribute("data-theme", applied);
	root.setAttribute("data-theme-preference", preference);

	const label = themeLabel(preference, applied);
	const button = document.querySelector("#theme-btn");
	button?.setAttribute("aria-label", label);
	button?.setAttribute("title", label);

	// Keep the browser chrome (mobile address bar) on the applied theme's
	// background.
	const body = document.body;
	if (body) {
		const bgColor = window.getComputedStyle(body).backgroundColor;
		document
			.querySelector("meta[name='theme-color']")
			?.setAttribute("content", bgColor);
	}
}

function bindControl(): void {
	// re-apply on load / after swap so the (new) button announces current state
	apply();

	document.querySelector("#theme-btn")?.addEventListener("click", () => {
		preference = cyclePreference(preference);
		persistPreference(preference);
		apply();
	});
}

bindControl();

// The swapped-in document carries a fresh button and default attributes —
// re-apply state and re-bind.
document.addEventListener("astro:after-swap", bindControl);

// Set theme-color on the incoming document before the transition paints, to
// avoid navigation-bar color flickering in Android dark mode.
document.addEventListener("astro:before-swap", (event) => {
	const bgColor = document
		.querySelector("meta[name='theme-color']")
		?.getAttribute("content");

	if (bgColor) {
		event.newDocument
			.querySelector("meta[name='theme-color']")
			?.setAttribute("content", bgColor);
	}
});

// Follow OS preference live — but only while the visitor hasn't pinned a
// theme, and never persist what the OS chose.
darkScheme.addEventListener("change", () => {
	if (preference === "system") apply();
});
