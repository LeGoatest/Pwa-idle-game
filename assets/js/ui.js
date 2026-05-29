import { xpForLevel } from './systems/progression.js'
import { getItem } from './item_registry.js'
import { getEffectiveStats, getItemStatLines } from './systems/stats_system.js'

let toastTimeoutId = null
let toastRemoveTimeoutId = null
const warnedMissingMonsters = new Set()

export function showToast(title, body) {
  const existing = document.getElementById('game-toast')
  if (existing) existing.remove()

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId)
    toastTimeoutId = null
  }

  if (toastRemoveTimeoutId) {
    clearTimeout(toastRemoveTimeoutId)
    toastRemoveTimeoutId = null
  }

  const toast = document.createElement('div')
  toast.id = 'game-toast'
  toast.className = 'game-toast'

  toast.innerHTML = `
    <div class="game-toast__content">
      <div class="game-toast__icon-box">
        <span class="icon-[game-icons--radar-sweep] game-toast__icon"></span>
      </div>
      <div class="game-toast__body">
        <div class="game-toast__title">${title}</div>
        <div class="game-toast__text">${body}</div>
      </div>
    </div>
  `

  document.body.appendChild(toast)

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.add('is-dismissing')
    toastRemoveTimeoutId = window.setTimeout(() => toast.remove(), 300)
  }, 2500)
}

export function showOfflineSummary(report) {
  if (!report) return

  const hours = Math.floor(report.elapsed / (1000 * 60 * 60))
  const mins = Math.floor((report.elapsed % (1000 * 60 * 60)) / (1000 * 60))
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  const modalRoot = document.getElementById('modal-root')
  const modalContent = document.getElementById('modal-content')

  if (!modalRoot || !modalContent) return

  const inventoryCards = Object.entries(report.inventory || {}).map(([itemId, amount]) => {
    const item = getItem(itemId)
    return `
      <div class="offline-summary__item">
        <span class="icon-[${item?.icon || 'game-icons--cube'}] offline-summary__item-icon"></span>
        <div>
          <div class="offline-summary__item-name">${item?.name || itemId}</div>
          <div class="offline-summary__item-amount">+${amount}</div>
        </div>
      </div>
    `
  }).join('')

  modalContent.innerHTML = `
    <div class="game-card offline-summary">
      <div class="offline-summary__header">
        <div class="offline-summary__icon-box">
          <span class="icon-[game-icons--sunrise] offline-summary__icon"></span>
        </div>
        <h2 class="offline-summary__title">Welcome Back</h2>
        <p class="offline-summary__meta">Gains during ${timeStr} absence</p>
      </div>

      <div class="offline-summary__grid">
        ${inventoryCards}
      </div>

      <button class="game-button game-button--primary offline-summary__button" data-action="close-modal">
        <span class="icon-[game-icons--check-mark] icon-sm"></span>
        <span class="offline-summary__button-text">Acknowledge</span>
      </button>
    </div>
  `

  modalRoot.classList.remove('hidden')
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = value
  })
}

function setWidth(selector, pct) {
  document.querySelectorAll(selector).forEach((el) => {
    el.style.width = `${pct}%`
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}


function getScreenTitle(state) {
  const titleMap = {
    combat: 'Combat',
    equipment: 'Equipment',
    skills: 'Skills',
    items: 'Inventory',
    inventory: 'Inventory',
    shop: 'Shop',
    map: 'Map',
    settings: 'Settings'
  }

  return titleMap[state.ui?.tab] || 'Combat'
}

function getActiveTaskName(state, contentState) {
  if (state.activity?.reason === 'defeated') return 'Defeated'
  if (state.activity?.reason === 'paused') return 'Paused'

  if (state.activity?.kind === 'combat') {
    const monsterName =
      contentState.activeMonster?.name ||
      contentState.registry?.monsters?.[state.activity.monsterId]?.name ||
      'Monster'
    return `Fighting ${monsterName}`
  }

  if (state.activity?.kind === 'node') {
    const activeNode = contentState.activeNode ||
      contentState.registry?.skills?.[state.activity.skillId]?.nodes?.find((node) => node.id === state.activity.nodeId)
    return activeNode?.name || 'Working'
  }

  return 'Idle'
}

function renderHeader(state, contentState) {
  setText('[data-bind="screenTitle"]', getScreenTitle(state))
  setText('[data-bind="activeTaskName"]', getActiveTaskName(state, contentState))
}

function renderNav(state) {
  const activeTab = state.ui?.tab || 'combat'

  document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
    const active = btn.dataset.navTab === activeTab
    btn.setAttribute('aria-selected', active ? 'true' : 'false')
  })
}


function renderStats(state) {
  const stats = getEffectiveStats(state)

  setText('[data-bind="gold"]', String(state.gold ?? 0))
  setText('[data-bind="kills"]', String(state.kills ?? 0))
  setText('[data-bind="attack"]', String(stats.attack))
  setText('[data-bind="defense"]', String(stats.defense))
  setText('[data-bind="hp"]', `${state.hp ?? 0}/${stats.maxHp}`)
  setText('[data-bind="lastFoodHeal"]', String(state.lastFoodEaten?.heal ?? 0))
  const combatLevel = state.combatLevel ?? 1
  const combatNextXp = xpForLevel(combatLevel)
  const combatXp = state.combatXp ?? 0

  setText('[data-bind="combatLevel"]', String(combatLevel))
  setText('[data-bind="combatXp"]', String(combatXp))
  setText('[data-bind="combatNextXp"]', String(combatNextXp))
  setWidth('[data-combat-xp-bar]', Math.max(0, Math.min(100, (combatXp / combatNextXp) * 100)))
}



function renderCombatPrimaryAction(state) {
  const isCombatActive = state.activity?.kind === 'combat'
  const icon = isCombatActive ? '⏸' : '▶'
  const ariaLabel = isCombatActive ? 'Stop combat' : 'Start combat'

  document.querySelectorAll('[data-bind="combatPrimaryIcon"]').forEach((button) => {
    button.textContent = icon
    button.setAttribute('aria-label', ariaLabel)
    button.classList.toggle('is-active', isCombatActive)
  })
}

function renderCombatBars(state, contentState) {
  const stats = getEffectiveStats(state)
  const monster = contentState?.activeMonster || null
  const enemyDuration = monster?.attackSpeedMs || monster?.durationMs || 3000
  const progress = state.activity?.kind === 'combat'
    ? Math.max(0, Math.min(100, ((state.activity?.progress || 0) / stats.actionSpeedMs) * 100))
    : 0
  const enemyProgress = state.activity?.kind === 'combat'
    ? Math.max(0, Math.min(100, ((state.activity?.enemyProgress || 0) / enemyDuration) * 100))
    : 0

  setText('[data-bind="actionSpeed"]', `${(stats.actionSpeedMs / 1000).toFixed(1)}s`)
  setText('[data-bind="enemySpeed"]', monster ? `${(enemyDuration / 1000).toFixed(1)}s` : '--')
  setWidth('[data-task-bar]', progress)
  setWidth('[data-enemy-action-bar]', enemyProgress)
}

function renderMonsterList(contentState) {
  const root = document.querySelector('[data-monster-list]')
  if (!root) return

  const zone = contentState.activeZone
  const monsters = (zone?.monsters || [])
    .map((monsterId) => contentState.registry?.monsters?.[monsterId])
    .filter(Boolean)

  root.innerHTML = monsters.map((monster) => `
    <button class="monster-list__button" data-monster-open="${monster.id}">
      <span class="monster-list__name">${monster.name}</span>
      <span class="monster-list__meta">Lv. ${monster.level || 1}</span>
    </button>
  `).join('')
}

function getFirstZoneFromIndex(contentState) {
  const firstZone = contentState.zonesIndex?.zones?.[0] || contentState.registry?.zonesList?.[0] || null
  const firstZoneId = typeof firstZone === 'string' ? firstZone : firstZone?.id || null
  return firstZoneId ? contentState.registry?.zones?.[firstZoneId] || null : null
}

function createMissingMonsterCard(monsterId) {
  if (monsterId && !warnedMissingMonsters.has(monsterId)) {
    console.warn(`[content] Monster "${monsterId}" is missing. Rendering a placeholder monster card.`)
    warnedMissingMonsters.add(monsterId)
  }

  return {
    id: monsterId || 'missing_monster',
    name: monsterId ? monsterId.replace(/_/g, ' ') : 'Unknown Monster',
    level: 1,
    hp: 1,
    attack: 0,
    defense: 0,
    durationMs: 3000,
    missingContent: true
  }
}

function resolvePanelMonster(state, contentState) {
  const registry = contentState.registry?.monsters || {}
  const firstZone = contentState.activeZone || getFirstZoneFromIndex(contentState)
  const firstZoneMonsterId = firstZone?.monsters?.[0] || null
  const selectedId = state.ui?.currentMonsterId || firstZoneMonsterId || contentState.activeMonster?.id || null

  if (!selectedId) return contentState.activeMonster || null

  if (registry[selectedId]) return registry[selectedId]

  return createMissingMonsterCard(selectedId)
}

function renderMonsterPanel(state, contentState) {
  const root = document.querySelector('[data-monster-panel]')
  if (!root) return

  const monster = resolvePanelMonster(state, contentState)

  if (!monster) {
    root.innerHTML = `
      <article class="combat-monster-card combat-monster-card--placeholder">
        <div class="combat-monster-card__placeholder-icon">◈</div>
        <div class="combat-monster-card__placeholder-title">No monster available</div>
        <div class="combat-monster-card__placeholder-copy">Choose a zone with monsters to begin combat.</div>
      </article>
      <div class="combat-stat-pill" aria-label="Enemy stats">
        <div class="combat-stat-pill__item combat-stat-pill__item--attack"><span class="combat-stat-pill__icon">⚔</span><span class="combat-stat-pill__value">0</span></div>
        <div class="combat-stat-pill__item combat-stat-pill__item--level"><span class="combat-stat-pill__icon">💪</span><span class="combat-stat-pill__value">0</span></div>
        <div class="combat-stat-pill__item combat-stat-pill__item--defense"><span class="combat-stat-pill__icon">🛡</span><span class="combat-stat-pill__value">0</span></div>
        <div class="combat-stat-pill__item combat-stat-pill__item--hp"><span class="combat-stat-pill__icon">♥</span><span class="combat-stat-pill__value">0</span></div>
      </div>
    `
    setText('[data-bind="enemySpeed"]', '--')
    setWidth('[data-enemy-action-bar]', 0)
    return
  }

  const enemyMaxHp = monster.hp || state.enemyMaxHp || 1
  const isSelectedMonster = state.ui?.currentMonsterId === monster.id || contentState.activeMonster?.id === monster.id
  const hasMatchingEnemy = state.enemyMaxHp === enemyMaxHp
  const visibleEnemyHp = isSelectedMonster && hasMatchingEnemy ? state.enemyHp : enemyMaxHp
  const enemyHp = Math.max(0, Math.min(visibleEnemyHp ?? enemyMaxHp, enemyMaxHp))
  const enemyDuration = monster.attackSpeedMs || monster.durationMs || 3000
  const missingBadge = monster.missingContent
    ? '<div class="combat-monster-card__missing-badge">Missing content placeholder</div>'
    : ''

  root.innerHTML = `
    <article class="combat-monster-card">
      <div class="combat-monster-card__sprite-frame">
        <span class="icon-[game-icons--rat] combat-monster-card__sprite"></span>
      </div>
      <h2 class="combat-monster-card__name">${escapeHtml(monster.name)}</h2>
      ${missingBadge}
    </article>

    <div class="combat-stat-pill" aria-label="Enemy stats">
      <div class="combat-stat-pill__item combat-stat-pill__item--attack"><span class="combat-stat-pill__icon">⚔</span><span class="combat-stat-pill__value">${monster.attack || 1}</span></div>
      <div class="combat-stat-pill__item combat-stat-pill__item--level"><span class="combat-stat-pill__icon">💪</span><span class="combat-stat-pill__value">${monster.level || 1}</span></div>
      <div class="combat-stat-pill__item combat-stat-pill__item--defense"><span class="combat-stat-pill__icon">🛡</span><span class="combat-stat-pill__value">${monster.defense || 0}</span></div>
      <div class="combat-stat-pill__item combat-stat-pill__item--hp"><span class="combat-stat-pill__icon">♥</span><span class="combat-stat-pill__value">${enemyHp}</span></div>
    </div>
  `

  setText('[data-bind="enemySpeed"]', `${(enemyDuration / 1000).toFixed(1)}s`)
}


function getZoneLevelRange(zone, contentState) {
  const levels = (zone?.monsters || [])
    .map((monsterId) => contentState.registry?.monsters?.[monsterId]?.level)
    .filter((level) => Number.isFinite(level))

  if (!levels.length) return '?-?'
  return `${Math.min(...levels)}-${Math.max(...levels)}`
}

function renderTargetSelector(state, contentState) {
  const root = document.querySelector('[data-combat-select-overlay]')
  if (!root) return

  const isOpen = Boolean(state.ui?.targetSelectorOpen)
  root.classList.toggle('is-open', isOpen)
  root.setAttribute('aria-hidden', isOpen ? 'false' : 'true')

  if (!isOpen) {
    root.innerHTML = ''
    return
  }

  const activeZone = contentState.activeZone || getFirstZoneFromIndex(contentState)
  const zoneTitle = activeZone?.name || 'The Hayloft'
  const zoneRange = getZoneLevelRange(activeZone, contentState)
  const selectedMonsterId = state.ui?.currentMonsterId || contentState.activeMonster?.id || ''
  const monsterIds = activeZone?.monsters || []
  const enemyCards = monsterIds.slice(0, 4).map((monsterId) => {
    const monster = contentState.registry?.monsters?.[monsterId] || createMissingMonsterCard(monsterId)
    const activeClass = monster.id === selectedMonsterId ? ' is-active' : ''
    return `
      <button class="combat-enemy-option${activeClass}" data-monster-select="${escapeHtml(monster.id)}" type="button">
        <span class="combat-enemy-option__sprite">${monster.missingContent ? '?' : '🦇'}</span>
        <span class="combat-enemy-option__level">${escapeHtml(monster.name)} · ${monster.level || 1}</span>
      </button>
    `
  }).join('')
  const unknownCards = Array.from({ length: Math.max(0, 4 - monsterIds.slice(0, 4).length) }, () => `
    <div class="combat-enemy-option combat-enemy-option--unknown">
      <span class="combat-enemy-option__sprite">?</span>
      <span class="combat-enemy-option__level">Unknown</span>
    </div>
  `).join('')
  const lockedRows = [5, 10, 15].map((level) => `
    <button class="combat-locked-area" data-locked-requirement="${level}" type="button">
      <span class="combat-locked-area__title">Locked</span>
      <span class="combat-locked-area__range">?-?</span>
      <span class="combat-locked-area__requirement">⚔ ${level}</span>
    </button>
  `).join('')

  root.innerHTML = `
    <button class="combat-select-overlay__backdrop" data-action="closeTargetSelector" aria-label="Close monster selector"></button>
    <div class="combat-select-overlay__panel" role="dialog" aria-modal="true" aria-label="Monster and area select">
      <section class="combat-area-card">
        <header class="combat-area-card__header">
          <h3 class="combat-area-card__title">${escapeHtml(zoneTitle)}</h3>
          <span class="combat-area-card__range">${escapeHtml(zoneRange)}</span>
        </header>
        <div class="combat-area-card__enemy-grid">
          ${enemyCards}${unknownCards}
        </div>
      </section>
      <div class="combat-locked-area-list">
        ${lockedRows}
      </div>
    </div>
  `
}

function renderInventory(state) {
  const root = document.querySelector('[data-inventory-list]')
  if (!root) return

  const inventory = state.inventory || {}
  const entries = Object.entries(inventory)

  root.innerHTML = entries.map(([itemId, amount]) => {
    const item = getItem(itemId)
    const statLines = getItemStatLines(item)
    const foodLine = item?.type === 'food' && item.heal ? [`Heals ${item.heal} HP`] : []
    const detail = [...statLines, ...foodLine].join(' · ')

    return `
      <div class="inventory-item">
        <div class="inventory-item__body-wrap">
          <span class="icon-[${item?.icon || 'game-icons--cube'}] inventory-item__icon"></span>
          <div class="inventory-item__body">
            <div class="inventory-item__name">${item?.name || itemId}</div>
            ${detail ? `<div class="inventory-item__meta">${detail}</div>` : ''}
          </div>
        </div>
        <div class="inventory-item__amount">${amount}</div>
      </div>
    `
  }).join('')
}

function renderEquipment(state) {
  const slots = document.querySelectorAll('[data-equip-slot]')
  if (!slots.length) return

  const equipment = state.equipment || {}

  slots.forEach((slot) => {
    const id = equipment[slot.dataset.equipSlot]
    const item = id ? getItem(id) : null

    const name = slot.querySelector('[data-equip-name]')
    if (name) name.textContent = item?.name || 'Empty'

    const meta = slot.querySelector('[data-equip-meta]')
    if (meta) meta.textContent = item ? getItemStatLines(item).join(' · ') || 'No modifiers' : 'Nothing equipped'

    const icon = slot.querySelector('[data-equip-icon]')
    if (icon && item?.icon) {
      icon.className = `icon-[${item.icon}] equipment-slot__icon equipment-slot__icon--equipped`
    }
  })
}

export function render(state, contentState) {
  renderHeader(state, contentState)
  renderNav(state)
  renderStats(state)
  renderCombatPrimaryAction(state)
  renderCombatBars(state, contentState)
  renderMonsterList(contentState)
  renderMonsterPanel(state, contentState)
  renderTargetSelector(state, contentState)
  renderInventory(state)
  renderEquipment(state)
}
