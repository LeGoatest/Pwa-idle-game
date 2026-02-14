# PWA UI Migration Design

## 1. Visual Language
- **Theme**: Dark surfaces with elevation, active glows, and accent bars.
- **Typography**: Consistent scale using Tailwind typography utilities.
- **Layout**: Mobile-first, single-column main content within a `max-w-md` shell.

## 2. Component Design
- **Pixel-Card**: Framed, elevated containers with rounded corners (using Tailwind `rounded-2xl` or similar).
- **Stat Ribbon**: Compact horizontal or grid layout of stat pills with Iconify icons.
- **Inventory Matrix**: 5-column grid for the 30-slot inventory.
- **Skill Tree**: Nested or tiered layout for skill progression in the Journal.

## 3. Iconography
- **Library**: Iconify (Tailwind plugin).
- **Standardization**:
  - `i-lucide:swords` for Combat/ATK.
  - `i-lucide:shield` for DEF.
  - `i-lucide:heart` for HP.
  - `i-lucide:coins` for Gold.
  - `i-lucide:package` for Inventory.
  - `i-lucide:hammer` for Smithing.
  - `i-lucide:book` for Journal.
  - `i-lucide:shopping-cart` for Shop.
  - `i-lucide:settings` for Settings.

## 4. HTMX Integration
- **Shell**: `index.html` contains the `#view-root`.
- **Navigation**: Bottom dock buttons use `hx-get` to load fragments into `#view-root`.
- **State Persistence**: HTMX swaps trigger `htmx:afterSwap` event in `game.js` to re-bind data and render current state.
