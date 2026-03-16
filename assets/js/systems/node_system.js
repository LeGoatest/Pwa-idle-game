import { gainXp } from "./progression.js"

export function processNode(state, contentState, delta) {

  const node = contentState.activeNode
  if (!node) return false

  state.activity.progress += delta

  let changed = false

  while (state.activity.progress >= node.durationMs) {

    state.activity.progress -= node.durationMs

    if (node.yield) {
      const id = node.yield.item
      const amt = node.yield.amount || 1

      state.inventory[id] = (state.inventory[id] || 0) + amt
    }

    if (node.xp && contentState.activeSkill) {
      gainXp(state, contentState.activeSkill.id, node.xp)
    }

    changed = true
  }

  return changed
}
