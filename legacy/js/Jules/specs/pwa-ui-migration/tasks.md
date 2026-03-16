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
- [x] Establish icon dictionary and standardized sizing classes. (Created docs/ICON_DICTIONARY.md and updated input.css)

### ui-theme
- [x] Define Tailwind theme tokens in `input.css` for dark surfaces and accent colors. (Updated @theme with surface scales and glow shadows)
- [x] Implement global layout primitives (spacing, typography scale). (Added safe-area spacing and refined base typography)

### ui-widgets
- [x] Implement Stat Ribbon component with Iconify integration. (Defined .stat-ribbon and .stat-pill in input.css)
- [x] Implement Progress Bar component (Level + XP). (Defined .progress-bar-container and .progress-bar-fill in input.css)
- [x] Implement Pixel-Card component (framed/elevated). (Defined .pixel-card with pseudo-borders in input.css)
- [x] Implement Grid primitives for equipment and inventory. (Defined .ui-grid-inventory and .ui-grid-item-slot in input.css)

### ui-stations
- [x] Implement Combat station layout. (Created with entity card, stat ribbon, and progress bars)
- [x] Implement Journal station (skill tree) layout. (Created views/journal.html with skill tree nodes)
- [x] Implement Shop station layout. (Created views/shop.html with item cards and ad slot)
- [x] Implement Equipment station layout. (Created views/equipment.html with equipment matrix)
- [x] Implement Smithing/Crafting station layouts. (Updated views/crafting.html and gathering.html with sub-tabs)
- [x] Implement Inventory station (30-slot matrix) layout. (Updated views/inventory.html with matrix grid)

### ui-modals
- [x] Implement Settings modal (audio, save, reset, feedback). (Created modal container in index.html and updated views/settings.html as a modal fragment)
- [x] Implement Shop modal overlay behavior. (Implemented shop item inspection modal)

### pwa
- [x] Verify manifest and service worker integrity post-migration. (Updated sw.js with new views and updated manifest theme colors)

## Tier-2: Enhancements
- [ ] CSS animations for transitions.
- [ ] Advanced responsiveness audits.
- [ ] Accessibility polish.
