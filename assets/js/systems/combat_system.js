import { gainXp } from './progression.js'
import { consumeBestFood, getEffectiveStats } from './stats_system.js'

function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addItem(state, itemId, amount = 1) {
  if (!state.inventory) state.inventory = {}
  state.inventory[itemId] = (state.inventory[itemId] || 0) + amount
}

function stopCombat(state, reason) {
  state.activity = {
    kind: 'none',
    progress: 0,
    reason
  }
}

function awardMonsterRewards(state, monster) {
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
}

function maybeEatFood(state, stats) {
  if (state.hp > Math.ceil(stats.maxHp * 0.35)) return false

  const missingHp = Math.max(0, stats.maxHp - state.hp)
  const food = consumeBestFood(state, missingHp)
  if (!food) return false

  state.hp = Math.min(stats.maxHp, state.hp + food.heal)
  state.lastFoodEaten = {
    itemId: food.itemId,
    heal: food.heal,
    at: Date.now()
  }

  return true
}

function calculatePlayerDamage(stats, monster) {
  const monsterDefense = Math.max(0, monster.defense || 0)
  return Math.max(1, Math.floor(stats.attack - monsterDefense * 0.5))
}

function calculateEnemyDamage(stats, monster) {
  const monsterAttack = Math.max(1, monster.attack || 1)
  return Math.max(1, Math.floor(monsterAttack - stats.defense * 0.5))
}

export function processCombat(state, contentState, deltaMs) {
  const monster = contentState.activeMonster
  if (!monster) return false

  const stats = getEffectiveStats(state)

  if (!Number.isFinite(state.hp) || state.hp <= 0) {
    state.hp = stats.maxHp
  }

  state.hp = Math.min(state.hp, stats.maxHp)

  state.activity.progress += deltaMs
  state.activity.enemyProgress = (state.activity.enemyProgress || 0) + deltaMs
  state.activity.lastProcessedAt = Date.now()

  const playerDuration = stats.actionSpeedMs
  const enemyDuration = monster.attackSpeedMs || monster.durationMs || 3000
  let changed = false
  let safety = 0

  while ((state.activity.progress >= playerDuration || state.activity.enemyProgress >= enemyDuration) && safety < 500) {
    safety += 1

    if (state.activity.progress >= playerDuration) {
      state.activity.progress -= playerDuration
      state.enemyHp -= calculatePlayerDamage(stats, monster)
      changed = true

      if (state.enemyHp <= 0) {
        awardMonsterRewards(state, monster)
        state.enemyHp = monster.hp || 12
        state.enemyMaxHp = monster.hp || 12
        state.activity.enemyProgress = 0
      }
    }

    if (state.activity.enemyProgress >= enemyDuration) {
      state.activity.enemyProgress -= enemyDuration
      state.hp -= calculateEnemyDamage(stats, monster)
      changed = true

      if (maybeEatFood(state, stats)) {
        changed = true
      }

      if (state.hp <= 0) {
        state.hp = 0
        // TODO: Surface the video-style defeat modal when the player reaches 0 HP.
        stopCombat(state, 'defeated')
        return true
      }
    }
  }

  return changed
}
