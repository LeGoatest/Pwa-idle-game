# Design: Unified Activity & Navigation

## 1. Runtime Model (game.js)

### State Schema Update
```javascript
state.activeTask = {
  kind: 'none', // e.g., 'combat', 'mining', 'woodcutting'
  startedAt: Date.now(),
  lastProcessedAt: Date.now(),
  meta: {}
};
```

### Cycle Engine
- `cycleDuration` = `base_ms` * `modifiers`.
- `tick()` function:
  1. Check if `activeTask.kind !== 'none'`.
  2. Increment progress based on time delta.
  3. If progress >= `cycleDuration`:
     - Grant rewards.
     - Reset progress/lastProcessedAt.
     - Save state.

### Switching Logic
- `setActiveTask(kind, meta)`:
  1. If `state.activeTask.kind === kind`, return (or toggle).
  2. Store `oldKind = state.activeTask.kind`.
  3. Update `state.activeTask`.
  4. Trigger `showToast(`${oldKind} stopped`, `${kind} started`)`.
  5. Load station via HTMX if required.

## 2. UI Architecture

### Bottom Dock
- Replace existing 6-button grid with 5-button icon dock.
- `Skills` button triggers a JS function to toggle the Launcher module.

### Skills Launcher
- An overlay (bottom sheet style) div `#skills-launcher` positioned above the dock.
- Grid of icons for each skill.
- Selecting a skill calls `setActiveTask(kind)` which:
  1. Updates the `activeTask` state.
  2. Automatically navigates the main viewport to the relevant station (e.g., `views/gathering.html`).
  3. Closes the launcher.

### Global Indicators
- Dock icons use `aria-selected` or specific classes based on `state.activeTask.kind`.
- Header subtitle or icon showing current activity.

## 3. Data Migration/Absorption
- Remove `autoCombat` boolean; replace with `activeTask.kind === 'combat'`.
- Remove separate XP/Timer loops; consolidate into the single Cycle Engine.
