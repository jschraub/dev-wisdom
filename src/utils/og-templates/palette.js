/**
 * OG cards always render the light proof-green theme (docs/adr/0003) —
 * social-card consumers don't know the viewer's theme, and light is the
 * brand's canonical face. Values mirror the light tokens in global.css.
 */
export const OG = {
	background: "#fbfcfb",
	foreground: "#222724",
	muted: "#5f6a64",
	accent: "#1a7a52",
	border: "#e1e7e3",
	panel: "#f0f4f1",
};
