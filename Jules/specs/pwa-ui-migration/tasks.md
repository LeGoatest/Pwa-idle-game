# PWA UI Migration Tasks

## Tier-1: Required Baseline

### ui-shell
- [x] Implement sovereign shell container in `index.html`. (Structure updated with header, main, and footer dock)
- [x] Implement fixed top bar with dynamic title. (Added #station-title and gold tracker)
- [x] Implement fixed bottom navigation dock with Iconify icons. (Added nav with i-lucide icons)
- [x] Configure HTMX context swap boundaries for station transitions. (Updated hx-swap and main container)

### icon-system
- [x] Install and configure `@iconify/tailwind` plugin. (Installed via npm)
- [x] Add `addDynamicIconSelectors()` to Tailwind configuration (via `input.css`). (Added @plugin and utilities)
- [ ] Establish icon dictionary and standardized sizing classes.

### ui-theme
- [ ] Define Tailwind theme tokens in `input.css` for dark surfaces and accent colors.
- [ ] Implement global layout primitives (spacing, typography scale).

### ui-widgets
- [ ] Implement Stat Ribbon component with Iconify integration.
- [ ] Implement Progress Bar component (Level + XP).
- [ ] Implement Pixel-Card component (framed/elevated).
- [ ] Implement Grid primitives for equipment and inventory.

### ui-stations
- [ ] Implement Combat station layout.
- [ ] Implement Journal station (skill tree) layout.
- [ ] Implement Shop station layout.
- [ ] Implement Equipment station layout.
- [ ] Implement Smithing/Crafting station layouts.
- [ ] Implement Inventory station (30-slot matrix) layout.

### ui-modals
- [ ] Implement Settings modal (audio, save, reset, feedback).
- [ ] Implement Shop modal overlay behavior.

### pwa
- [ ] Verify manifest and service worker integrity post-migration.

## Tier-2: Enhancements
- [ ] CSS animations for transitions.
- [ ] Advanced responsiveness audits.
- [ ] Accessibility polish.
