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
let eventsWired = false

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

  if (previous) ensureInventoryItem(previous, 1)

  removeInventoryItem(itemId, 1)
  state.equipment[item.equipSlot] = itemId
  markDirty()
  return true
}

function hydrateActivityTargets() {
  const activity = state.activity || {}

  contentState.activeNode = null
  contentState.activeMonster = null
  contentState.activeDropTable = null
  contentState.activeSkill = null

  if (activity.kind === 'node' && activity.skillId) {
    contentState.activeSkill = contentState.registry?.skills?.[activity.skillId] || null
    contentState.activeNode = contentState.activeSkill?.nodes?.find((n) => n.id === activity.nodeId) || null
  }

  if (activity.kind === 'combat' && activity.monsterId) {
    contentState.activeMonster = contentState.registry?.monsters?.[activity.monsterId] || null
    contentState.activeDropTable = contentState.activeMonster
      ? contentState.registry?.dropTables?.[contentState.activeMonster.dropTable] || null
      : null
  }
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

  if (state.ui?.currentZoneId) openZone(state.ui.currentZoneId, false)
  if (state.ui?.currentMonsterId) openMonster(state.ui.currentMonsterId, false)
  if (state.ui?.currentSkillId) openSkill(state.ui.currentSkillId, false)
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
  } else {
    const root = document.getElementById('view-root')
    if (root) root.innerHTML = `<div class="pixel-card text-center text-red-400">HTMX not loaded</div>`
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

  if (persist) setCurrentMonster(monsterId)

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

  if (persist) setCurrentSkill(skillId)

  state.ui.skillsMode = 'detail'
  markDirty()
  render(state, contentState)
}

function startSkillNode(nodeId) {
  const skill = contentState.activeSkill
  if (!skill) return

  const node = skill.nodes?.find((n) => n.id === nodeId)
  if (!node) return

  contentState.activeNode = node

  startActivity(state, {
    kind: 'node',
    skillId: skill.id,
    nodeId
  })

  markDirty()
  showToast(skill.name, `${node.name} started`)
  render(state, contentState)
  void save()
}

function startFight() {
  if (!contentState.activeMonster) return

  startActivity(state, {
    kind: 'combat',
    monsterId: contentState.activeMonster.id
  })

  state.enemyHp = contentState.activeMonster.hp || 12
  state.enemyMaxHp = contentState.activeMonster.hp || 12

  markDirty()
  showToast('Combat', `Fighting ${contentState.activeMonster.name}`)
  render(state, contentState)
  void save()
}

async function buyItem(itemId) {
  const item = contentState.shopItems.find((i) => i.id === itemId) || null
  if (!item) {
    showToast('Shop', 'Item not found')
    return
  }

  if ((state.gold || 0) < item.price) {
    showToast('Shop', 'Not enough gold')
    return
  }

  state.gold -= item.price

  if (item.effect?.type === 'stat' && item.effect.stat) {
    state[item.effect.stat] = (state[item.effect.stat] || 0) + (item.effect.value || 0)
  } else if (item.effect?.type === 'heal') {
    state.hp = Math.min((state.hp || 0) + (item.effect.value || 0), 999999)
  } else if (item.effect?.type === 'item') {
    ensureInventoryItem(item.effect.itemKey, item.effect.amount || 1)
  } else {
    ensureInventoryItem(item.id, 1)
  }

  markDirty()
  showToast('Shop', `${item.name} purchased`)
  render(state, contentState)
  await save()
}

async function act(action, button = null) {
  if (action === 'save') {
    await save(true)
    return
  }

  if (action === 'stopActivity') {
    stopActivity(state)
    hydrateActivityTargets()
    markDirty()
    showToast('Activity stopped', 'Paused')
    render(state, contentState)
    await save()
    return
  }

  if (action === 'fightMonster') {
    startFight()
    return
  }

  if (action === 'buyItem') {
    const itemId = button?.dataset.itemId
    if (itemId) await buyItem(itemId)
    return
  }

  if (action === 'equipItem') {
    const itemId = button?.dataset.itemId
    if (itemId) {
      if (equipByItemId(itemId)) {
        showToast('Equipment', `${getItem(itemId)?.name || itemId} equipped`)
        render(state, contentState)
        await save()
      } else {
        showToast('Equipment', 'Cannot equip that item')
      }
    }
    return
  }

  if (action === 'reset' && confirm('Reset all progress?')) {
    await resetGame()
    return
  }

  if (action === 'forceUpdate') {
    if (confirm('Unregister service worker and clear cache? The app will reload.')) {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) await reg.unregister()
      }

      if ('caches' in window) {
        const keys = await caches.keys()
        for (const key of keys) await caches.delete(key)
      }

      window.location.reload()
      return
    }
  }

  render(state, contentState)
  await save()
}

function renderShop() {
  const root = document.querySelector('[data-shop-list]')
  if (!root) return

  root.innerHTML = (contentState.shopItems || []).map((item) => `
    <div class="pixel-card flex items-center justify-between gap-4">
      <div>
        <div class="font-black">${item.name}</div>
        <div class="text-sm text-zinc-500">${item.description}</div>
      </div>
      <button class="btn-primary" data-action="buyItem" data-item-id="${item.id}">
        Buy (${item.price})
      </button>
    </div>
  `).join('')
}

function wireEvents() {
  if (eventsWired) return
  eventsWired = true

  document.body.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action], [data-tab], [data-nav-tab], [data-zone-open], [data-monster-open], [data-skill-open], [data-skill-node]')
    if (!button) return

    const action = button.dataset.action
    const tab = button.dataset.tab || button.dataset.navTab
    const zoneOpen = button.dataset.zoneOpen
    const monsterOpen = button.dataset.monsterOpen
    const skillOpen = button.dataset.skillOpen
    const skillNode = button.dataset.skillNode

    if (action === 'open-modal') {
      document.getElementById('modal-root')?.classList.remove('hidden')
      return
    }

    if (action === 'close-modal') {
      document.getElementById('modal-root')?.classList.add('hidden')
      return
    }

    if (action) {
      void act(action, button)
      return
    }

    if (tab) {
      void openTab(tab, true)
      return
    }

    if (zoneOpen) {
      openZone(zoneOpen, true)
      return
    }

    if (monsterOpen) {
      openMonster(monsterOpen, true)
      return
    }

    if (skillOpen) {
      openSkill(skillOpen, true)
      return
    }

    if (skillNode) {
      startSkillNode(skillNode)
    }
  })

  document.getElementById('modal-root')?.addEventListener('click', (e) => {
    if (e.target?.id === 'modal-root') {
      document.getElementById('modal-root')?.classList.add('hidden')
    }
  })

  document.body.addEventListener('htmx:afterSwap', () => {
    render(state, contentState)
    renderShop()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void save(true)
  })

  window.addEventListener('beforeunload', () => {
    void save(true)
  })
}

function startLoop() {
  lastTickAt = Date.now()

  setInterval(() => {
    const now = Date.now()
    const delta = now - lastTickAt
    lastTickAt = now

    const changed = processActivity(state, contentState, delta)
    if (changed) markDirty()

    render(state, contentState)
    renderShop()
    void save()
  }, TICK_MS)
}

async function init() {
  wireEvents()
  initPwa()

  try {
    await load()
    await loadInitialContent()
    await openTab(state.ui?.tab || 'combat', false)

    const offline = progressOffline()
    if (offline) markDirty()

    render(state, contentState)
    renderShop()

    if (offline) showOfflineSummary(offline)

    await save(true)
    startLoop()
  } catch (error) {
    console.error('Init failed:', error)
    showToast('Startup error', error?.message || 'Check missing content files')
    render(state, contentState)
  }
}

init()
