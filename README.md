# Claude Certified Architect — Study Guide

An interactive study site for the Claude Certified Architect (CCAR) certification, built from 70 chapters of static study notes (Foundation + Professional tracks).

## Content pipeline

`scripts/ingest.ts` reads every source file under `source-content/`, extracts each chapter's title, sections, and sanitized body HTML, and writes:

- `content/manifest.json` — ordered chapter index (no body) for navigation/progress
- `content/chapters/<slug>.json` — one file per chapter, full sanitized body
- `public/search-index.json` — flattened text fetched client-side by the ⌘K command palette and `/search`

`content/` and `public/search-index.json` are generated, not committed — they're rebuilt on every `npm run build` via the `prebuild` script. The ingest script prints a per-domain chapter count and throws if any chapter number 1–70 is missing or duplicated.

Source layout notes (why `scripts/ingest.ts` is structured the way it is):

- Most chapters are one file each, but the top-level `CCAR Study Guide.html` bundles chapters 67–70 via `<h2 id="chNN">` boundaries.
- The source templates use at least four different page layouts (`<nav>+<main>`, `<aside>+<div class="main">`, `<header>+<main>`, `<header class="hero">+<section>`), and are inconsistent about repeating "Chapter N" inside the `<h1>`. The chapter **number** is always taken from the filename (`Ch.7 — ...`); the **title** comes from the `<h1>` with any "Chapter N" prefix stripped.

## Local development

Requires Node 20.9+ (see `.nvmrc`).

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run ingest     # regenerate content/ + public/search-index.json without a full build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # ingest + next build
```

## Features

- ⌘K command palette + `/search` page, both backed by a client-side Fuse.js index over chapter titles, sections, and excerpts.
- Per-chapter progress ("mark complete"), persisted to `localStorage`, driving per-domain/per-track/overall progress rings and a homepage "resume where you left off" card.
- Sticky, scroll-spy table of contents on chapter pages (`IntersectionObserver` + a `layoutId`-animated active indicator).
- Copy-to-clipboard on every code block.
- Dark/light mode via `next-themes` (system-aware, persisted, no flash).
- Framer Motion throughout (page transitions, scroll reveals, hero timeline, spring-animated command palette), all gated behind `prefers-reduced-motion`.

## Deploying to Vercel

`vercel.json` pins `installCommand`/`buildCommand` to npm so Vercel doesn't need to guess. No generated content is committed — a clean checkout runs `npm install && npm run build`, which regenerates `content/` via `prebuild` before Next compiles.

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it in Vercel — framework preset "Next.js" is auto-detected.
3. Deploy. No environment variables are required.

## Project structure

```
app/              # Next.js App Router routes
components/       # UI + motion components
content/          # generated at build time — not committed
lib/              # motion tokens, search, progress, utils
scripts/ingest.ts # content ingestion
source-content/   # source study-notes HTML (input to ingestion)
```
