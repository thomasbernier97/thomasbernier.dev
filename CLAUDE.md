# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Overview

Personal blog built on the **AstroPaper** theme (Astro 7, Tailwind v4, MDX, Pagefind). Static output, no tests. Node >= 22.

The posts in `src/content/posts/` and `src/content/pages/about.md` are still the theme's demo content and docs, and the social and share links in `astro-paper.config.ts` are still placeholders.

## Conventions

- **pnpm only.** Never use npm or yarn. Run the Astro CLI through pnpm too (`pnpm astro dev --background`).
- **Blog posts** live in `src/content/posts/` as Markdown with AstroPaper frontmatter (schema in `src/content.config.ts`).
- **Site config** lives in `astro-paper.config.ts`.
- **No em dashes** in any writing: posts, page copy, UI strings, docs, commit messages.
- **`pnpm build` must pass before every commit.**
- **Licensing:** code is MIT (`LICENSE`), written content is CC BY 4.0 (`LICENSE-CONTENT`).
- Import alias: `@/*` → `src/*`.
- Prettier: double quotes, semicolons, `arrowParens: "avoid"`, ES5 trailing commas. Tailwind classes are sorted by the plugin.

## Commands

```bash
pnpm install
pnpm astro dev --background  # dev server on :4321 (see AGENTS.md); `pnpm dev` runs it in the foreground
pnpm build                   # astro check (type check) + astro build + pagefind index + copy index to public/pagefind
pnpm preview
pnpm lint                    # eslint
pnpm format:check            # prettier (CI runs this)
pnpm format
pnpm sync                    # regenerate astro: module types after changing content.config.ts
```

CI (`.github/workflows/ci.yml`) runs `lint`, `format:check`, then `build` on PRs. Run all three before calling a change done. There is no test suite; `pnpm build` (which includes `astro check`) is the correctness gate.

Search only works in dev after one `pnpm build`, because the Pagefind index is copied into `public/pagefind/`, which is gitignored.

## Architecture

### Configuration layers
- `astro-paper.config.ts`: the **user-facing** site config (site URL/title/author/timezone, posts per page, feature flags, socials, share links). Edit this file for site settings.
- `src/config.ts`: resolves that config with defaults into `ResolvedAstroPaperConfig`. The rest of the code imports `config from "@/config"`. Don't edit it to change settings.
- `src/types/config.ts`: the config schema with doc comments. Read these to see what each feature flag does.
- `astro.config.ts`: Astro integrations, the markdown pipeline (rehype plugins and Shiki transformers live in `src/utils/`), fonts, and the env schema.

Social and share link `name` values must match an SVG filename in `src/assets/icons/socials/`.

### Content
- Collections are defined in `src/content.config.ts`: `posts` (`src/content/posts/**`) and `pages` (`src/content/pages/**`). Files or directories starting with `_` are excluded from the collection.
- Post URLs come from `src/utils/getPostPaths.ts`. Subdirectories become URL segments (`posts/examples/foo` → `/posts/examples/foo`), except `_`-prefixed dirs, which are dropped from the URL. A frontmatter `slug` overrides the filename.
- Always pass posts through `getSortedPosts` / `postFilter` (`src/utils/`). Drafts are always hidden. In production, posts with a future `pubDatetime` are hidden, compared by calendar day in the site or per-post timezone. In dev, every non-draft post is shown.
- Dynamic OG images are rendered with Satori + Sharp in `src/pages/og.png.ts` (site default) and `src/pages/posts/[...slug]/index.png.ts` (per post, skipped when the post sets `ogImage`). They use the Google Sans Code font declared in `astro.config.ts`.

### Routing
File-based routing lives in `src/pages/`. Directories and files prefixed with `_` inside `pages/` (e.g. `posts/[...slug]/_components/`) are colocated helpers, not routes. i18n is configured with only `en` and no locale prefix. Build internal links with `getRelativeLocaleUrl` / `withBase` rather than hardcoded paths. UI strings live in `src/i18n/lang/en.ts`.

### Styling
Tailwind v4 is set up through the Vite plugin, with no tailwind config file. Theme colors are CSS variables in `src/styles/theme.css` (light and dark via `[data-theme]`) and are exposed as Tailwind tokens (`bg-background`, `text-accent`, etc.). Use these tokens instead of raw colors. Prose styling is in `src/styles/typography.css`.
