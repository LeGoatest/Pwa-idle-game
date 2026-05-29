# Repository Agent Instructions

## Scope
These instructions apply to the entire repository.

## Required canon review
Before changing code or docs, review the applicable project canon in this order:

1. `docs/ARCHITECTURE_INDEX.md`
2. `docs/ARCHITECTURE_RULES.md`
3. `docs/SYSTEM_AXIOMS.md`
4. `docs/SECURITY_MODEL.md`
5. `docs/INVARIANT_MODEL.md`
6. `docs/CONTRACT_MODEL.md`
7. `docs/MUTATION_PROCESS.md`
8. `docs/VERSION_LOCKING.md`
9. `docs/DOC_STYLE.md`
10. `Jules/JULES.md`
11. `Jules/TASK_GROUPS.md`

If a user request conflicts with higher-precedence canon, refuse the request and cite the conflicting rule.

## Project shape
- This is a mobile-first idle-game PWA for GitHub Pages.
- `index.html` is the app shell and owns the bottom navigation and `#view-root` htmx target.
- `views/*.html` are htmx-loaded HTML fragments, not full documents.
- `assets/js/game.js` coordinates state, persistence, activity selection, and rendering.
- `assets/js/systems/*.js` contains bounded game-system logic.
- `assets/js/db.js`, `assets/js/state.js`, `assets/js/ui.js`, and loader/registry modules support the core game loop.
- `content/**/*.json` and `content/**/*.jsonl` are data-driven game content.
- `sw.js` and `manifest.webmanifest` provide PWA/offline support.

## Styling rules
- This project uses Tailwind CSS CLI v4.
- The Tailwind source is `input.css`.
- The generated stylesheet is `assets/css/style.css`.
- Do not hand-edit `assets/css/style.css`; regenerate it with `npm run build:css` after changing `input.css`.
- Commit regenerated `assets/css/style.css` whenever `input.css` changes.
- Do not create standalone CSS patch files for app styling.
- Follow `docs/TAILWIND_PATTERN.md` for Tailwind v4 syntax and structure, applying the pattern to this repository's actual paths: `input.css` and `assets/css/style.css`.
- Use semantic classes in `input.css` with `@layer`, `@utility`, and `@apply` for reusable styling.
- Keep markup primarily structural; avoid repeated utility-heavy HTML when a semantic class belongs in `input.css`.

## JavaScript and state rules
- Keep core logic in vanilla JavaScript; do not introduce heavy frontend frameworks.
- Preserve htmx-based view transitions through `views/` partials and `#view-root`.
- Keep game state centralized through the existing state/game modules.
- Persist significant state changes through the existing IndexedDB persistence flow.
- Maintain the single-active-task model; starting a new activity cancels/replaces the prior active task.
- Avoid global `window` pollution unless the existing architecture requires it.
- Do not move major UI state ownership into direct DOM manipulation; use existing render/event patterns.

## Content rules
- Add or update game data in `content/` using the existing JSON/JSONL shapes.
- Keep IDs stable and consistent across indexes, item definitions, zones, monsters, shops, and drop tables.
- Update the relevant index file when adding content that must be discoverable by loaders.

## Documentation and governance changes
- Changes under `docs/` or `Jules/` are constitutional mutations under `docs/MUTATION_PROCESS.md` and require the formal spec process described there.
- Use concise, authoritative Markdown with clear headers and lists.

## Build and verification
- Run `npm run build:css` after any Tailwind/CSS source change.
- For general changes, at minimum run `git diff --check` before committing.
- For PWA/service-worker changes, inspect cache/version behavior carefully and test with the local server when possible.
- Local serving command: `npm run serve`, then open `http://localhost:4173`.

## Repository hygiene
- Do not edit files in `node_modules/`.
- Do not commit local logs such as `server.log` unless explicitly requested.
- Use `rg`/`rg --files` for repository searches; do not use recursive `grep` or `ls -R`.
- Preserve generated assets unless the corresponding source change requires regeneration.
