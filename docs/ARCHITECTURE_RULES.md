# PWA Idle Game | Architectural Rules (Canonical)

This document contains the source of truth for the system's architecture.
Non-negotiable. If a change violates any rule, the correct action is to refuse.

## 0) Supreme Authority
- This file overrides all other docs and comments.
- If ambiguity exists, prefer: [Isolation > Reliability > Resilience].

## 1) System Boundaries
- `docs/**`: Governance and architectural canon.
- `views/**`: UI partials loaded via htmx.
- `assets/js/game.js`: Core game logic, state management, and persistence.
- `assets/css/style.css`: Generated CSS (DO NOT EDIT DIRECTLY, generated via build).
- `input.css`: Tailwind CSS source (includes theme configuration).
- `sw.js`: Service worker for offline support.

## 2) UI & Interaction Rules
- **htmx Primacy**: All main view transitions must use htmx partial swaps from the `views/` directory.
- **Mobile First**: All UI components must be designed for mobile-first experience, adhering to the `max-w-md` container constraint defined in `index.html`.
- **Tailwind Only**: Styling must be handled through Tailwind utility classes. Any custom CSS must be added to `input.css`, never to the generated `assets/css/style.css`.

## 3) Logic & State Rules
- **Centralized State**: Game state must be centralized in `assets/js/game.js`.
- **Persistence**: Game progress must be persisted using IndexedDB.
- **Offline Support**: The application must remain functional offline via the service worker.
- **Vanilla JS**: Core logic must remain in vanilla JavaScript to maintain low overhead and high performance.

## 4) Forbidden Patterns
- **Direct DOM Manipulation for UI State**: Avoid manual DOM updates for major UI state; prefer htmx or minimal JS-driven updates that respect the htmx-loaded partials.
- **Global State Pollution**: Avoid polluting the global `window` object unless necessary for inter-module communication (if any).
- **Heavy Frameworks**: Do not introduce React, Vue, or other heavy frontend frameworks.
