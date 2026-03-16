# Pwa-idle-game

A mobile-first idle game PWA that runs on GitHub Pages using **htmx**, **Tailwind CSS CLI**, and **vanilla JavaScript**.

## Features
- Tabbed game UI with htmx partial swaps
- Idle loop with combat, gathering, and crafting actions
- IndexedDB save (including install metadata) + capped offline progress
- Installable PWA (manifest + service worker, SVG icons)

## Run locally
```bash
npm install
npm run build:css
npm run serve
```
Then open http://localhost:4173.

For CSS live development:
```bash
npm run dev:css
```

## Project layout
- `index.html`: app shell + navigation
- `views/*.html`: htmx-loaded screens
- `assets/js/game.js`: game state, loop, actions, IndexedDB persistence, PWA hooks
- `input.css`: Tailwind source (Tailwind CLI input file)
- `assets/css/style.css`: generated CSS (commit this for Pages)
- `sw.js` + `manifest.webmanifest`: offline/install support

## Deployment
A Pages workflow is included at `.github/workflows/pages.yml`.
It installs dependencies, builds Tailwind CSS, and deploys the static site.
