import { type Dirent, readdirSync, readFileSync } from "node:fs";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import {
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationWordHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import { SITE } from "./src/config";
import { satteriKatex } from "./src/utils/satteriKatex";
import { slugifyStr } from "./src/utils/slugify";
import { transformerFileName } from "./src/utils/transformers/fileName";

const BLOG_DIR = "src/data/blog";

/** Recursively collect markdown file paths relative to `base`. */
function walkMarkdown(dir: string, base: string): string[] {
	const out: string[] = [];
	let entries: Dirent[];
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const entry of entries) {
		const full = `${dir}/${entry.name}`;
		if (entry.isDirectory()) {
			out.push(...walkMarkdown(full, base));
		} else if (entry.name.endsWith(".md")) {
			out.push(full.slice(base.length + 1));
		}
	}
	return out;
}

/**
 * Build the set of `/posts/...` URL paths for every post marked `draft: true`.
 * Mirrors the URL construction in `src/utils/getPath.ts` so drafts can be kept
 * out of the public sitemap (their pages are still built as unlisted URLs).
 */
function getDraftUrlPaths(): Set<string> {
	const paths = new Set<string>();
	for (const rel of walkMarkdown(BLOG_DIR, BLOG_DIR)) {
		const raw = readFileSync(`${BLOG_DIR}/${rel}`, "utf8");
		const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!frontmatter || !/^draft:\s*true\s*$/m.test(frontmatter[1])) continue;

		const segments = rel.split("/");
		const fileName = (segments.pop() ?? "").replace(/\.md$/, "");
		// A `slug:` frontmatter field overrides the filename as the post id/URL.
		const slugMatch = frontmatter[1].match(/^slug:\s*["']?(.+?)["']?\s*$/m);
		const slug = slugifyStr(slugMatch ? slugMatch[1] : fileName);
		const dirs = segments
			.filter((segment) => segment && !segment.startsWith("_"))
			.map(slugifyStr);
		paths.add(["/posts", ...dirs, slug].join("/"));
	}
	return paths;
}

const draftUrlPaths = getDraftUrlPaths();

function isDraftUrl(page: string): boolean {
	try {
		const pathname = new URL(page).pathname.replace(/\/$/, "");
		for (const draftPath of draftUrlPaths) {
			if (pathname === draftPath || pathname.startsWith(`${draftPath}/`)) {
				return true;
			}
		}
	} catch {
		/* ignore malformed URLs */
	}
	return false;
}

// https://astro.build/config
export default defineConfig({
	site: SITE.website,

	// Astro 7 changed the default to "jsx" (JSX whitespace rules), which strips
	// whitespace between inline elements — templates here were written under
	// HTML rules ("a single space between inline elements is preserved").
	// Keep the pre-v7 behavior; revisit if templates are ever JSX-normalized.
	compressHTML: true,

	integrations: [
		sitemap({
			filter: (page) =>
				(SITE.showArchives || !page.endsWith("/archives")) && !isDraftUrl(page),
		}),
	],

	markdown: {
		// Astro 7's native Sätteri pipeline (the default processor), configured
		// explicitly to parse `$…$` / `$$…$$` math; satteriKatex renders those
		// nodes to KaTeX HTML at build time. See docs/adr/0002.
		processor: satteri({
			features: { math: true },
			mdastPlugins: [satteriKatex],
		}),
		shikiConfig: {
			// For more themes, visit https://shiki.style/themes
			themes: { light: "min-light", dark: "night-owl" },
			defaultColor: false,
			wrap: false,
			transformers: [
				transformerFileName({ style: "v2", hideDot: false }),
				transformerNotationHighlight(),
				transformerNotationWordHighlight(),
				transformerNotationDiff({ matchAlgorithm: "v3" }),
			],
		},
	},

	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
		ssr: {
			external: ["@resvg/resvg-js"],
		},
	},

	image: {
		responsiveStyles: true,
		layout: "constrained",
	},

	env: {
		schema: {
			PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
				access: "public",
				context: "client",
				optional: true,
			}),
		},
	},
});
