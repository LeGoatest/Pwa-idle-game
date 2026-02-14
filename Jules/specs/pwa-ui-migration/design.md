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
  - `icon-[lucide--swords]` for Combat/ATK.
  - `icon-[lucide--shield]` for DEF.
  - `icon-[lucide--heart]` for HP.
  - `icon-[lucide--coins]` for Gold.
  - `icon-[lucide--package]` for Inventory.
  - `icon-[lucide--hammer]` for Smithing.
  - `icon-[lucide--book]` for Journal.
  - `icon-[lucide--shopping-cart]` for Shop.
  - `icon-[lucide--settings]` for Settings.

## 4. HTMX Integration
- **Shell**: `index.html` contains the `#view-root`.
- **Navigation**: Bottom dock buttons use `hx-get` to load fragments into `#view-root`.
- **State Persistence**: HTMX swaps trigger `htmx:afterSwap` event in `game.js` to re-bind data and render current state.
