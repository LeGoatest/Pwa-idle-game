# INVARIANT MODEL

## 1. System Truths
- **Persistence Invariant**: Every significant change in game state must be scheduled for persistence in IndexedDB.
- **UI Invariant**: The `#view-root` element must always contain a valid view partial loaded from `views/`.
- **Tick Invariant**: The game loop in `game.js` must run at a consistent interval (e.g., 1 second) regardless of which view is active.

## 2. Resource Invariants
- **Non-Negative Resources**: Game resources (gold, items, etc.) must never drop below zero.
- **Capacity Constraints**: Inventory and other storage systems must respect defined capacity limits.
