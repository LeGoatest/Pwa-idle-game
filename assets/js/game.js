import {
  GAME_STATE_KEY,
  META_KEY,
  STORE_GAME,
  STORE_META,
  clearDb,
  idbGet,
  idbSet
} from './db.js'

import {
  MAX_OFFLINE_MS,
  SAVE_DEBOUNCE_MS,
  TICK_MS,
  cloneDefaultMeta,
  cloneDefaultState,
  createInstallId
} from './state.js'

import { initPwa } from './pwa.js'
import { render, showOfflineSummary, showToast } from './ui.js'
import { loadRegistryData } from './content_loader.js'
import { loadItemRegistry, getItem } from './item_registry.js'
import { processActivity } from './systems/engine_loop.js'
import { startActivity, stopActivity } from './systems/activity_system.js'

let state = cloneDefaultState()
let meta = cloneDefaultMeta()

let lastTickAt = Date.now()
let lastSaveAt = 0
let dirty = false

const contentState = {
  registry: null,
  zonesIndex: null,
  skillsIndex: null,
  shopItems: [],
  activeZone: null,
  activeMonster: null,
  activeDropTable: null,
  activeNode: null,
  activeSkill: null
}

function markDirty() {
  dirty = true
}

async function save(force = false) {
  const now = Date.now()

  if (!force && (!dirty || now - lastSaveAt < SAVE_DEBOUNCE_MS)) return

  state.updatedAt = now
  await idbSet(STORE_GAME, GAME_STATE_KEY, state)

  lastSaveAt = now
  dirty = false
}

async function saveMeta() {
  await idbSet(STORE_META, META_KEY, meta)
}

function mergeState(base, saved) {
  const merged = { ...base, ...saved }

  merged.ui = { ...base.ui, ...(saved.ui || {}) }
  merged.activity = { ...base.activity, ...(saved.activity || {}) }
  merged.inventory = { ...(base.inventory || {}), ...(saved.inventory || {}) }
  merged.equipment = { ...(base.equipment || {}), ...(saved.equipment || {}) }

  return merged
}

async function load() {
  const savedState = await idbGet(STORE_GAME, GAME_STATE_KEY)
  state = savedState
    ? mergeState(cloneDefaultState(), savedState)
    : cloneDefaultState()

  const savedMeta = await idbGet(STORE_META, META_KEY)
  meta = savedMeta
    ? { ...cloneDefaultMeta(), ...savedMeta }
    : cloneDefaultMeta()

  if (!meta.installId) {
    meta.installId = createInstallId()
    meta.installedAt = Date.now()
  }

  meta.launchCount += 1
  meta.lastLaunchedAt = Date.now()

  await saveMeta()
}

async function resetGame() {
  await clearDb()

  state = cloneDefaultState()
  meta = cloneDefaultMeta()
  meta.installId = createInstallId()
  meta.installedAt = Date.now()
  meta.launchCount = 1
  meta.lastLaunchedAt = Date.now()

  contentState.registry = null
  contentState.zonesIndex = null
  contentState.skillsIndex = null
  contentState.shopItems = []
  contentState.activeZone = null
  contentState.activeMonster = null
  contentState.activeDropTable = null
  contentState.activeNode = null
  contentState.activeSkill = null

  markDirty()
  await save(true)
  await saveMeta()
  render(state, contentState)
}

function ensureInventoryItem(itemKey, amount = 1) {
  if (!state.inventory) state.inventory = {}
  state.inventory[itemKey] = (state.inventory[itemKey] || 0) + amount
}

function removeInventoryItem(itemKey, amount = 1) {
  if (!state.inventory?.[itemKey]) return false

  state.inventory[itemKey] -= amount
  if (state.inventory[itemKey] <= 0) {
    delete state.inventory[itemKey]
  }
  return true
}

function setCurrentTab(tab) {
  state.ui.tab = tab
  markDirty()
}

function setCurrentZone(zoneId) {
  state.ui.currentZoneId = zoneId
  markDirty()
}

function setCurrentMonster(monsterId) {
  state.ui.currentMonsterId = monsterId
  markDirty()
}

function setCurrentSkill(skillId) {
  state.ui.currentSkillId = skillId
  markDirty()
}

function equipByItemId(itemId) {
  const item = getItem(itemId)
  if (!item?.equipSlot) return false
  if (!state.inventory?.[itemId]) return false

  if (!state.equipment) state.equipment = {}

  const previous = state.equipment[item.equipSlot]
  if (previous === itemId) return true

  if (previous) {
    ensureInventoryItem(previous, 1)
  }

  removeInventoryItem(itemId, 1)
  state.equipment[item.equipSlot] = itemId
  markDirty()
  return true
}

function progressOffline() {
  const elapsed = Math.min(Date.now() - state.updatedAt, MAX_OFFLINE_MS)
  if (elapsed < 1000) return null

  hydrateActivityTargets()

  const start = {
    gold: state.gold,
    kills: state.kills,
    inventory: structuredClone(state.inventory || {})
  }

  processActivity(state, contentState, elapsed)

  const inventoryDiff = {}
  const before = start.inventory
  const after = state.inventory || {}
  const itemIds = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const itemId of itemIds) {
    const diff = (after[itemId] || 0) - (before[itemId] || 0)
    if (diff > 0) inventoryDiff[itemId] = diff
  }

  return {
    elapsed,
    gold: state.gold - start.gold,
    kills: state.kills - start.kills,
    inventory: inventoryDiff
  }
}

async function loadInitialContent() {
  contentState.registry = await loadRegistryData()
  contentState.zonesIndex = contentState.registry.zonesIndex
  contentState.skillsIndex = contentState.registry.skillsIndex
  contentState.shopItems = contentState.registry.shopItemsList || []

  await loadItemRegistry()

  hydrateActivityTargets()

  if (state.ui?.currentZoneId) {
    openZone(state.ui.currentZoneId, false)
  }

  if (state.ui?.currentMonsterId) {
    openMonster(state.ui.currentMonsterId, false)
  }

  if (state.ui?.currentSkillId) {
    openSkill(state.ui.currentSkillId, false)
  }
}

function hydrateActivityTargets() {
  const activity = state.activity || {}

  contentState.activeNode = null
  contentState.activeMonster = null
  contentState.activeDropTable = null
  contentState.activeSkill = null

  if (activity.kind === 'node' && activity.skillId) {
    contentState.activeSkill = contentState.registry?.skills?.[activity.skillId] || null
    contentState.activeNode = contentState.activeSkill?.nodes?.find(n => n.id === activity.nodeId) || null
  }

  if (activity.kind === 'combat' && activity.monsterId) {
    contentState.activeMonster = contentState.registry?.monsters?.[activity.monsterId] || null
    contentState.activeDropTable = contentState.activeMonster
      ? contentState.registry?.dropTables?.[contentState.activeMonster.dropTable] || null
      : null
  }
}

async function openTab(tab, persist = true) {
  if (persist) setCurrentTab(tab)

  const routeMap = {
    combat: './views/combat.html',
    map: './views/map.html',
    skills: './views/skills.html',
    equipment: './views/equipment.html',
    items: './views/inventory.html',
    shop: './views/shop.html'
  }

  const route = routeMap[tab] || './views/combat.html'

  if (typeof htmx !== 'undefined') {
    await htmx.ajax('GET', route, {
      target: '#view-root',
      swap: 'innerHTML show:top'
    })
  }
}

function openZone(zoneId, persist = true) {
  contentState.activeZone = contentState.registry?.zones?.[zoneId] || null
  contentState.activeMonster = null
  contentState.activeDropTable = null

  if (persist) {
    setCurrentZone(zoneId)
    setCurrentMonster(null)
  }

  state.ui.combatMode = 'zone'
  markDirty()
  render(state, contentState)
}

function openMonster(monsterId, persist = true) {
  contentState.activeMonster = contentState.registry?.monsters?.[monsterId] || null
  contentState.activeDropTable = contentState.activeMonster
    ? contentState.registry?.dropTables?.[contentState.activeMonster.dropTable] || null
    : null

  if (persist) {
    setCurrentMonster(monsterId)
  }

  if (contentState.activeMonster) {
    state.ui.combatMode = 'monster'
    state.enemyMaxHp = contentState.activeMonster.hp || 12
    state.enemyHp = state.enemyMaxHp
  }

  markDirty()
  render(state, contentState)
}

function openSkill(skillId, persist = true) {
  contentState.activeSkill = contentState.registry?.skills?.[skillId] || null
  contentState.activeNode = null

  if (persist) {
    setCurrentSkill(skillId)
  }

  state.ui.skillsMode = 'detail'
  markDirty()
  render(state, contentState)
}

function startSkillNode(nodeId) {
  const skill = contentState.activeSkill
  if (!skill) return

  const node = skill.nodes
