# 3. Replace the AstroPaper visual defaults with a proof-green design system

- Status: Accepted
- Date: 2026-07-05
- Deciders: Jared Schraub

## Context

The site still wore its AstroPaper theme defaults: the entire page — not just
code — rendered in the system monospace stack, and the two themes had no shared
identity (light was near-white with a blue accent `#006cac`; dark was navy
`#212737` with an orange accent `#ff6b01` and burnt-orange borders). Icons were
stock Tabler outlines, controls were the stock widgets (icon-swap theme toggle,
dedicated Pagefind search page, dashed underlines, wavy active-nav squiggle).

That look undersells what the blog is for. The articles are 10+ minute reads
about correctness — discriminated unions, parse-don't-validate, errors as
values — written by a UI engineer. The design should make long-form reading
comfortable and signal design maturity through restraint, not flash
("quiet confidence"). A monospace body actively fights the first goal; the
disconnected themes fight the second.

I also examined and rejected two tempting directions:

- **Default hues.** Blue, indigo/violet, terminal-green-on-black, and
  terracotta-on-cream are the saturated looks of the space; using them reads
  as template, not craft.
- **Per-series accent theming** (e.g. blueprint blue for the functional-TS
  series, re-accenting article pages by topic). Designed it, then killed it:
  readers arrive at articles via deep links, so the brand accent would become
  the accent of the least-visited pages, and with a single series the system
  reads as inconsistency. Do not resurrect without a real second series —
  issue [#3](https://github.com/jschraub/dev-wisdom/issues/3) holds the full
  handoff if that day comes.

Candidates were evaluated on live samples (real post content, both themes,
WCAG-checked) rather than swatches.

## Decision

- **Type: Geist for everything, Geist Mono for code.** One family, hierarchy
  from scale/weight (400/600). Body ~17px, line-height ~1.72, ~46rem measure.
  Self-hosted variable woff2 (no runtime Google Fonts request). The mono body
  is retired.
- **Palette: "proof green"** — one hue in both themes, tuned per ground; the
  color of the check that passes, which is what the catalog is about:

  | Token      | Light     | Dark ("charcoal") |
  | ---------- | --------- | ----------------- |
  | background | `#fbfcfb` | `#1b201d`         |
  | foreground | `#222724` | `#dee4e0`         |
  | muted text | `#5f6a64` | `#94a099`         |
  | panel      | `#f0f4f1` | `#232925`         |
  | border     | `#e1e7e3` | `#303733`         |
  | accent     | `#1a7a52` | `#4cc38a`         |

  Neutrals are green-biased rather than pure grey. A near-black dark ground
  was tried and rejected as harsh for long reading; ink contrast is
  deliberately ~13:1, not maximal. All pairs pass WCAG AA (accent 5.2:1
  light / 7.5:1 dark).
- **Gold second accent, strictly scoped:** `#8f6b13` light / `#d9a944` dark
  (AA 4.8:1 / 7.6:1). Allowed **only** on Featured marks and one gold
  `<mark>` highlight per article. Never on links, controls, chrome, or the
  brand mark. Scarcity is the point.
- **Icons: Phosphor**, regular weight everywhere; duotone reserved for gold
  moments (the Featured star). Tabler set removed.
- **Controls:**
  - Search becomes a ⌘K/Ctrl+K command-palette overlay (native `<dialog>`,
    same Pagefind index); `/search` stays as no-JS fallback and deep-link
    target.
  - Theme toggle becomes an explicit three-state light/system/dark cycle.
  - Code blocks get a custom Shiki theme pair built only from
    green/gold/neutral ramps on the panel tokens, replacing
    `min-light`/`night-owl` (whose navy ground belonged to the old theme).
- **Decoration language:** dashed underlines, wavy active-nav, accent-colored
  post H1, and italic H3 are retired — solid low-opacity underlines, a 2px
  accent nav underline, ink H1s, solid accent focus rings, green-tinted
  selection.
- **Scope:** site UI, OG image templates (currently IBM Plex Mono on an
  off-brand card), favicon/brand mark (green + neutrals, no gold). Article
  imagery (banner PNGs, inline SVG diagrams) is explicitly out of scope —
  tracked in issue [#3](https://github.com/jschraub/dev-wisdom/issues/3).

## Consequences

Positive:

- Long-form reading gets a proportional face at a proper measure; the themes
  share one identity ("the same room with the lights off").
- The accent is distinctive in the space *and* argues the blog's thesis;
  every color pairing is contrast-verified rather than inherited.
- Body and code sharing the Geist superfamily quietly signals a designed
  system — the identity the blog is meant to project.

Negative / accepted trade-offs:

- Self-hosted fonts add ~30–60 KB per weight-axis file versus the zero-cost
  system stack. Accepted: reading comfort is the product.
- The custom Shiki theme is a maintenance surface that battle-tested themes
  don't have. Accepted with a constraint: colors derive from the token ramps,
  and it must be validated against real TS/TSX samples for scanability.
- The ⌘K dialog and three-state toggle add client-side surface to what was a
  nearly-static site. Mitigated: native `<dialog>`, lazy Pagefind load, and
  the `/search` page kept as fallback.
- Jade accent and diff-add green coexist in dark mode. Verified acceptable in
  samples (different roles/lightness), but syntax-theme work must keep them
  distinguishable.

## Revisit trigger

- A genuine second article series exists → reopen the content-accent design
  via issue [#3](https://github.com/jschraub/dev-wisdom/issues/3)'s context.
- The custom Shiki theme proves hard to scan or maintain → fall back to
  `vitesse-light`/`vitesse-dark` on the panel tokens (the evaluated runner-up).
- Geist licensing/distribution changes (currently OFL via Vercel) → Inter is
  the drop-in replacement evaluated alongside it.
- Pagefind UI/API changes on upgrade → the modal wraps the same index; only
  the wrapper should need touching.

## Amendment — 2026-07-06: gold on the brand mark (issue #11)

The original scoping read "gold … never on links, controls, chrome, or the
brand mark." During slice 7 sign-off I chose a mark that breaks the last item
deliberately: the favicon is the JS monogram on the spruce plate with a
**gold check-as-period** — it reads "JS." at 16 px (the check collapses into
a literal period) and "JS ✓" at 32 px and above. The check is the *proof*
gesture, which is exactly the "one moment that matters" role gold plays
everywhere else in the system; after exploring strictly-green options
(monogram-only, proof-check-only, plateless variants), the signed monogram
carried the thesis best.

Scope of the exception: **the mark and its brand-surface embeddings** — the
favicon, the OG brand row, and the header wordmark's check-as-period. Links,
controls, and the rest of the chrome remain gold-free; the scarcity rules for
Featured marks and the per-article `<mark>` are unchanged.
