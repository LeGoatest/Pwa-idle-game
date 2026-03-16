import { xpForLevel } from './systems/progression.js'
import { getItem } from './item_registry.js'

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
  setText('[data-bind="gold"]', String(state.gold ?? 0))
  setText('[data-bind="kills"]', String(state.kills ?? 0))
  setText('[data-bind="attack"]', String(state.attack ?? 0))
  setText('[data-bind="defense"]', String(state.defense ?? 0))
  setText('[data-bind="hp"]', String(state.hp ?? 0))
}

function renderInventory(state) {
  const root = document.querySelector('[data-inventory-list]')
  if (!root) return

  const inventory = state.inventory || {}
  const entries = Object.entries(inventory)

  root.innerHTML = entries.map(([itemId, amount]) => {
    const item = getItem(itemId)
    return `
      <div class="pixel-card flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="icon-[${item?.icon || 'game-icons--cube'}] text-cyan-400 w-5 h-5"></span>
          <div class="font-black">${item?.name || itemId}</div>
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
  })
}

export function render(state, contentState) {
  renderNav(state)
  renderStats(state)
  renderInventory(state)
  renderEquipment(state)
}
