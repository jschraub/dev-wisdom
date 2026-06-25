# Jared Schraub

> Engineering rigor, modernized.

The source for [jaredschraub.com](https://jaredschraub.com) — a frontend engineering leader bringing two decades of rigor to modern tooling: functional TypeScript, AI-assisted teams, and the standards that survive both.

## 🚀 Project Structure

```bash
/
├── public/             # static assets served as-is (favicon, _redirects, pagefind index)
├── src/
│   ├── assets/         # icons & images imported by components
│   ├── components/
│   ├── data/
│   │   └── blog/       # blog posts (Markdown)
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── config.ts       # SITE config: title, tagline, domain, OG, etc.
│   ├── constants.ts    # social links & share targets
│   └── content.config.ts
└── astro.config.ts
```

All blog posts live in `src/data/blog/`. Site-wide branding (title, tagline, description, canonical domain) is in `src/config.ts`.

## 💻 Tech Stack

**Framework** - [Astro](https://astro.build/)
**Type Checking** - [TypeScript](https://www.typescriptlang.org/)
**Styling** - [TailwindCSS](https://tailwindcss.com/)
**Static Search** - [Pagefind](https://pagefind.app/)
**Deployment** - Static build on [Cloudflare Pages](https://pages.cloudflare.com/)

## 👨🏻‍💻 Running Locally

```bash
# install dependencies
pnpm install

# start the dev server at localhost:4321
pnpm run dev
```

Or with Docker:

```bash
docker build -t jaredschraub .
docker run -p 4321:80 jaredschraub
```

## 🧞 Commands

| Command                 | Action                                          |
| :---------------------- | :---------------------------------------------- |
| `pnpm install`          | Install dependencies                            |
| `pnpm run dev`          | Start local dev server at `localhost:4321`      |
| `pnpm run build`        | Build the production site to `./dist/`          |
| `pnpm run preview`      | Preview the build locally before deploying      |
| `pnpm run format`       | Format with Prettier                            |
| `pnpm run lint`         | Lint with ESLint                                |
| `docker compose up -d`  | Run the dev server in Docker                    |

## Credits

Built on the [AstroPaper](https://github.com/satnaing/astro-paper) theme by Sat Naing (MIT). See `LICENSE`.
