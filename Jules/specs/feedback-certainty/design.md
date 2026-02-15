# Design: Feedback & Certainty

## 1. Feedback Triggers & Signals

| Trigger | Signal | Implementation Detail |
| :--- | :--- | :--- |
| **Input: Start Task** | Icon Swap + Bar Start | Immediate DOM update in `act()`/`setActiveTask()` before `render()`. |
| **Input: Switch Task** | Dual Toast | Call `showToast` with combined messages. Instant dock highlight update. |
| **Cycle Completion** | XP Bar "Slosh" | Add CSS class `xp-slosh` to bar on completion, remove after animation. |
| **Resource Gain** | Count "Pop" | Add CSS class `stat-pop` to resource text, remove after animation. |
| **Level Up** | Glow/Pulse | Add `level-glow` to the specific level text and station header. |
| **Resume** | Summary Modal | Calculate offline rewards and present in a `modal-content` fragment. |

## 2. Visual Dominance (CSS)

- **Header Activity**: Add a secondary glowing border or pulse to the active task indicator.
- **Dock Highlights**: Increase opacity and add a subtle cyan glow to the `aria-selected` dock icon.
- **Progress Bars**: Active bars should have a "spark" or "glow" at the leading edge.

## 3. Input Trust Contract

- `setActiveTask` must perform a "Predictive Render" for the specific button and bar affected, even before the global `render()` interval ticks.
- Ensure `100ms` tick interval in `init()` remains stable for progress bar smoothness.
