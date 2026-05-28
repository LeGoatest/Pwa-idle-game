import { xpForLevel } from './systems/progression.js'
import { getItem } from './item_registry.js'
import { getEffectiveStats, getItemStatLines } from './systems/stats_system.js'

let toastTimeoutId = null
let toastRemoveTimeoutId = null

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
  toast.className = [
    'fixed',
    'left-1/2',
    '-translate-x-1/2',
    'bottom-28',
    'z-[200]',
    'w-[calc(100%-2rem)]',
    'max-w-sm',
    'bg-zinc-900/95',
    'border',
    'border-cyan-500/30',
    'rounded-2xl',
    'p-4',
    'shadow-[0_0_30px_rgba(34,211,238,0.2)]',
    'backdrop-blur-md'
  ].join(' ')

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
        <span class="icon-[game-icons--radar-sweep] icon-md text-cyan-400"></span>
      </div>
      <div class="min-w-0">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/70">${title}</div>
        <div class="text-sm font-black text-zinc-100 truncate">${body}</div>
      </div>
    </div>
  `

  document.body.appendChild(toast)

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-300')
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
      <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
        <span class="icon-[${item?.icon || 'game-icons--cube'}] text-cyan-400 w-5 h-5"></span>
        <div>
          <div class="text-[8px] font-black uppercase text-zinc-500">${item?.name || itemId}</div>
          <div class="text-sm font-black tabular-nums">+${amount}</div>
        </div>
      </div>
    `
  }).join('')

  modalContent.innerHTML = `
    <div class="pixel-card bg-zinc-900 border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-full mb-4 border border-cyan-500/20">
          <span class="icon-[game-icons--sunrise] text-cyan-400 w-10 h-10"></span>
        </div>
        <h2 class="text-2xl font-black uppercase tracking-tighter italic">Welcome Back</h2>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Gains during ${timeStr} absence</p>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        ${inventoryCards}
      </div>

      <button class="btn-primary w-full py-4 flex items-center justify-center gap-2" data-action="close-modal">
        <span class="icon-[game-icons--check-mark] icon-sm"></span>
        <span class="text-xs font-black uppercase tracking-widest">Acknowledge</span>
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
    const tab = btn.dataset.navTab
    const active = tab === activeTab

    btn.setAttribute('aria-selected', active ? 'true' : 'false')

    if (tab === 'skills') {
      if (active) {
        btn.classList.remove('text-zinc-100')
        btn.classList.add('text-cyan-400')
      } else {
        btn.classList.remove('text-cyan-400')
        btn.classList.add('text-zinc-100')
      }
      return
    }

    if (active) {
      btn.classList.remove('text-zinc-400')
      btn.classList.add('text-cyan-400')
    } else {
      btn.classList.remove('text-cyan-400')
      btn.classList.add('text-zinc-400')
    }
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
  setText('[data-bind="combatLevel"]', String(state.combatLevel ?? 1))
  setText('[data-bind="combatXp"]', String(state.combatXp ?? 0))
  setText('[data-bind="combatNextXp"]', String(xpForLevel((state.combatLevel ?? 1) + 1)))
}

function renderMonsterList(contentState) {
  const root = document.querySelector('[data-monster-list]')
  if (!root) return

  const zone = contentState.activeZone
  const monsters = (zone?.monsters || [])
    .map((monsterId) => contentState.registry?.monsters?.[monsterId])
    .filter(Boolean)

  root.innerHTML = monsters.map((monster) => `
    <button class="w-full rounded-3xl bg-zinc-800/80 p-4 text-left flex items-center justify-between" data-monster-open="${monster.id}">
      <span class="font-black">${monster.name}</span>
      <span class="text-xs text-zinc-400">Lv. ${monster.level || 1}</span>
    </button>
  `).join('')
}

function renderMonsterPanel(state, contentState) {
  const root = document.querySelector('[data-monster-panel]')
  if (!root) return

  const monster = contentState.activeMonster
    || contentState.registry?.monsters?.[contentState.activeZone?.monsters?.[0]]
    || null

  if (!monster) {
    root.innerHTML = `
      <div class="rounded-[2rem] bg-zinc-800/80 p-8 text-center text-zinc-500">
        Select a monster
      </div>
    `
    return
  }

  const enemyMaxHp = monster.hp || state.enemyMaxHp || 1
  const enemyHp = Math.max(0, Math.min(state.enemyHp || enemyMaxHp, enemyMaxHp))
  const enemyPct = Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100))

  root.innerHTML = `
    <div class="rounded-[2rem] bg-zinc-700/80 p-5 text-center">
      <div class="rounded-[1.5rem] bg-zinc-800/70 h-56 flex items-center justify-center mb-4">
        <div class="rounded-3xl bg-zinc-800/80 w-44 h-44 flex items-center justify-center text-4xl text-zinc-400">◈</div>
      </div>
      <div class="text-3xl text-zinc-100">${monster.name}</div>
    </div>

    <div class="grid grid-cols-4 gap-2 rounded-3xl bg-zinc-700/80 px-4 py-3 text-center text-xl">
      <div><span class="text-cyan-400">⚔</span> ${monster.attack || 1}</div>
      <div><span class="text-zinc-300">💪</span> ${monster.level || 1}</div>
      <div><span class="text-emerald-400">🛡</span> ${monster.defense || 0}</div>
      <div><span class="text-rose-400">♥</span> ${enemyMaxHp}</div>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <div>
        <div class="h-12 rounded-2xl bg-zinc-800 overflow-hidden">
          <div class="h-full bg-zinc-600" style="width:${enemyPct}%"></div>
        </div>
        <div class="mt-2 text-center text-xl text-zinc-300">${enemyHp} / ${enemyMaxHp}</div>
      </div>
      <button class="rounded-2xl bg-green-500 h-12 font-black text-zinc-950" data-action="fightMonster">Fight</button>
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
      <div class="pixel-card flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <span class="icon-[${item?.icon || 'game-icons--cube'}] text-cyan-400 w-5 h-5 shrink-0"></span>
          <div class="min-w-0">
            <div class="font-black truncate">${item?.name || itemId}</div>
            ${detail ? `<div class="text-xs text-zinc-500 truncate">${detail}</div>` : ''}
          </div>
        </div>
        <div class="font-black">${amount}</div>
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
      icon.className = `icon-[${item.icon}] icon-lg text-cyan-400`
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
