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

    toastRemoveTimeoutId = window.setTimeout(() => {
      toast.remove()
    }, 300)
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
        ${report.gold > 0 ? `
          <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
            <span class="icon-[game-icons--coins] text-yellow-500 w-5 h-5"></span>
            <div>
              <div class="text-[8px] font-black uppercase text-zinc-500">Gold</div>
              <div class="text-sm font-black tabular-nums">+${report.gold}</div>
            </div>
          </div>
        ` : ''}
        ${report.kills > 0 ? `
          <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
            <span class="icon-[game-icons--skull-mask] text-red-400 w-5 h-5"></span>
            <div>
              <div class="text-[8px] font-black uppercase text-zinc-500">Kills</div>
              <div class="text-sm font-black tabular-nums">+${report.kills}</div>
            </div>
          </div>
        ` : ''}
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

function getSkillMeta(skillId) {
  if (skillId === 'woodcutting') return { levelKey: 'woodLevel', xpKey: 'woodXp' }
  if (skillId === 'mining') return { levelKey: 'mineLevel', xpKey: 'mineXp' }
  if (skillId === 'combat') return { levelKey: 'combatLevel', xpKey: 'combatXp' }
  return { levelKey: `${skillId}Level`, xpKey: `${skillId}Xp` }
}

function renderInventory(state) {
  const root = document.querySelector('[data-inventory-list]')
  if (!root) return

  const inventory = state.inventory || {}
  const entries = Object.entries(inventory)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => {
      const item = getItem(itemId)
      return {
        itemId,
        amount,
        name: item?.name || itemId,
        type: item?.type || 'unknown',
        icon: item?.icon || 'game-icons--cube',
        canEquip: Boolean(item?.equipSlot)
      }
    })

  if (!entries.length) {
    root.innerHTML = `
      <div class="pixel-card text-center text-zinc-500">
        Inventory Empty
      </div>
    `
    return
  }

  root.innerHTML = entries.map((entry) => `
    <div class="pixel-card flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <span class="icon-[${entry.icon}] icon-md text-cyan-400 shrink-0"></span>
        <div class="min-w-0">
          <div class="font-black truncate">${entry.name}</div>
          <div class="text-xs uppercase tracking-[0.12em] text-zinc-500">${entry.type}</div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-sm font-black tabular-nums">${entry.amount}</div>
        ${entry.canEquip ? `
          <button class="btn-primary px-3 py-2 text-xs" data-action="equipItem" data-item-id="${entry.itemId}">
            Equip
          </button>
        ` : ''}
      </div>
    </div>
  `).join('')
}

function renderEquipment(state) {
  const slotEls = document.querySelectorAll('[data-equip-slot]')
  if (!slotEls.length) return

  const equipment = state.equipment || {}

  slotEls.forEach((el) => {
    const slot = el.dataset.equipSlot
    const itemId = equipment[slot]
    const item = itemId ? getItem(itemId) : null

    const nameEl = el.querySelector('[data-equip-name]')
    const metaEl = el.querySelector('[data-equip-meta]')
    const iconEl = el.querySelector('[data-equip-icon]')

    if (nameEl) nameEl.textContent = item?.name || 'Empty'

    if (metaEl) {
      if (item?.stats) {
        const stats = Object.entries(item.stats)
          .map(([key, value]) => `${key}+${value}`)
          .join(' • ')
        metaEl.textContent = stats || 'No bonuses'
      } else {
        metaEl.textContent = 'Nothing equipped'
      }
    }

    if (iconEl) {
      iconEl.className = `${item?.icon ? `icon-[${item.icon}]` : 'icon-[game-icons--checked-shield]'} icon-lg ${item ? 'text-cyan-400' : 'text-zinc-600'}`
    }
  })
}

function renderNav(state) {
  document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
    const active = btn.dataset.navTab === state.ui?.tab
    btn.setAttribute('aria-selected', active ? 'true' : 'false')

    if (active) {
      btn.classList.add('text-cyan-400')
      btn.classList.remove('text-zinc-400', 'text-zinc-900')
    } else {
      btn.classList.remove('text-cyan-400')
      if (btn.closest('footer')) {
        btn.classList.add('text-zinc-400')
      } else {
        btn.classList.add('text-zinc-900')
      }
    }
  })
}

function renderActivity(state, contentState) {
  const pulse = document.getElementById('active-pulse')
  const isIdle = state.activity?.kind === 'none'

  if (pulse) {
    if (isIdle) pulse.classList.add('hidden')
    else pulse.classList.remove('hidden')
  }

  const activeTaskName = (() => {
    if (state.activity?.kind === 'combat' && contentState.activeMonster) {
      return contentState.activeMonster.name
    }
    if (state.activity?.kind === 'node' && contentState.activeSkill) {
      const node = contentState.activeSkill.nodes?.find((n) => n.id === state.activity.nodeId)
      return node ? `${contentState.activeSkill.name}: ${node.name}` : contentState.activeSkill.name
    }
    return 'Idle'
  })()

  setText('[data-bind="activeTaskName"]', activeTaskName)

  document.querySelectorAll('[data-task-bar]').forEach((el) => {
    const duration = (() => {
      if (state.activity?.kind === 'combat' && contentState.activeMonster) {
        return contentState.activeMonster.durationMs || 2000
      }
      if (state.activity?.kind === 'node' && contentState.activeNode) {
        return contentState.activeNode.durationMs || 1000
      }
      return 1000
    })()

    const pct = state.activity?.kind === 'none'
      ? 0
      : Math.min(100, ((state.activity.progress ?? 0) / duration) * 100)

    el.style.width = `${pct}%`
  })

  document.querySelectorAll('[data-task-status]').forEach((el) => {
    const task = el.dataset.taskStatus
    const isActive = task === state.activity?.kind || task === state.activity?.skillId

    el.textContent = isActive ? 'Active' : 'Paused'

    if (isActive) {
      el.classList.add('text-cyan-400')
      el.classList.remove('text-zinc-500')
    } else {
      el.classList.remove('text-cyan-400')
      el.classList.add('text-zinc-500')
    }
  })

  document.querySelectorAll('[data-bind-class]').forEach((el) => {
    const expr = el.dataset.bindClass

    if (expr === "activity.kind !== 'none' ? '' : 'hidden'") {
      if (state.activity?.kind !== 'none') el.classList.remove('hidden')
      else el.classList.add('hidden')
    } else if (expr === "activity.kind === 'combat' ? '' : 'hidden'") {
      if (state.activity?.kind === 'combat') el.classList.remove('hidden')
      else el.classList.add('hidden')
    }
  })
}

function renderStats(state) {
  setText('[data-bind="gold"]', String(state.gold ?? 0))
  setText('[data-bind="kills"]', String(state.kills ?? 0))
  setText('[data-bind="attack"]', String(state.attack ?? 0))
  setText('[data-bind="defense"]', String(state.defense ?? 0))
  setText('[data-bind="hp"]', String(state.hp ?? 0))
  setText('[data-bind="enemyHp"]', `${Math.max(0, state.enemyHp ?? 0)} / ${state.enemyMaxHp ?? 0}`)

  const enemyPct = state.enemyMaxHp > 0
    ? Math.max(0, Math.min(100, ((state.enemyHp ?? 0) / state.enemyMaxHp) * 100))
    : 0

  setWidth('[data-bind-style="enemyHpPct"]', enemyPct)
}

function renderSkills(state, contentState) {
  document.querySelectorAll('[data-skill-card]').forEach((el) => {
    const skillId = el.dataset.skillCard
    const meta = getSkillMeta(skillId)
    const level = state[meta.levelKey] ?? 1
    const xp = state[meta.xpKey] ?? 0
    const xpNeeded = xpForLevel(level)
    const pct = Math.max(0, Math.min(100, (xp / xpNeeded) * 100))

    const levelEl = el.querySelector('[data-skill-level]')
    const xpEl = el.querySelector('[data-skill-xp-text]')
    const fillEl = el.querySelector('[data-skill-xp-fill]')

    if (levelEl) levelEl.textContent = String(level)
    if (xpEl) xpEl.textContent = `${xp.toFixed(1)} / ${xpNeeded.toFixed(1)} XP`
    if (fillEl) fillEl.style.width = `${pct}%`
  })

  const skillDetailRoot = document.querySelector('[data-skill-detail-root]')
  if (!skillDetailRoot) return

  if (!contentState.activeSkill) {
    skillDetailRoot.innerHTML = ''
    return
  }

  const skill = contentState.activeSkill
  const meta = getSkillMeta(skill.id)
  const level = state[meta.levelKey] ?? 1
  const xp = state[meta.xpKey] ?? 0
  const xpNeeded = xpForLevel(level)
  const pct = Math.max(0, Math.min(100, (xp / xpNeeded) * 100))

  const nameEl = skillDetailRoot.querySelector('[data-skill-detail-name]')
  const levelEl = skillDetailRoot.querySelector('[data-skill-detail-level]')
  const xpEl = skillDetailRoot.querySelector('[data-skill-detail-xp]')
  const fillEl = skillDetailRoot.querySelector('[data-skill-detail-fill]')
  const nodesRoot = skillDetailRoot.querySelector('[data-skill-nodes]')

  if (nameEl) nameEl.textContent = skill.name
  if (levelEl) levelEl.textContent = String(level)
  if (xpEl) xpEl.textContent = `${xp.toFixed(1)} / ${xpNeeded.toFixed(1)} XP`
  if (fillEl) fillEl.style.width = `${pct}%`

  if (nodesRoot) {
    nodesRoot.innerHTML = (skill.nodes || []).map((node) => {
      const locked = level < node.levelRequired
      const active = state.activity?.kind === 'node' &&
        state.activity?.skillId === skill.id &&
        state.activity?.nodeId === node.id

      const yieldText = node.yield?.item
        ? (() => {
            const item = getItem(node.yield.item)
            const amount = node.yield.amount || 1
            return `${item?.name || node.yield.item} x${amount}`
          })()
        : 'No yield'

      return `
        <button
          class="pixel-card w-full text-left ${locked ? 'opacity-50' : ''} ${active ? 'border-cyan-500/50 bg-cyan-500/5' : ''}"
          data-skill-node="${node.id}"
          ${locked ? 'disabled' : ''}>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-lg font-black">${node.name}</div>
              <div class="text-sm text-zinc-400">+${node.xp} XP • ${(node.durationMs / 1000).toFixed(2)}s</div>
              <div class="text-xs text-zinc-500 mt-1">${yieldText}</div>
            </div>
            <div class="text-sm text-zinc-500">Lvl ${node.levelRequired}</div>
          </div>
        </button>
      `
    }).join('')
  }
}

function renderZones(state, contentState) {
  const zoneListRoot = document.querySelector('[data-zone-list]')
  if (!zoneListRoot || !Array.isArray(contentState.zonesIndex?.zones)) return

  zoneListRoot.innerHTML = contentState.zonesIndex.zones.map((zone) => {
    const zoneId = typeof zone === 'string' ? zone : zone.id
    const zoneName = typeof zone === 'string' ? zone : zone.name
    const zoneLevel = typeof zone === 'string' ? 1 : (zone.levelRequired ?? 1)

    const current = state.ui?.currentZoneId === zoneId
    const unlocked = (state.combatLevel ?? 1) >= zoneLevel

    return `
      <button
        class="pixel-card w-full text-left ${current ? 'border-cyan-500/50 bg-cyan-500/5' : ''} ${!unlocked ? 'opacity-50' : ''}"
        data-zone-open="${zoneId}"
        ${!unlocked ? 'disabled' : ''}>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-black">${zoneName}</div>
            <div class="text-sm ${current ? 'text-cyan-400' : 'text-zinc-500'}">
              ${current ? 'Current Zone' : unlocked ? 'Travel Here' : 'Locked'}
            </div>
          </div>
          <div class="text-zinc-500">Lvl ${zoneLevel}+</div>
        </div>
      </button>
    `
  }).join('')
}

function renderCombat(state, contentState) {
  const monsterListRoot = document.querySelector('[data-monster-list]')
  if (monsterListRoot) {
    if (contentState.activeZone) {
      monsterListRoot.innerHTML = (contentState.activeZone.monsters || []).map((monsterId) => {
        const current = state.ui?.currentMonsterId === monsterId
        const monster = contentState.registry?.monsters?.[monsterId]
        const label = monster?.name || monsterId.replaceAll('_', ' ')

        return `
          <button
            class="pixel-card w-full text-left ${current ? 'border-cyan-500/50 bg-cyan-500/5' : ''}"
            data-monster-open="${monsterId}">
            <div class="flex items-center justify-between gap-4">
              <div class="text-lg font-black">${label}</div>
              ${monster?.level ? `<div class="text-sm text-zinc-500">Lvl ${monster.level}</div>` : ''}
            </div>
          </button>
        `
      }).join('')
    } else {
      monsterListRoot.innerHTML = `
        <div class="pixel-card text-center text-zinc-500">
          No zone selected
        </div>
      `
    }
  }

  const monsterPanelRoot = document.querySelector('[data-monster-panel]')
  if (!monsterPanelRoot) return

  if (!contentState.activeMonster) {
    monsterPanelRoot.innerHTML = `
      <div class="pixel-card text-center text-zinc-500">
        Select a monster
      </div>
    `
    return
  }

  const monster = contentState.activeMonster
  const loot = monster.loot || null

  monsterPanelRoot.innerHTML = `
    <div class="pixel-card space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-2xl font-black">${monster.name}</div>
          <div class="text-sm text-zinc-500">
            Lvl ${monster.level ?? 1} • HP ${monster.hp ?? 0} • ATK ${monster.attack ?? 0}
          </div>
        </div>
        ${monster.boss ? '<div class="text-yellow-400 font-black uppercase">Boss</div>' : ''}
      </div>

      <div class="space-y-2">
        <div class="text-sm font-black uppercase tracking-[0.15em] text-zinc-500">Enemy Vitality</div>
        <div class="h-3 rounded-full bg-zinc-800 overflow-hidden">
          <div data-bind-style="enemyHpPct" class="h-full bg-cyan-500"></div>
        </div>
        <div class="text-sm text-zinc-400" data-bind="enemyHp">${Math.max(0, state.enemyHp ?? 0)} / ${state.enemyMaxHp ?? 0}</div>
      </div>

      <div class="space-y-2">
        <div class="text-sm font-black uppercase tracking-[0.15em] text-zinc-500">Possible Drops</div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>Gold</span>
            <span>${loot?.gold?.min ?? 0}-${loot?.gold?.max ?? 0}</span>
          </div>
          ${(loot?.drops || []).map((drop) => {
            const item = getItem(drop.item)
            return `
              <div class="flex items-center justify-between text-sm">
                <span>${item?.name || drop.item}</span>
                <span>${(drop.chance * 100).toFixed(drop.chance < 0.01 ? 3 : 1)}%${drop.min ? ` (${drop.min}-${drop.max ?? drop.min})` : ''}</span>
              </div>
            `
          }).join('')}
        </div>
      </div>

      <button class="btn-primary w-full py-4 text-lg font-black" data-action="fightMonster">
        Fight ${monster.name}
      </button>
    </div>
  `
}

export function render(state, contentState) {
  renderActivity(state, contentState)
  renderStats(state)
  renderNav(state)
  renderSkills(state, contentState)
  renderZones(state, contentState)
  renderCombat(state, contentState)
  renderInventory(state)
  renderEquipment(state)
}
