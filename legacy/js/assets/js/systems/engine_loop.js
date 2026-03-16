import { processNode } from './node_system.js'
import { processCombat } from './combat_system.js'

export function processActivity(state, contentState, deltaMs) {
  if (!state.activity) return false

  if (state.activity.kind === 'node') {
    return processNode(state, contentState, deltaMs)
  }

  if (state.activity.kind === 'combat') {
    return processCombat(state, contentState, deltaMs)
  }

  return false
}
