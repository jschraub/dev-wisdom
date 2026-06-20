import { readdirSync, readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import { SITE } from "./src/config";
import { slugifyStr } from "./src/utils/slugify";
import { transformerFileName } from "./src/utils/transformers/fileName";

const BLOG_DIR = "src/data/blog";

/** Recursively collect markdown file paths relative to `base`. */
function walkMarkdown(dir: string, base: string): string[] {
  const out: string[] = [];
  let entries;
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
    const fileName = segments.pop()!.replace(/\.md$/, "");
    // A `slug:` frontmatter field overrides the filename as the post id/URL.
    const slugMatch = frontmatter[1].match(/^slug:\s*["']?(.+?)["']?\s*$/m);
    const slug = slugifyStr(slugMatch ? slugMatch[1] : fileName);
    const dirs = segments
      .filter(segment => segment && !segment.startsWith("_"))
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

  integrations: [
    sitemap({
      filter: page =>
        (SITE.showArchives || !page.endsWith("/archives")) && !isDraftUrl(page),
    }),
  ],

  markdown: {
    remarkPlugins: [
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
      remarkMath,
    ],
    rehypePlugins: [rehypeKatex],
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
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
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

  experimental: {
    preserveScriptOrder: true,
  },
});
