/**
 * Custom Shiki theme pair for the proof-green design system (docs/adr/0003).
 *
 * Syntax colors derive exclusively from the site's green/gold/neutral ramps —
 * no new hues. Every color is WCAG AA (≥4.5:1) against the panel token it
 * renders on (light `#f0f4f1`, dark `#232925`). Geist Mono ships at weight
 * 400 only, so the themes use no bold (it would render synthetically);
 * comments lean on synthetic oblique, which reads fine at code sizes.
 *
 * Role model (deliberately minimal, "monochrome plus"):
 * - keywords/storage/tags → green
 * - types/classes/components/attribute names → green, shifted in lightness
 * - strings → gold · numbers/constants/regex/escapes → gold, shifted
 * - functions/variables/properties → base ink · comments/punctuation → muted
 *
 * Fallback if this proves hard to scan (see ADR 0003 revisit triggers):
 * vitesse-light/vitesse-dark on the same panel tokens.
 */

type Palette = {
	base: string;
	comment: string;
	punct: string;
	keyword: string;
	type: string;
	string: string;
	number: string;
};

const light: Palette = {
	base: "#222724",
	comment: "#67726b",
	punct: "#545f58",
	keyword: "#176d47",
	type: "#0b5535",
	string: "#7d5e10",
	number: "#8a6410",
};

const dark: Palette = {
	base: "#dee4e0",
	comment: "#8e9b93",
	punct: "#a3afa8",
	keyword: "#4cc38a",
	type: "#a1dfc0",
	string: "#d9a944",
	number: "#e5c065",
};

/** Panel tokens; kept in sync with `--muted` in src/styles/global.css.
 * (The rendered background is pinned via `bg-muted` in typography.css —
 * these values only feed Shiki's `--shiki-*-bg` variables.) */
const backgrounds = { light: "#f0f4f1", dark: "#232925" };

function makeTheme(name: string, type: "light" | "dark", c: Palette) {
	return {
		name,
		type,
		colors: {
			"editor.background": backgrounds[type],
			"editor.foreground": c.base,
		},
		tokenColors: [
			{
				scope: ["comment", "punctuation.definition.comment"],
				settings: { foreground: c.comment, fontStyle: "italic" },
			},
			{
				scope: [
					"punctuation",
					"meta.brace",
					"keyword.operator",
					"punctuation.separator",
					"punctuation.terminator",
				],
				settings: { foreground: c.punct },
			},
			{
				scope: [
					"keyword",
					"storage",
					"storage.type",
					"storage.modifier",
					"keyword.control",
					"keyword.operator.new",
					"keyword.operator.expression",
					"variable.language.this",
					"variable.language.super",
					"entity.name.tag",
					"punctuation.definition.tag",
					"markup.heading",
				],
				settings: { foreground: c.keyword },
			},
			{
				scope: [
					"entity.name.type",
					"entity.name.class",
					"entity.other.inherited-class",
					"support.type",
					"support.class",
					"support.class.component",
					"entity.other.attribute-name",
					"support.type.property-name.json",
					"markup.bold",
				],
				settings: { foreground: c.type },
			},
			{
				scope: [
					"string",
					"string.template",
					"punctuation.definition.string",
					"markup.inline.raw",
				],
				settings: { foreground: c.string },
			},
			{
				scope: [
					"constant.numeric",
					"constant.language",
					"constant.character",
					"constant.character.escape",
					"support.constant",
					"variable.other.enummember",
					"string.regexp",
				],
				settings: { foreground: c.number },
			},
			{
				scope: [
					"entity.name.function",
					"support.function",
					"variable",
					"variable.other",
					"variable.parameter",
					"variable.other.property",
					"support.variable.property",
				],
				settings: { foreground: c.base },
			},
			{
				scope: ["markup.italic"],
				settings: { fontStyle: "italic" },
			},
		],
	};
}

export const proofLight = makeTheme("proof-light", "light", light);
export const proofDark = makeTheme("proof-dark", "dark", dark);
