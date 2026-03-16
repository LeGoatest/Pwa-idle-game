export const TICK_MS = 100
export const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000
export const SAVE_DEBOUNCE_MS = 5000

export const defaultState = {
  version: 8,

  gold: 0,
  kills: 0,

  attack: 2,
  defense: 1,
  hp: 20,

  woodXp: 0,
  mineXp: 0,
  combatXp: 0,

  woodLevel: 1,
  mineLevel: 1,
  combatLevel: 1,

  enemyHp: 12,
  enemyMaxHp: 12,

  inventory: {},
  equipment: {
    weapon: null,
    head: null,
    chest: null,
    offhand: null,
    feet: null
  },

  ui: {
    tab: 'combat',
    currentZoneId: null,
    currentMonsterId: null,
    currentSkillId: null,
    combatMode: 'zone',
    skillsMode: 'list'
  },

  activity: {
    kind: 'none',
    progress: 0
  },

  updatedAt: Date.now()
}

export const defaultMeta = {
  installId: '',
  installedAt: 0,
  launchCount: 0,
  lastLaunchedAt: 0
}

export function cloneDefaultState() {
  return structuredClone(defaultState)
}

export function cloneDefaultMeta() {
  return structuredClone(defaultMeta)
}

export function createInstallId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `install-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
