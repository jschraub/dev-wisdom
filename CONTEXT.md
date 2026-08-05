# CONTEXT.md

Things this repo's code does not make obvious. Decisions live in `docs/adr/`.

## Drafts and publishing

"Draft" means either `draft: true` **or** a `pubDatetime` in the future — both
build at their own URL and appear in no listing. Never branch on `data.draft`
alone; use `isPublished()` from `src/utils/postFilter.ts`.

**A scheduled post does not publish itself.** Visibility resolves at build
time, so merging a future-dated post is not enough — something has to trigger a
Cloudflare Pages build at the publish moment. See
[ADR-0004](docs/adr/0004-draft-and-scheduled-post-visibility.md).

## Dev is not a visibility check

`postFilter` returns `true` under `import.meta.env.DEV`, so `pnpm dev` shows
drafts everywhere. To see what the public gets:

```bash
pnpm build
grep -c "<slug>" dist/index.html dist/rss.xml dist/archives/index.html dist/sitemap-0.xml
```

## Decisions worth reading before you work

| ADR | Read it before |
| --- | --- |
| [0001](docs/adr/0001-biome-code-only-astro-formatting.md) | Touching formatter config. Biome formats `.astro` **code only** — its experimental full support cannot parse `{/* … */}`, so Prettier still owns template markup. |
| [0002](docs/adr/0002-satteri-markdown-pipeline.md) | Adding a Markdown plugin. The pipeline is Sätteri, not remark/rehype — those plugins do not run. Math is `features: { math: true }` plus a KaTeX mdast plugin. |
| [0003](docs/adr/0003-visual-design-system-proof-green.md) | Any visual change. Defines the proof-green system: jade accent, gold reserved for *proof*, Geist typography. Per-series accent theming was designed and rejected twice. |
| [0004](docs/adr/0004-draft-and-scheduled-post-visibility.md) | Changing what appears in a listing. The draft rule above, and why it is implemented twice. |
