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
  setText('[data-bind="actionSpeed"]', `${(stats.actionSpeedMs / 1000).toFixed(2)}s`)
  const combatLevel = state.combatLevel ?? 1
  const combatNextXp = xpForLevel(combatLevel)
  const combatXp = state.combatXp ?? 0

  setText('[data-bind="combatLevel"]', String(combatLevel))
  setText('[data-bind="combatXp"]', String(combatXp))
  setText('[data-bind="combatNextXp"]', String(combatNextXp))
  setWidth('[data-task-bar]', Math.max(0, Math.min(100, (combatXp / combatNextXp) * 100)))
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

function resolvePanelMonster(state, contentState) {
  const registry = contentState.registry?.monsters || {}
  const zoneMonsterIds = contentState.activeZone?.monsters || []
  const firstId = zoneMonsterIds[0] || null
  const selectedId = state.ui?.currentMonsterId || firstId || contentState.activeMonster?.id || null

  if (selectedId && !registry[selectedId] && !warnedMissingMonsters.has(selectedId)) {
    console.warn(`[content] Monster "${selectedId}" is missing. Rendering the first active-zone monster or placeholder card.`)
    warnedMissingMonsters.add(selectedId)
  }

  return registry[selectedId] || registry[firstId] || contentState.activeMonster || null
}

function renderMonsterPanel(state, contentState) {
  const root = document.querySelector('[data-monster-panel]')
  if (!root) return

  const monster = resolvePanelMonster(state, contentState)

  if (!monster) {
    root.innerHTML = `
      <div class="monster-card monster-card--placeholder">
        <div class="monster-card__placeholder-icon">◈</div>
        <div class="monster-card__placeholder-title">No monster available</div>
        <div class="monster-card__placeholder-copy">Choose a zone with monsters to begin combat.</div>
      </div>
    `
    return
  }

  const enemyMaxHp = monster.hp || state.enemyMaxHp || 1
  const isSelectedActivity = state.activity?.kind === 'combat' && state.activity?.monsterId === monster.id
  const visibleEnemyHp = isSelectedActivity ? state.enemyHp : enemyMaxHp
  const enemyHp = Math.max(0, Math.min(visibleEnemyHp || enemyMaxHp, enemyMaxHp))
  const enemyPct = Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100))
  const enemySpeed = monster.attackSpeedMs || monster.durationMs || 3000
  const enemyProgressPct = isSelectedActivity
    ? Math.max(0, Math.min(100, ((state.activity?.enemyProgress || 0) / enemySpeed) * 100))
    : 0
  const missingBadge = monster.missingContent
    ? '<div class="monster-card__missing-badge">Missing content placeholder</div>'
    : ''

  root.innerHTML = `
    <article class="monster-card">
      <div class="monster-card__media">
        <div class="monster-card__sprite-box">
          <span class="icon-[game-icons--rat] monster-card__sprite-icon"></span>
        </div>
      </div>
      <h2 class="monster-card__title">${monster.name}</h2>
      ${missingBadge}
    </article>

    <div class="monster-stat-row">
      <div class="monster-stat-row__item"><span class="monster-stat-row__attack">⚔</span> <span>${monster.attack || 1}</span></div>
      <div class="monster-stat-row__item"><span class="monster-stat-row__level">💪</span> <span>${monster.level || 1}</span></div>
      <div class="monster-stat-row__item"><span class="monster-stat-row__defense">🛡</span> <span>${monster.defense || 0}</span></div>
      <div class="monster-stat-row__item"><span class="monster-stat-row__hp">♥</span> <span>${enemyMaxHp}</span></div>
    </div>

    <div class="combat-meter-panel">
      <div class="combat-meter-panel__label-row">
        <span>Enemy HP</span>
        <span class="combat-meter-panel__value">${enemyHp} / ${enemyMaxHp}</span>
      </div>
      <div class="combat-meter combat-meter--enemy-hp">
        <div class="combat-meter__fill combat-meter__fill--hp" style="width:${enemyPct}%"></div>
      </div>
      <div class="combat-meter combat-meter--enemy-action">
        <div class="combat-meter__fill combat-meter__fill--action" style="width:${enemyProgressPct}%"></div>
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
  renderNav(state)
  renderStats(state)
  renderMonsterList(contentState)
  renderMonsterPanel(state, contentState)
  renderInventory(state)
  renderEquipment(state)
}
