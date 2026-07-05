---
image: parse-dont-validate-banner.png
post: parse-dont-validate
tool: Google Gemini (image generation)
generated: 2026-07-04
aspect_ratio: "16:9"
alt: Ragged, mismatched data fragments funneling into a single boundary gate and emerging on the far side as one clean, uniform typed shape
---

Prompt used to generate `parse-dont-validate-banner.png`.

Part of the cohesive **8-banner set** for the Functional JavaScript series — one
banner per piece, in the same deep professional blue (`#006cac`), blueprint-grid
aesthetic, "engineering rigor, modernized." The set accretes as the series ships;
sister banners link each other as they land. Live so far:
[`your-functions-arent-functions-banner`](./your-functions-arent-functions-banner.prompt.md) (#1) ·
[`six-functional-patterns-banner`](./six-functional-patterns-banner.prompt.md) (#2) ·
[`errors-are-values-banner`](./errors-are-values-banner.prompt.md) (#3) ·
this one (#4). The [`discriminated-unions-banner`](./discriminated-unions-banner.prompt.md)
and [`functional-mindset-banner`](./functional-mindset-banner.prompt.md) share the
visual language but are supporting posts, **not** among the eight.

This banner's subject visualizes the post's core discipline — **parse at the
boundary**: untrusted, mismatched input crossing a single edge and coming out the
other side as one clean, uniform, trustworthy shape. It deliberately rhymes with
#3's railway (a boundary/gate where data is sorted and made honest) without
repeating it.

Settings: 16:9 widescreen (doubles as the social/OG card). "No text" is
deliberate — generators garble lettering and the site renders the title itself.
Generate several variations and pick the one most consistent with the other
series banners. Once generated, set `generated:` to the date and restore the
`ogImage` + body `![…]` reference (and remove the "Banner pending" comment) in
`src/data/blog/parse-dont-validate.md`.

```text
Minimalist modern technical editorial illustration for a software-engineering blog, ultrawide 16:9 horizontal banner. Deep navy/slate background with a faint blueprint grid; one dominant accent of deep professional blue (#006cac) with a subtle cyan glow; clean flat geometric vector shapes, crisp thin lines, soft depth, lots of negative space; calm, sophisticated, precise. Subject: on the left, a scattered cluster of ragged, mismatched, irregular geometric fragments in muted grey — data of inconsistent and untrustworthy shapes drifting inward; at the center, a single clean vertical boundary — a precise gate or narrow aperture in a thin blueprint line — that all the fragments must pass through; on the right, emerging from the gate, the fragments have become one orderly row of identical, crisp, glowing uniform shapes carrying the cyan accent — clean, validated, trustworthy, all alike. The composition reads left-to-right as messy untrusted input funneled through one boundary and transformed into a single honest, uniform type; the checking happens only at that central gate. Orderly, precise, calm. Absolutely no text, letters, numbers, words, symbols, logos, or screenshots.
```
