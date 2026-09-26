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

- **Design system** — warm-paper/ink neutrals with one copper accent reserved for *active / in progress*, `success` green for *complete*, and teal/violet for the Foundation and Professional tracks. Hue carries meaning, never decoration. Tokens live in `app/globals.css`; the type, radius, shadow and spacing scales in `tailwind.config.ts`.
- **Animation language** — `lib/motion.ts` defines every duration (fast 160ms / base 240ms / entrance 420ms) and the three springs. Nothing hardcodes a duration. Entrance reveals run once; the first paint animates in CSS (`.reveal-in`) so content is never hidden behind hydration.
- **Reduced motion** — `<MotionConfig reducedMotion="user">` drops transform/layout animation app-wide, CSS transitions are neutralised in `globals.css`, and anything where the animation *is* the feature additionally checks `useMotionSafe()`.
- **Learning dashboard** — overall/track/domain progress, chapters complete, reading time remaining, day streak, and a "continue where you left off" card, with counters that count up and bars that fill once.
- **Chapter reader** — number → title → dek → metadata → content → related concepts → prev/next, sequenced on open; scroll-spy table of contents with a `layoutId` indicator and scroll-progress rail; reading-progress bar tied to document scroll.
- **Code blocks** — dark chrome strip with filename/language badge and a copy button that animates to a check. Syntax highlighting comes from `lib/highlight.ts`, a dependency-free tokenizer (JSON/YAML/bash/Python/TS) that never touches the 17 chapters whose notes already ship their own token spans.
- **Chapter prose** — `app/chapter-prose.css` and `app/chapter-blocks.css` map the study notes' own class vocabulary (callouts, exam panels, decision trees, flow diagrams, cheat sheets, mnemonics, comparison matrices…) onto the design tokens, in plain CSS, for both themes. They are imported by the chapter route only, so ~70 kB of CSS stays off every other page.
- **Search** — ⌘K / Ctrl K command palette and a `/search` page over one client-side Fuse.js index, sharing one result row: chapter, track, domain, best-matching section, and a context snippet with the match highlighted. Keyboard-navigable, with designed idle/loading/empty/error states and a separate mobile layout.
- **Progress** — per-chapter completion persisted to `localStorage` (keys unchanged since the first version), driving every ring, bar and count. Writers merge with storage rather than trusting React state, so a chapter opened before the provider hydrates cannot erase history.
- **Navigation** — fixed header that compacts on scroll without shifting layout, a chapter rail with a travelling active indicator and collapsible domains, and an animated drawer below `lg`.
- **Accessibility** — semantic landmarks, one `<main>` per route, visible focus everywhere, `aria-current`/`aria-expanded`/`aria-live` where they belong, AA contrast verified by computing ratios from the tokens, and keyboard-scrollable wide tables and code blocks.

## Deploying to Vercel

`vercel.json` pins `installCommand`/`buildCommand` to npm so Vercel doesn't need to guess. No generated content is committed — a clean checkout runs `npm install && npm run build`, which regenerates `content/` via `prebuild` before Next compiles.

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it in Vercel — framework preset "Next.js" is auto-detected.
3. Deploy. No environment variables are required.

## Project structure

```
app/                       # Next.js App Router routes
  globals.css              # design tokens, base type, utilities
  chapter-prose.css        # study-notes markup → tokens (base layer)
  chapter-blocks.css       # exam panels, diagrams, cheat sheets (rich layer)
components/
  animations/              # MotionProvider, AnimatedPage/Section/List/Number
  navigation/              # header, chapter rail, drawer, breadcrumbs, prev/next
  search/                  # ⌘K palette, shared result row, highlight ranges
  progress/                # ring, bar, mark-complete
  chapter/                 # header, body, TOC, reading progress, related
  code/                    # code-block chrome, copy button
  dashboard/               # metrics, continue card, track/domain/chapter cards
  ui/                      # button, card, badge, kbd, dialog, theme toggle
content/                   # generated at build time — not committed
lib/                       # motion language, hooks, search, progress, highlight
scripts/ingest.ts          # content ingestion
source-content/            # source study-notes HTML (input to ingestion)
```
