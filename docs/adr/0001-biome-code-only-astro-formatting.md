# 1. Use Biome in "code-only" mode for `.astro` files

- Status: Accepted
- Date: 2026-07-05
- Deciders: Jared Schraub

## Context

I migrated the toolchain from ESLint + Prettier to [Biome](https://biomejs.dev)
(single tool for linting + formatting). Biome added support for `.astro` files
in 2.3, and 2.5 offers **experimental full support** — formatting the entire
`.astro` file including template markup — behind the
`html.experimentalFullSupportEnabled` flag. I initially wanted this, so a single
tool would own formatting end-to-end and Prettier (incl. `prettier-plugin-astro`)
could be dropped entirely.

While enabling it, I hit a hard blocker: **Biome 2.5's experimental Astro
parser cannot parse JSX expression comments (`{/* … */}`)** — not even a
standalone one, in isolation. This construct is idiomatic Astro and appears in
several components (`Layout.astro`, `index.astro`, `Breadcrumb.astro`, …).
With full support enabled, `biome format` **hard-errors** on every such file
("Unexpected value or character"), which would break CI. The only ways to keep
full support would be to (a) strip/relocate every JSX comment from templates —
now and forever, since any new one re-breaks the build — or (b) exclude the
affected files, which fragments coverage. Both are unacceptable.

I'm on the **latest Biome (2.5.2)**; no newer release fixes this, so it is a
current limitation of the experimental support, not a version-lag issue.

## Decision

Use Biome in **code-only mode** for `.astro` files
(`html.experimentalFullSupportEnabled: false`, the default):

- Biome formats and lints the **JS/TS in `.astro` frontmatter and `<script>`
  blocks**, plus all `.ts` / `.css` / `.json`.
- Biome **does not reformat `.astro` template markup**. It is left as-authored.
- Because Biome cannot see template usage in code-only mode, `noUnusedImports`
  and `noUnusedVariables` are **disabled for `.astro`** via an `overrides` entry
  (they would otherwise flag every component/variable used only in markup).
  `astro check` remains the source of truth for genuinely unused symbols.

Prettier and all its plugins are removed.

## Consequences

Positive:

- Single tool (Biome) for the whole repo; fast; no ESLint/Prettier config sprawl.
- `.astro` frontmatter and script code is still fully formatted and linted.
- CI is stable — no parser crashes on idiomatic Astro.

Negative / accepted trade-offs:

- **`.astro` template markup is no longer auto-formatted.** Authors format markup
  by hand / via the Astro VS Code extension. (Previously `prettier-plugin-astro`
  did this.)
- **Tailwind class sorting no longer reaches `.astro` templates.** Biome's
  `useSortedClasses` only covers `class`/`className` string literals in JS/TS,
  which this repo doesn't use in template markup. (Previously
  `prettier-plugin-tailwindcss` sorted template classes.)
- Unused-symbol detection in `.astro` relies on `astro check`, not Biome.

## Revisit trigger

Re-enable full template formatting when **Biome's Astro support exits
experimental status and handles JSX comments** (`{/* … */}`). Watch the Biome
changelog / language-support page and
[biomejs/biome#6528](https://github.com/biomejs/biome/issues/6528).

When that lands:

1. Set `html.experimentalFullSupportEnabled: true` in `biome.jsonc`.
2. Remove the `**/*.astro` `overrides` entry (re-enable `noUnusedImports` /
   `noUnusedVariables`).
3. Run `biome check --write .`, review the (large, one-time) template-formatting
   diff, and confirm the build.
4. Optionally re-point `useSortedClasses` at template class attributes.
5. Supersede this ADR with a follow-up recording the switch.
