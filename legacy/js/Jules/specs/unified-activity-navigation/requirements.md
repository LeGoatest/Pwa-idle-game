# Requirements: Unified Activity & Navigation

## 1. System Authority
- [UBIQUITOUS]: The system shall maintain exactly one `activeTask` at any given time.
- [EVENT-DRIVEN]: When a new task is initiated, the system shall immediately terminate the previous task, set the new task as active, and provide user feedback via a toast notification.
- [STATE-DRIVEN]: While a task is active, the system shall execute cycles based on a `cycleDuration` (base + modifiers).
- [STATE-DRIVEN]: Only the `activeTask` shall generate rewards (XP, resources, etc.).

## 2. Offline & Persistence
- [UBIQUITOUS]: The `activeTask` state shall be persisted in IndexedDB and survive reloads, tab switches, and offline periods.
- [RESUME]: Upon application resume, the system shall calculate elapsed time since `lastProcessedAt`, grant rewards for full cycles, and resume the current cycle from the remaining 'carry' time.

## 3. UI & Navigation
- [DOCK]: The bottom dock shall be fixed and icon-based with five items: Hunt, Equipment, Skills (Launcher), Inventory, and Settings.
- [VISIBILITY]: The `activeTask` must be identifiable from any screen via dock highlights or header indicators within one second.
- [LAUNCHER]: The Skills item in the dock shall open a launcher module (selector) rather than a direct station.
- [SWITCHING]: Selecting a skill in the launcher shall immediately switch the `activeTask` and load the corresponding station fragment.
- [PAUSE]: Clicking the Pause (⏸) icon on an active task shall set `activeTask.kind` to `'none'`.
- [CONTRACT]: If a viewed station corresponds to the `activeTask`, the action button shall display a Pause (⏸) icon; otherwise, it shall display a Play (▶) icon.

## 4. Icons & Feedback
- [ICON-LAW]: All icons must use Iconify Tailwind dynamic selectors.
- [FEEDBACK]: Toast notifications shall display "<old> stopped" and "<new> started" upon task switching and be positioned just above the bottom navigation bar.
