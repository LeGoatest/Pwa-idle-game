import { gainXp } from './progression.js'

function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addItem(state, itemId, amount = 1) {
  if (!state.inventory) state.inventory = {}
  state.inventory[itemId] = (state.inventory[itemId] || 0) + amount
}

export function processCombat(state, contentState, deltaMs) {
  const monster = contentState.activeMonster
  if (!monster) return false

  state.activity.progress += deltaMs
  state.activity.lastProcessedAt = Date.now()

  const duration = monster.durationMs || 2000
  let changed = false

  while (state.activity.progress >= duration) {
    state.activity.progress -= duration

    const damage = Math.max(1, state.attack || 1)
    state.enemyHp -= damage

    if (state.enemyHp <= 0) {
      state.kills += 1

      const loot = monster.loot || null

      if (loot?.gold) {
        state.gold += roll(loot.gold.min, loot.gold.max)
      }

      for (const drop of loot?.drops || []) {
        if (Math.random() < drop.chance) {
          const amount = roll(drop.min || 1, drop.max || 1)
          addItem(state, drop.item, amount)
        }
      }

      gainXp(state, 'combat', monster.xp || monster.rewards?.combatXp || 5)

      state.enemyHp = monster.hp || 12
      state.enemyMaxHp = monster.hp || 12
    }

    changed = true
  }

  return changed
}
