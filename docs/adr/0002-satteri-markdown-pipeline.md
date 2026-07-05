# 2. Use Astro's native Sätteri Markdown pipeline with a local KaTeX plugin

- Status: Accepted
- Date: 2026-07-05
- Deciders: Jared Schraub

## Context

When I upgraded to Astro 7 I initially pinned the legacy unified (remark/rehype)
pipeline via `markdown.processor: unified()` because the blog's Markdown config
used `remark-toc`, `remark-collapse`, `remark-math`, and `rehype-katex`. Astro 7
replaced that pipeline as the default with **Sätteri**, a Rust-based processor
with its own plugin model (`mdastPlugins` / `hastPlugins` + `features` toggles);
remark/rehype plugins do not run under it.

Pinning `unified()` was a compatibility hold, not a destination. I want the site
on modern, first-class patterns, so I audited what the remark plugins actually
did here:

- `remark-toc` + `remark-collapse`: **unused** — no post contains a
  "Table of contents" heading, so they were dead configuration. (If a TOC is
  ever wanted, the modern Astro approach is a component over the `headings`
  metadata from `render(entry)`, not a Markdown transform.)
- `remark-math` + `rehype-katex`: used by math posts. Sätteri parses
  `$…$` / `$$…$$` natively (`features: { math: true }`) but only *parses* —
  nothing renders the resulting `inlineMath`/`math` mdast nodes to HTML.
- Shiki + `@shikijs/transformers` (incl. the local `transformerFileName`):
  fully supported under Sätteri — `shikiConfig` feeds its highlighter directly.

The only ecosystem KaTeX plugin for Sätteri (`@nullpinter/satteri-katex` 0.1.2)
self-describes as a scaffold, so I wrote a local one instead:
`src/utils/satteriKatex.ts` — an mdast plugin that replaces `inlineMath`/`math`
nodes with `katex.renderToString(...)` output via Sätteri's `rawHtml` escape
hatch (~25 lines).

## Decision

- `markdown.processor: satteri({ features: { math: true }, mdastPlugins:
  [satteriKatex] })` in `astro.config.ts`.
- Remove `@astrojs/markdown-remark`, `remark-math`, `remark-toc`,
  `remark-collapse`, `rehype-katex`, and the `remark-collapse.d.ts` shim.
- Add `@astrojs/markdown-satteri` (the `satteri()` factory) and `satteri`
  (plugin types + `defineMdastPlugin`) as direct dependencies, version-aligned
  with what Astro 7 ships.
- Bump `katex` 0.16 → 0.17. This was previously held back because
  `rehype-katex` rendered with its own bundled katex 0.16 while the top-level
  dep only supplied the stylesheet; rendering math myself removes the split —
  markup and CSS now come from the same katex version.

## Consequences

Positive:

- Fully on Astro's default, actively developed pipeline; five dependencies and
  a type shim removed; the katex version hold is resolved.
- Verified output parity against the unified() build: identical page set,
  **identical heading IDs sitewide**, identical Shiki transformer markers,
  identical smartypants typography, identical rss.xml and sitemap. Only
  expected diffs: katex 0.17 markup/stylesheet and trivial HTML line-breaking.

Negative / accepted trade-offs:

- Sätteri is pre-1.0 (0.9.x, released with Astro 7 in June 2026); its plugin
  API may shift across minor versions. The local plugin is small enough to
  update easily.
- `satteriKatex` is mine to maintain. If an official/community KaTeX plugin
  matures, consider replacing it.
- Display math now renders wrapped in `<p>` (valid; `katex-display` CSS still
  renders it as a block). Cosmetic-only difference from rehype-katex output.

## Revisit trigger

- Sätteri 1.0 / plugin-API changes: re-check `satteriKatex` against the
  `MdastPluginDefinition` contract on Astro upgrades.
- An established Sätteri KaTeX plugin appearing in the ecosystem.
