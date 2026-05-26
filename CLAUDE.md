# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a fork of [reveal.js](https://revealjs.com/) used to drive the **Elbsides infoscreen** — an auto-advancing, looping slideshow shown on a screen during the conference's intermissions (sponsors, schedule, "next talk", code of conduct, photos, etc.).

The conference-specific deck is a single file: **`docs/intermission.html`**. Everything else (`js/`, `css/`, `plugin/`, `dist/`, `react/`, `scripts/`, `build/`, `vite.config*.ts`, `tsconfig*.json`, `index.html`, `examples/`, `test/`, `demo.html`) is upstream reveal.js. Treat upstream files as a vendored library — only touch them when intentionally backporting/forporting fixes.

`update_upstream.sh` pulls from the `upstream` remote (`git fetch upstream && git merge upstream/master`). Expect occasional merge conflicts in `dist/`.

## The infoscreen deck (`docs/intermission.html`)

Self-contained HTML page that loads reveal.js and the bundled plugins from `../dist` (core: `../dist/reveal.js`, `../dist/reveal.css`; plugins: `../dist/plugin/<name>.js`). Key behaviors, all wired up via inline `<script>` blocks at the bottom of the file:

- **Reveal config**: `transition: 'fade'`, `autoSlide: 7000ms`, `autoSlideStoppable: false`, `loop: true`. Slides advance on their own; the page reloads itself every 5 minutes (`setInterval(location.reload, 300000)`) to pick up fresh schedule/sponsor data without operator intervention.
- **Schedule slide** (`#schedule`): fetches `https://pretalx.com/elbsides-2025/schedule/export/schedule.json` at load time and renders a table for the **Elbkuppel** room only. Other rooms are filtered out in `createSchedule()`. The local `schedule.json` in the repo root is a snapshot/reference — the live page uses the pretalx URL.
- **"Next talk" slide** (`#next_talk`): populated by the same `createSchedule()` pass. A talk is considered "next" when the current local time is within 30 minutes before its start. The 30-min window is computed by string-comparing `HH:MM` values, which is fragile around hour boundaries — be careful when editing that block (search for `laterS = startS - 30`).
- **Sponsor slides** (`#platinum-sponsors`, `#gold-sponsors`, `#silver-sponsors`, `#bronze-sponsors`): `fillSponsorImages()` fetches sponsor HTML fragments from `github.com/Elbsides/www` (`refs/heads/main/2025/includes/{tier}.html`), parses out `<img>` tags, and inlines them with widths scaled to fit the row. Changing sponsor lists is done in the `Elbsides/www` repo, not here.
- **Random photo slides** (`#photo`, `#photos2025`, `#photos2026`): pick one image at random from a hard-coded list each time the page loads. `#photo` uses 2024 photos hosted in `Elbsides/www`; `#photos2025` uses files committed to `docs/` (e.g. `IMG_3653.JPG`); `#photos2026` uses files in `docs/photos2026/`. Add a new 2025 photo by dropping the file into `docs/` and appending its filename to the `photo_list_2025` array. Add a new 2026 photo by dropping the file into `docs/photos2026/` and appending its filename to the `photo_list_2026` array. While `photo_list_2026` is empty the `#photos2026` section auto-hides (`display: none` + `data-visibility="uncounted"`) so the loop doesn't show a blank "Random photo from 2026" slide before any photos exist.

When editing the deck, `<section>` order in `<div class="slides">` is the slide order. Each section's background logo is set via `data-background-image` / `data-background-position` / `data-background-size` — keep these consistent across new slides.

## Common commands

Upstream migrated from gulp to **Vite + tsc** in v6. The npm scripts now drive Vite directly:

- `npm start` (alias `npm run dev`) — `vite`: starts the Vite dev server. Port is pinned to **8008** via the project `.npmrc` (`port=8008`), which sets `npm_config_port` → consumed by `vite.config.ts`. Override with `npm start --port=NNNN`. Open `http://localhost:8008/docs/intermission.html` to view the infoscreen deck.
- `npm run build` — full production build: runs `tsc`, then `vite build` for the core, then `vite build -c vite.config.styles.ts` for CSS, then a separate `vite build` per plugin (`plugin/{highlight,markdown,math,notes,search,zoom}/vite.config.ts`), then stamps a banner onto `dist/reveal.js`. Outputs go to `dist/` (core + `dist/plugin/<name>.{js,mjs}`). Only needed if you've changed `js/`, `css/`, or `plugin/` source.
- `npm run build:core` / `npm run build:styles` — narrower builds for just the core JS or just CSS.
- `npm run build:es5` — full build plus a legacy ES5 transpile via `scripts/build-es5.js`.
- `npm test` — `node scripts/test.js`: ESLint + QUnit suites under `test/*.html` via headless puppeteer. Tests target upstream reveal.js, not the infoscreen deck.
- `npm run package` — zips a distributable via `scripts/zip.js`.
- `npm run react:build` / `react:demo` / `react:test` — proxy into the new `react/` workspace (upstream's React wrapper, not used by the infoscreen).

Node **≥ 20.19.0** is required (`devEngines.runtime.node` in `package.json`).

## Notes on the build artifacts

`dist/reveal.js`, `dist/reveal.mjs`, `dist/reveal.css`, `dist/theme/*.css`, and `dist/plugin/<name>.{js,mjs}` are committed build outputs. (Pre-v6 the compiled plugins lived alongside their source at `plugin/<name>/<name>.js`; in v6 only `plugin/<name>/{index.ts,plugin.js,vite.config.ts}` remain as source and the compiled bundles live under `dist/plugin/`.) The infoscreen deck loads these directly, so they must be present and current. After editing anything under `js/`, `css/`, or `plugin/`, run `npm run build` and commit the regenerated files — otherwise `docs/intermission.html` will run stale code.
