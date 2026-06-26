---
image: errors-are-values-banner.png
post: errors-are-values
tool: Google Gemini (image generation)
generated: 2026-06-26
aspect_ratio: "16:9"
alt: Two parallel rails — a success track and a failure track — with orders flowing left to right and one diverging at a switch onto the lower track
---

Prompt used to generate `errors-are-values-banner.png`.

Part of a cohesive **8-banner set** for the Functional JavaScript series — one
banner per piece, in the same deep professional blue (`#006cac`), blueprint-grid
aesthetic, "engineering rigor, modernized." The set accretes as the series ships;
sister banners link each other as they land. Live so far:
[`your-functions-arent-functions-banner`](./your-functions-arent-functions-banner.prompt.md) (#1) ·
[`six-functional-patterns-banner`](./six-functional-patterns-banner.prompt.md) (#2) ·
this one (#3). [`functional-mindset-banner`](./functional-mindset-banner.prompt.md)
shares the visual language but predates the series and is **not** one of the eight.

This banner's subject deliberately mirrors the in-post railway diagram (the
hand-authored inline SVG): the success/failure tracks with a divert-and-short-circuit.

Settings: 16:9 widescreen (doubles as the social/OG card). "No text" is
deliberate — generators garble lettering and the site renders the title itself.
Generate several variations and pick the one most consistent with the other
series banners. Once generated, set `generated:` to the date and restore the
`ogImage` + body `![…]` reference in `src/data/blog/errors-are-values.md`.

```text
Minimalist modern technical editorial illustration for a software-engineering blog, ultrawide 16:9 horizontal banner. Deep navy/slate background with a faint blueprint grid; one dominant accent of deep professional blue (#006cac) with a subtle cyan glow; clean flat geometric vector shapes, crisp thin lines, soft depth, lots of negative space; calm, sophisticated, precise. Subject: two parallel horizontal rails reading as a railway — an upper "success" track and a lower "failure" track — with small glowing data tokens flowing left to right along the upper rail through a sequence of clean geometric stations; partway across, a smooth junction or track switch diverts one token down onto the lower rail, which then runs straight and express past the remaining stations to the far edge, bypassing them; the composition contrasts one clear happy path against a single diverted path that short-circuits to the end; orderly, precise, calm. Absolutely no text, letters, numbers, words, symbols, logos, or screenshots.
```
