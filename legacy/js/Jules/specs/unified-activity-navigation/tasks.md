# Tasks: Unified Activity & Navigation

## Tier 1: Core Authority & UI Shell

### runtime & persistence
- [x] Implement `activeTask` schema in `defaultState`.
- [x] Create `setActiveTask(kind)` controller.
- [x] Consolidate all resource/XP gains into a single `processCycle(task)` function.

### offline
- [x] Refactor `progressOffline()` to calculate cycles for `activeTask` only.
- [x] Implement 'carry' time preservation for progress bars.

### ui-nav
- [x] Update `index.html` dock to 5-icon layout.
- [x] Implement dock highlighting based on `activeTask.kind`.

### ui-launcher
- [x] Create `#skills-launcher` UI module.
- [x] Map skill icons to task switching logic.

### ui-feedback
- [x] Implement `showToast(title, body)` vanilla JS component.
- [x] Hook toast into `setActiveTask`.

### ui-widgets
- [x] Update station views to support Start/Pause (▶/⏸) button logic.

## Tier 2: Polish & Docs

### ui-polish
- [x] Add transition animations for the launcher.
- [x] Add progress bar smoothing.

### docs
- [x] Update `docs/ARCHITECTURE_RULES.md` with Single Reality Law.
- [x] Update `docs/ICON_DICTIONARY.md` with new dock/launcher icons.
