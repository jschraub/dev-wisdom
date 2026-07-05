import katex from "katex";
import { defineMdastPlugin } from "satteri";

/**
 * Render math parsed by Sätteri's `math` feature (`$…$` inline, `$$…$$`
 * display) to KaTeX HTML at build time. Sätteri only *parses* math into
 * mdast `inlineMath`/`math` nodes — without a renderer they fall through to
 * the HTML stage as plain code. This replaces them with `katex.renderToString`
 * output, paired with the `katex` stylesheet imported in `global.css`.
 */
export const satteriKatex = defineMdastPlugin({
	name: "katex",
	inlineMath(node, ctx) {
		ctx.replaceNode(node, {
			rawHtml: katex.renderToString(node.value, { throwOnError: false }),
		});
	},
	math(node, ctx) {
		ctx.replaceNode(node, {
			rawHtml: katex.renderToString(node.value, {
				displayMode: true,
				throwOnError: false,
			}),
		});
	},
});
