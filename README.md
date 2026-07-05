# Jared Schraub

> Engineering rigor, modernized.

The source for [jaredschraub.com](https://jaredschraub.com) — a frontend engineering leader bringing two decades of rigor to modern tooling: functional TypeScript, AI-assisted teams, and the standards that survive both.

## 🚀 Project Structure

```bash
/
├── docs/
│   └── adr/            # architecture decision records (tooling choices & revisit triggers)
├── public/             # static assets served as-is (favicon, pagefind index)
├── src/
│   ├── assets/         # icons & images imported by components
│   ├── components/
│   ├── data/
│   │   └── blog/       # blog posts (Markdown; $…$ / $$…$$ math supported)
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── config.ts       # SITE config: title, tagline, domain, OG, etc.
│   ├── constants.ts    # social links & share targets
│   └── content.config.ts
├── astro.config.ts
└── biome.jsonc         # single config for formatting + linting
```

All blog posts live in `src/data/blog/`. Site-wide branding (title, tagline, description, canonical domain) is in `src/config.ts`.

## 💻 Tech Stack

**Framework** - [Astro](https://astro.build/) 7 (Vite 8, Rust compiler)
**Markdown** - Astro's native [Sätteri](https://satteri.bruits.org/) pipeline with `features.math` + [`@nullpinter/satteri-katex`](https://www.npmjs.com/package/@nullpinter/satteri-katex) rendering [KaTeX](https://katex.org/) at build time
**Type Checking** - [TypeScript](https://www.typescriptlang.org/)
**Styling** - [TailwindCSS](https://tailwindcss.com/) 4
**Lint / Format** - [Biome](https://biomejs.dev/) on stock defaults (tabs); `.astro` files are linted/formatted code-only — see `docs/adr/0001`
**Code Blocks** - Shiki dual themes with `@shikijs/transformers` (diff, highlight, file-name badges)
**Static Search** - [Pagefind](https://pagefind.app/)
**OG Images** - Generated at build time with [Satori](https://github.com/vercel/satori) + resvg for posts without a custom `ogImage`
**Deployment** - Static build on [Cloudflare Pages](https://pages.cloudflare.com/)

> The `jschraub.com → jaredschraub.com` canonical 301 is a Cloudflare **Redirect Rule** (zone-level), not a build artifact — Pages `_redirects` can't match on hostname.

Non-obvious tooling choices (and when to revisit them) are recorded as ADRs in [`docs/adr/`](docs/adr/).

## 👨🏻‍💻 Running Locally

Requires **Node ≥ 22.12** and **pnpm 11** (pinned via the `packageManager` field — `corepack enable` picks it up automatically).

```bash
# install dependencies
pnpm install

# start the dev server at localhost:4321
pnpm run dev
```

## 🧞 Commands

| Command                 | Action                                          |
| :---------------------- | :---------------------------------------------- |
| `pnpm install`          | Install dependencies                            |
| `pnpm run dev`          | Start local dev server at `localhost:4321`      |
| `pnpm run build`        | `astro check` + build + Pagefind index          |
| `pnpm run preview`      | Preview the build locally before deploying      |
| `pnpm run format`       | Format with Biome                               |
| `pnpm run lint`         | Lint with Biome                                 |
| `pnpm run check`        | Format + lint + organize imports (Biome, write) |

CI runs `biome ci .` plus the full build on every pull request (Node 24).

## Credits

Built on the [AstroPaper](https://github.com/satnaing/astro-paper) theme by Sat Naing (MIT). See `LICENSE`.
