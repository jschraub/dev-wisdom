/**
 * Kebab-case slugifier, drop-in replacement for `lodash.kebabcase`:
 * strips diacritics and apostrophes, splits camelCase and letter/digit
 * boundaries, lowercases, and joins word runs with "-".
 * e.g. "Déjà Vu' 2.0" -> "deja-vu-2-0", "fooBar" -> "foo-bar"
 */
export const slugifyStr = (str: string) =>
	str
		.normalize("NFKD") // decompose accented chars…
		.replace(/[̀-ͯ]/g, "") // …then drop the accents
		.replace(/['‘’]/g, "") // apostrophes vanish, not hyphenate
		.replace(/([a-z\d])([A-Z])/g, "$1-$2") // camelCase boundary
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2") // ACRONYMWord boundary
		.replace(/([a-zA-Z])(\d)/g, "$1-$2") // letter→digit boundary
		.replace(/(\d)([a-zA-Z])/g, "$1-$2") // digit→letter boundary
		.toLowerCase()
		.replace(/[^a-z\d]+/g, "-") // any other run → single "-"
		.replace(/^-+|-+$/g, ""); // no leading/trailing "-"

export const slugifyAll = (arr: string[]) => arr.map((str) => slugifyStr(str));
