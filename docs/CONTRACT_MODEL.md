# CONTRACT MODEL

## 1. htmx-Partial Contract
- **Trigger**: Navigation buttons use `hx-get` to fetch partials.
- **Target**: All view partials must target `#view-root`.
- **Response**: Partials in `views/` must be valid HTML fragments, not full documents.

## 2. Game-UI Contract
- **Events**: The core game loop may dispatch custom events that UI components listen to for updates.
- **Data Attributes**: UI elements may use `data-*` attributes to store state or metadata used by `game.js`.

## 3. Persistence Contract
- **Schema**: The IndexedDB schema must be versioned and migrations handled in `game.js`.
- **API**: Internal game functions must use a defined persistence layer to interact with IndexedDB.
