---
image: discriminated-unions-banner.png
post: discriminated-unions
tool: Google Gemini (image generation)
generated: 2026-06-26
aspect_ratio: "16:9"
alt: Several distinct geometric variant cards with exactly one illuminated and selected by a discriminant, the others dimmed
---

Prompt used to generate `discriminated-unions-banner.png`.

**Shares the blueprint visual language** of the Functional JavaScript series'
**8-banner set** — deep professional blue (`#006cac`), blueprint-grid aesthetic,
"engineering rigor, modernized" — but "Booleans Lie" is a **supporting post,
not one of the eight** (same standing as
[`functional-mindset-banner`](./functional-mindset-banner.prompt.md)). Series
banners for context:
[`your-functions-arent-functions-banner`](./your-functions-arent-functions-banner.prompt.md) (#1) ·
[`six-functional-patterns-banner`](./six-functional-patterns-banner.prompt.md) (#2) ·
[`errors-are-values-banner`](./errors-are-values-banner.prompt.md) (#3).

Subject visualizes the core idea — a value is **exactly one of** several possible
shapes, never several at once (the antidote to the post's boolean-soup hook).

Settings: 16:9 widescreen (doubles as the social/OG card). "No text" is
deliberate — generators garble lettering and the site renders the title itself.
Generate several variations and pick the one most consistent with the series
banners. Once generated, set `generated:` to the date and restore the `ogImage` +
body `![…]` reference in `src/data/blog/discriminated-unions.md`.

```text
Minimalist modern technical editorial illustration for a software-engineering blog, ultrawide 16:9 horizontal banner. Deep navy/slate background with a faint blueprint grid; one dominant accent of deep professional blue (#006cac) with a subtle cyan glow; clean flat geometric vector shapes, crisp thin lines, soft depth, lots of negative space; calm, sophisticated, precise. Subject: a balanced horizontal row of three or four distinct geometric variant cards or container shapes, each clearly a different form; exactly one of them is illuminated and "selected" — brighter, carrying the cyan glow, with a small connector or key routing into it from a single discriminant marker — while the others are present but dimmed and inactive; the composition reads as mutual exclusivity: a value that is exactly one of several possible shapes, never several at once; orderly, precise, calm. Absolutely no text, letters, numbers, words, symbols, logos, or screenshots.
```
