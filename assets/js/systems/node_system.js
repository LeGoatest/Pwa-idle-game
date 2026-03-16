import { gainXp } from './progression.js'

function addItem(state, itemId, amount = 1) {
  if (!state.inventory) state.inventory = {}
  state.inventory[itemId] = (state.inventory[itemId] || 0) + amount
}

function skillKey(skillId) {
  if (skillId === 'woodcutting') return 'wood'
  if (skillId === 'mining') return 'mine'
  if (skillId === 'combat') return 'combat'
  return skillId
}

export function processNode(state, contentState, deltaMs) {
  const node = contentState.activeNode
  if (!node) return false

  state.activity.progress += deltaMs
  state.activity.lastProcessedAt = Date.now()

  let changed = false

  while (state.activity.progress >= node.durationMs) {
    state.activity.progress -= node.durationMs

    if (node.yield?.item) {
      addItem(state, node.yield.item, node.yield.amount || 1)

      if (node.yield.item === 'logs') state.logs += node.yield.amount || 1
      if (node.yield.item === 'ore') state.ore += node.yield.amount || 1
      if (node.yield.item === 'gold') state.gold += node.yield.amount || 1
    }

    if (node.xp && contentState.activeSkill?.id) {
      gainXp(state, skillKey(contentState.activeSkill.id), node.xp)
    }

    changed = true
  }

  return changed
}
