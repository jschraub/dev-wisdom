# Agent Instructions

Read `CONTEXT.md` before making changes. It documents project behavior that is
not obvious from the codebase and identifies the architecture decision records
that apply to common types of work.

In particular:

- Use `isPublished()` when changing post visibility or listings.
- Treat development-server visibility as non-production behavior; use a
  production build to verify published content.
- Read the relevant ADR before changing formatting, Markdown processing,
  visual design, or post listing behavior.
