# PWA UI Migration Requirements

## 1. UI Shell
- **Ubiquitous**: The system shall provide a single sovereign shell container for the PWA.
- **Ubiquitous**: The system shall provide a fixed top bar displaying the current station title and utilities.
- **Ubiquitous**: The system shall provide a fixed bottom navigation dock for station switching.
- **Event-driven**: When a navigation button is clicked, the system shall perform a context swap of the main view via HTMX.

## 2. Stations
- **Ubiquitous**: The system shall implement a Combat station with entity cards, stat ribbons, and action controls.
- **Ubiquitous**: The system shall implement a Journal station with a skill tree panel.
- **Ubiquitous**: The system shall implement a Shop station with item cards and purchase actions.
- **Ubiquitous**: The system shall implement an Equipment station with a grid layout and stat ribbon.
- **Ubiquitous**: The system shall implement Smithing/Crafting stations with activity cards and recipe grids.
- **Ubiquitous**: The system shall implement an Inventory station with a 30-slot matrix.

## 3. Widgets & Components
- **Ubiquitous**: The system shall provide a Stat Ribbon component using Iconify icons for stats (HP, ATK, DEF, XP).
- **Ubiquitous**: The system shall provide a Progress Bar component for Level and XP visualization.
- **Ubiquitous**: The system shall provide a Pixel-Card component for themed UI elements.

## 4. Icon System
- **Ubiquitous**: The system shall use `@iconify/tailwind` for all UI icons.
- **Ubiquitous**: The system shall use dynamic selectors in the format `i-{collection}:{name}`.

## 5. PWA Integrity
- **Ubiquitous**: The system shall maintain existing PWA manifest and service worker behavior.
- **Ubiquitous**: The system shall preserve IndexedDB persistence for all game state.
