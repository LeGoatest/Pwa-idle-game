# Requirements: Feedback & Certainty

## 1. Certainty Law
- [UBIQUITOUS]: The system shall confirm any state change within 250ms of a player action.
- [TRUST]: When a player starts a task, the icon shall swap and progress shall visually begin within 250ms.

## 2. Active Task Dominance
- [STATE-DRIVEN]: The `activeTask` shall be visually dominant at all times via persistent indicators and strong highlights.
- [UBIQUITOUS]: The player shall be able to identify the active task within 1 second of looking at any screen.

## 3. Cycle Completion Signals
- [STATE-DRIVEN]: Every completed cycle shall trigger an XP bar motion animation.
- [STATE-DRIVEN]: Every resource gain shall trigger a visible count change (e.g., flash or pop).
- [GUIDANCE]: The system shall guide player attention to rewards and level-up events using visual pulses or highlights.

## 4. Returning Player Experience
- [RESUME]: Upon resume from offline, the system shall display a summary of accumulated gains.
- [RESUME]: The player shall see the active task continuing smoothly from its carry-over progress.

## 5. Switch Feedback
- [EVENT-DRIVEN]: When a task replaces another, the system shall show a toast: "<old> stopped" and "<new> started".
- [EVENT-DRIVEN]: Visual priority (highlights) shall shift instantly.
