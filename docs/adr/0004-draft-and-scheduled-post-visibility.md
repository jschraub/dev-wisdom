# 4. Treat scheduled posts as drafts

- Status: Accepted
- Date: 2026-08-05
- Deciders: Jared Schraub

## Context

A post is withheld two ways: `draft: true`, or a `pubDatetime` that has not
arrived. They differ to the author, but to a reader they are identical — built
at their own URL, absent from every listing.

That equivalence was not held. `archives/index.astro` and `getDraftUrlPaths()`
in `astro.config.ts` filtered on the flag alone, and a scheduled post does not
carry the flag. Merging one listed it in `/archives` and put it in the sitemap
before its publish date; `PostDetails.astro` indexed it for the same reason.

## Decision

**"Draft" covers both triggers.** Publishing requires both cleared; `draft:
true` is an unconditional override, so a past `pubDatetime` does not publish a
flagged draft.

- The rule lives once, as `isPublished(data)` in `src/utils/postFilter.ts`.
- Listings route through `postFilter`; `PostDetails.astro` derives `noindex`
  and `data-pagefind-body` from `isPublished`.
- `astro.config.ts` keeps a **deliberate second copy** — it runs before the
  content collection exists and cannot import from `src/`.
- Never branch on `data.draft` alone.

## Consequences

- The rule is implemented twice and can drift. Cross-referenced in comments;
  no shared module is importable from Astro config.
- **A scheduled post does not publish itself.** The site is prerendered, so
  `Date.now()` runs at build time — when the timestamp passes, the deployed
  HTML is unchanged. Publishing on a schedule needs a build at that moment
  (push to `main`, or a cron-driven deploy hook); no such mechanism exists
  here. `SITE.scheduledPostMargin` is an allowance for build-clock skew, not a
  scheduler.

## Revisit trigger

- Adding a scheduled build, which would make future `pubDatetime` self-publishing.
- Astro exposing content collections at config time.
- Any new listing surface — it must route through `postFilter`.
