# Combat UI Reference

This document records the intended Combat screen structure and button behavior based on the reference screenshots/video.

## Screen map

### 1. Top gray bar

- `Combat` title: current screen title.
- `?` icon: help/info button for the Combat screen.

### 2. Monster card

- Large gray card with the selected enemy sprite and enemy name.
- Example: bat sprite + `Bat`.
- Purpose: selected enemy display.
- Default behavior: display enemy identity/status.
- Optional future behavior: tap to open enemy details. Do not use this as the primary area selector unless explicitly changed.

### 3. Enemy stat pill

The row under the monster card shows live enemy combat stats:

```text
🗡 2   helmet/muscle 2   shield 2   ❤️ 7
```

Meaning:

```text
🗡 2                 = enemy attack
helmet/muscle 2     = enemy strength / level / power
shield 2            = enemy defense
❤️ 7                = current enemy HP
```

Important correction: the heart value is live current enemy HP, not static max HP.

Expected behavior:

```text
Enemy spawns:      ❤️ 12
Player hits for 2: ❤️ 10
Player hits for 2: ❤️ 8
Enemy reaches 0:   rewards are awarded and a new enemy instance loads
New enemy:         ❤️ 12
```

Do not add a duplicate large `Enemy HP` label elsewhere on the main combat screen.

### 4. Two black bars under enemy stats

- Left bar: player weapon/action timer.
- Right bar: enemy action timer or enemy action/HP visual, depending on final implementation.

The bars should be compact and directly connected to combat pacing. They should not create a large separated HP panel.

### 5. Timer labels

- `3s` under the left bar: player/weapon attack interval.
- `2.4s` under the right bar: enemy attack interval.

These labels describe timing, not HP.

### 6. Left equipment area

- Sword icon square: equipped weapon slot.
- `Unarmed`: current weapon name when no weapon is equipped.

In this project, this should map to `state.equipment.weapon` and the item registry.

### 7. Right attack skill area

- Blue dagger/combat icon: selected attack/combat skill.
- `Level 1`: combat/attack skill level.
- Blue progress bar: skill XP progress.
- `39 / 63`: current XP toward next combat level.

In this project, this should map to:

```text
state.combatLevel
state.combatXp
xpForLevel(state.combatLevel + 1)
```

### 8. Action buttons row

Corrected mapping:

```text
▶                 = start combat
↔ / curved arrows = open Monster / Area Select overlay
🔒                = locked future action slot
🔒                = locked future action slot
```

The curved arrows button is not auto-restart. It opens the monster/area selector.

Locked buttons should not start combat. Tapping a locked button should show a requirement or `Unlocks later` toast.

### 9. Small heart pill

- `❤️ 1`: remaining food/heal/life resource in the reference.

For this project, use this as the compact survivability/food indicator.

Recommended project meaning:

```text
❤️ current player HP
+N available food/heal uses, when useful and not visually crowded
```

Keep this compact so it does not compete with the enemy HP stat pill.

### 10. Bottom nav

Reference meanings:

```text
crossed swords = combat tab
info/person    = character/info/equipment-related tab, depending final app navigation
bar chart      = quests/stats/progression
chest/bag      = inventory/shop
gear           = settings/system menu
```

Project mapping may differ, but the bottom nav must remain persistent, compact, and must not cover combat controls.

## Monster / Area Select overlay

The curved arrows button opens this overlay.

Reference behavior:

- Dims the combat screen behind it.
- Shows unlocked area card first.
- Example unlocked area: `The Hayloft`.
- Shows range/difficulty: `2-4`.
- Shows selectable enemy cards.
- Shows unknown enemy cards as `?`.
- Shows locked rows beneath with requirements:

```text
Locked  ?-?  ⚔ 5
Locked  ?-?  ⚔ 10
Locked  ?-?  ⚔ 15
```

Expected interactions:

```text
Tap ↔ button
→ open Monster / Area Select overlay

Tap unlocked enemy
→ select that enemy
→ reset enemy HP to selected monster.hp
→ close overlay
→ rerender combat screen

Tap locked row
→ show requirement toast
→ keep overlay open

Tap outside overlay
→ close overlay
```

## Implementation notes

- Combat UI should use semantic Tailwind classes defined in `input.css`.
- JavaScript-generated markup should not contain long Tailwind utility strings.
- Keep the Combat screen compact enough to fit above the bottom nav on Android-sized screens.
- Bottom nav must not overlap key combat controls.
- Do not show the old fallback layout:
  - no `Current Activity` card
  - no `MONSTERS` heading
  - no four-card `Kills / HP / Attack / Defense` grid
  - no large duplicate `Enemy HP` label

## Mechanical requirements

Do not break existing combat mechanics:

```text
effective stats
equipment stat aggregation
enemy retaliation
food auto-healing
action speed
defense mitigation
defeat handling
loot / XP / gold rewards
```

Enemy HP display must be derived from `state.enemyHp`, and enemy max HP from `state.enemyMaxHp` or the selected monster's `hp`.
