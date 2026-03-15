import {
  GAME_STATE_KEY,
  META_KEY,
  STORE_GAME,
  STORE_META,
  clearDb,
  idbGet,
  idbSet
} from './db.js';
import {
  MAX_OFFLINE_MS,
  SAVE_DEBOUNCE_MS,
  TICK_MS,
  cloneDefaultMeta,
  cloneDefaultState,
  createInstallId
} from './state.js';
import { initPwa } from './pwa.js';
import { render, showOfflineSummary, showToast } from './ui.js';
import {
  loadZonesIndex,
  loadZone,
  loadMonster,
  loadDropTable,
  loadSkillsIndex,
  loadSkill
} from './content_loader.js';
import { xpForLevel, gainXp } from './systems/progression.js';

let state = cloneDefaultState();
let meta = cloneDefaultMeta();

let lastTickAt = Date.now();
let lastSaveAt = 0;
let dirty = false;

const contentState = {
  zonesIndex: null,
  activeZone: null,
  activeMonster: null,
  activeDropTable: null,
  skillsIndex: null,
  activeSkill: null
};

function markDirty() {
  dirty = true;
}

async function save(force = false) {
  const now = Date.now();

  if (!force && (!dirty || now - lastSaveAt < SAVE_DEBOUNCE_MS)) {
    return;
  }

  state.updatedAt = now;
  await idbSet(STORE_GAME, GAME_STATE_KEY, state);
  lastSaveAt = now;
  dirty = false;
}

async function saveMeta() {
  await idbSet(STORE_META, META_KEY, meta);
}

async function load() {
  try {
    const savedState = await idbGet(STORE_GAME, GAME_STATE_KEY);
    state = savedState
      ? mergeState(cloneDefaultState(), savedState)
      : cloneDefaultState();

    const savedMeta = await idbGet(STORE_META, META_KEY);
    meta = savedMeta
      ? { ...cloneDefaultMeta(), ...savedMeta }
      : cloneDefaultMeta();

    if (!meta.installId) {
      meta.installId = createInstallId();
      meta.installedAt = Date.now();
    }

    meta.launchCount += 1;
    meta.lastLaunchedAt = Date.now();
    await saveMeta();
  } catch (error) {
    console.error('Failed to load IndexedDB state:', error);

    state = cloneDefaultState();
    meta = cloneDefaultMeta();
    meta.installId = createInstallId();
    meta.installedAt = Date.now();
    meta.launchCount = 1;
    meta.lastLaunchedAt = Date.now();
  }
}

function mergeState(base, saved) {
  const merged = {
    ...base,
    ...saved
  };

  merged.ui = {
    ...base.ui,
    ...(saved.ui || {})
  };

  merged.activity = {
    ...base.activity,
    ...(saved.activity || {})
  };

  return merged;
}

async function resetGame() {
  await clearDb();

  state = cloneDefaultState();
  meta = cloneDefaultMeta();
  meta.installId = createInstallId();
  meta.installedAt = Date.now();
  meta.launchCount = 1;
  meta.lastLaunchedAt = Date.now();

  contentState.activeSkill = null;
  contentState.activeZone = null;
  contentState.activeMonster = null;
  contentState.activeDropTable = null;

  markDirty();
  await save(true);
  await saveMeta();
  render(state, contentState);
}

function getSkillLevel(skill) {
  if (!skill) return 1;
  return state[skill.levelKey] ?? 1;
}

function getSkillXp(skill) {
  if (!skill) return 0;
  return state[skill.xpKey] ?? 0;
}

function setCurrentTab(tab) {
  state.ui.tab = tab;
  markDirty();
}

function setCurrentZone(zoneId) {
  state.ui.currentZoneId = zoneId;
  markDirty();
}

function setCurrentMonster(monsterId) {
  state.ui.currentMonsterId = monsterId;
  markDirty();
}

function setCurrentSkill(skillId) {
  state.ui.currentSkillId = skillId;
  markDirty();
}

function setActiveActivity(payload) {
  state.activity = {
    ...state.activity,
    ...payload,
    startedAt: Date.now(),
    lastProcessedAt: Date.now(),
    progress: 0
  };
  markDirty();
}

function clearActivity() {
  state.activity = {
    kind: 'none',
    skillId: null,
    nodeId: null,
    zoneId: null,
    monsterId: null,
    startedAt: 0,
    lastProcessedAt: 0,
    progress: 0
  };
  markDirty();
}

function getActiveSkillNode() {
  if (!contentState.activeSkill || !state.activity.nodeId) return null;
  return contentState.activeSkill.nodes?.find((node) => node.id === state.activity.nodeId) || null;
}

function rollRange(min = 1, max = 1) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDrops(dropTable) {
  if (!dropTable?.drops) return [];

  const drops = [];

  for (const entry of dropTable.drops) {
    if (Math.random() < entry.chance) {
      drops.push({
        item: entry.item,
        amount: rollRange(entry.min ?? 1, entry.max ?? 1)
      });
    }
  }

  return drops;
}

function ensureInventoryItem(itemKey, amount) {
  if (!state.inventory) state.inventory = {};
  state.inventory[itemKey] = (state.inventory[itemKey] || 0) + amount;
}

function processSkilling(deltaMs) {
  const node = getActiveSkillNode();
  if (!contentState.activeSkill || !node) return false;

  state.activity.progress += deltaMs;
  state.activity.lastProcessedAt = Date.now();

  let changed = false;

  while (state.activity.progress >= node.durationMs) {
    state.activity.progress -= node.durationMs;

    const yieldItem = node.yield?.item;
    const yieldAmount = node.yield?.amount ?? 1;

    if (yieldItem === 'gold') {
      state.gold += yieldAmount;
    } else if (yieldItem) {
      ensureInventoryItem(yieldItem, yieldAmount);

      if (yieldItem === 'logs') state.logs += yieldAmount;
      if (yieldItem === 'ore') state.ore += yieldAmount;
    }

    const skillMap = {
      woodcutting: 'wood',
      mining: 'mine',
      combat: 'combat'
    };

    gainXp(state, skillMap[contentState.activeSkill.id] || contentState.activeSkill.id, node.xp);
    changed = true;
  }

  return changed;
}

function processCombat(deltaMs) {
  if (!contentState.activeMonster) return false;

  state.activity.progress += deltaMs;
  state.activity.lastProcessedAt = Date.now();

  const durationMs = contentState.activeMonster.durationMs || 2000;
  let changed = false;

  while (state.activity.progress >= durationMs) {
    state.activity.progress -= durationMs;

    const damage = Math.max(1, state.attack + state.swords);
    state.enemyHp -= damage;

    if (state.enemyHp <= 0) {
      const rewards = contentState.activeMonster.rewards || {};
      const goldMin = rewards.goldMin ?? contentState.activeDropTable?.gold?.min ?? 0;
      const goldMax = rewards.goldMax ?? contentState.activeDropTable?.gold?.max ?? goldMin;

      state.kills += 1;
      state.gold += rollRange(goldMin, goldMax);

      if (rewards.combatXp) {
        gainXp(state, 'combat', rewards.combatXp);
      }

      const rolledDrops = rollDrops(contentState.activeDropTable);
      for (const drop of rolledDrops) {
        ensureInventoryItem(drop.item, drop.amount);
      }

      const maxHp = contentState.activeMonster.hp || 12;
      state.enemyMaxHp = maxHp;
      state.enemyHp = maxHp;
    }

    changed = true;
  }

  return changed;
}

function processActivity(deltaMs) {
  if (state.activity.kind === 'none') return false;
  if (state.activity.kind === 'skilling') return processSkilling(deltaMs);
  if (state.activity.kind === 'combat') return processCombat(deltaMs);
  return false;
}

function progressOffline() {
  const now = Date.now();
  const elapsed = Math.min(now - state.updatedAt, MAX_OFFLINE_MS);

  if (elapsed <= 1000) return null;

  const startState = {
    gold: state.gold,
    logs: state.logs,
    ore: state.ore,
    kills: state.kills
  };

  processActivity(elapsed);

  const report = {
    elapsed,
    gold: state.gold - startState.gold,
    logs: state.logs - startState.logs,
    ore: state.ore - startState.ore,
    kills: state.kills - startState.kills
  };

  if (report.gold || report.logs || report.ore || report.kills) {
    return report;
  }

  return null;
}

async function loadInitialContent() {
  contentState.zonesIndex = await loadZonesIndex().catch(() => ({ zones: [] }));
  contentState.skillsIndex = await loadSkillsIndex().catch(() => ({ skills: [] }));

  if (state.ui.currentZoneId) {
    await openZone(state.ui.currentZoneId, false);
  }

  if (state.ui.currentMonsterId) {
    await openMonster(state.ui.currentMonsterId, false);
  }

  if (state.ui.currentSkillId) {
    await openSkill(state.ui.currentSkillId, false);
  }
}

async function openTab(tab, persist = true) {
  if (persist) setCurrentTab(tab);

  const viewRoot = document.getElementById('view-root');
  if (!viewRoot) return;

  if (tab === 'map') {
    if (typeof htmx !== 'undefined') {
      await htmx.ajax('GET', './views/map.html', {
        target: '#view-root',
        swap: 'innerHTML show:top'
      });
    }
    return;
  }

  if (tab === 'combat') {
    if (typeof htmx !== 'undefined') {
      await htmx.ajax('GET', './views/combat.html', {
        target: '#view-root',
        swap: 'innerHTML show:top'
      });
    }
    return;
  }

  if (tab === 'skills') {
    if (typeof htmx !== 'undefined') {
      await htmx.ajax('GET', './views/skills.html', {
        target: '#view-root',
        swap: 'innerHTML show:top'
      });
    }
    return;
  }

  if (tab === 'items') {
    if (typeof htmx !== 'undefined') {
      await htmx.ajax('GET', './views/inventory.html', {
        target: '#view-root',
        swap: 'innerHTML show:top'
      });
    }
    return;
  }

  if (tab === 'shop') {
    if (typeof htmx !== 'undefined') {
      await htmx.ajax('GET', './views/shop.html', {
        target: '#view-root',
        swap: 'innerHTML show:top'
      });
    }
  }
}

async function openZone(zoneId, persist = true) {
  contentState.activeZone = await loadZone(zoneId);
  contentState.activeMonster = null;
  contentState.activeDropTable = null;

  if (persist) {
    setCurrentZone(zoneId);
    setCurrentMonster(null);
  }

  state.ui.combatMode = 'zone';
  markDirty();
  render(state, contentState);
}

async function openMonster(monsterId, persist = true) {
  contentState.activeMonster = await loadMonster(monsterId);
  contentState.activeDropTable = await loadDropTable(contentState.activeMonster.dropTable);

  if (persist) {
    setCurrentMonster(monsterId);
  }

  state.ui.combatMode = 'monster';
  state.enemyMaxHp = contentState.activeMonster.hp || 12;
  state.enemyHp = Math.min(state.enemyHp || state.enemyMaxHp, state.enemyMaxHp);
  if (state.enemyHp <= 0) state.enemyHp = state.enemyMaxHp;

  markDirty();
  render(state, contentState);
}

async function openSkill(skillId, persist = true) {
  contentState.activeSkill = await loadSkill(skillId);

  if (persist) {
    setCurrentSkill(skillId);
  }

  state.ui.skillsMode = 'detail';
  markDirty();
  render(state, contentState);
}

function startSkillNode(nodeId) {
  if (!contentState.activeSkill) return;

  const node = contentState.activeSkill.nodes?.find((entry) => entry.id === nodeId);
  if (!node) return;

  const level = getSkillLevel(contentState.activeSkill);
  if (level < node.levelRequired) {
    showToast('Locked', `${node.name} requires level ${node.levelRequired}`);
    return;
  }

  setActiveActivity({
    kind: 'skilling',
    skillId: contentState.activeSkill.id,
    nodeId,
    zoneId: null,
    monsterId: null
  });

  showToast(contentState.activeSkill.name, `${node.name} started`);
  render(state, contentState);
  void save();
}

function startMonsterFight() {
  if (!contentState.activeMonster) return;

  setActiveActivity({
    kind: 'combat',
    skillId: 'combat',
    nodeId: null,
    zoneId: state.ui.currentZoneId,
    monsterId: contentState.activeMonster.id
  });

  state.enemyMaxHp = contentState.activeMonster.hp || 12;
  state.enemyHp = state.enemyMaxHp;

  showToast('Combat', `Fighting ${contentState.activeMonster.name}`);
  render(state, contentState);
  void save();
}

async function act(action) {
  if (action === 'save') {
    await save(true);
    return;
  }

  if (action === 'stopActivity') {
    clearActivity();
    showToast('Activity stopped', 'Paused');
    render(state, contentState);
    await save();
    return;
  }

  if (action === 'reset' && confirm('Reset all progress?')) {
    await resetGame();
    return;
  }

  if (action === 'forceUpdate') {
    if (confirm('Unregister service worker and clear cache? The app will reload.')) {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }

      window.location.reload();
      return;
    }
  }

  render(state, contentState);
  await save();
}

function updateSkillProgressBars() {
  document.querySelectorAll('[data-skill-card]').forEach((el) => {
    const skillId = el.dataset.skillCard;
    if (!skillId) return;

    const skill = Array.isArray(contentState.skillsIndex?.skills)
      ? contentState.skillsIndex.skills.find((entry) => entry === skillId || entry.id === skillId)
      : null;

    const resolvedSkillId = typeof skill === 'string' ? skill : skill?.id;
    if (!resolvedSkillId) return;

    const levelKey = resolvedSkillId === 'woodcutting'
      ? 'woodLevel'
      : resolvedSkillId === 'mining'
        ? 'mineLevel'
        : `${resolvedSkillId}Level`;

    const xpKey = resolvedSkillId === 'woodcutting'
      ? 'woodXp'
      : resolvedSkillId === 'mining'
        ? 'mineXp'
        : `${resolvedSkillId}Xp`;

    const level = state[levelKey] ?? 1;
    const xp = state[xpKey] ?? 0;
    const needed = xpForLevel(level);
    const pct = Math.max(0, Math.min(100, (xp / needed) * 100));

    const fill = el.querySelector('[data-skill-xp-fill]');
    const levelEl = el.querySelector('[data-skill-level]');
    const xpEl = el.querySelector('[data-skill-xp-text]');

    if (fill) fill.style.width = `${pct}%`;
    if (levelEl) levelEl.textContent = `${level}`;
    if (xpEl) xpEl.textContent = `${xp.toFixed(1)} / ${needed.toFixed(1)} XP`;
  });
}

function updateSkillDetail() {
  const detail = document.querySelector('[data-skill-detail-root]');
  if (!detail || !contentState.activeSkill) return;

  const skill = contentState.activeSkill;
  const level = getSkillLevel(skill);
  const xp = getSkillXp(skill);
  const needed = xpForLevel(level);
  const pct = Math.max(0, Math.min(100, (xp / needed) * 100));

  const title = detail.querySelector('[data-skill-detail-name]');
  const levelEl = detail.querySelector('[data-skill-detail-level]');
  const xpEl = detail.querySelector('[data-skill-detail-xp]');
  const fill = detail.querySelector('[data-skill-detail-fill]');
  const nodesRoot = detail.querySelector('[data-skill-nodes]');

  if (title) title.textContent = skill.name;
  if (levelEl) levelEl.textContent = `${level}`;
  if (xpEl) xpEl.textContent = `${xp.toFixed(1)} / ${needed.toFixed(1)} XP`;
  if (fill) fill.style.width = `${pct}%`;

  if (nodesRoot) {
    nodesRoot.innerHTML = (skill.nodes || []).map((node) => {
      const locked = level < node.levelRequired;
      const active =
        state.activity.kind === 'skilling' &&
        state.activity.skillId === skill.id &&
        state.activity.nodeId === node.id;

      return `
        <button
          class="pixel-card w-full text-left ${locked ? 'opacity-50' : ''} ${active ? 'border-cyan-500/50 bg-cyan-500/5' : ''}"
          data-skill-node="${node.id}"
          ${locked ? 'disabled' : ''}>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-lg font-black">${node.name}</div>
              <div class="text-sm text-zinc-400">+${node.xp} XP | ${node.durationMs}ms</div>
            </div>
            <div class="text-sm text-zinc-500">Lvl ${node.levelRequired}</div>
          </div>
        </button>
      `;
    }).join('');
  }
}

function updateMapScreen() {
  const root = document.querySelector('[data-zone-list]');
  if (!root || !Array.isArray(contentState.zonesIndex?.zones)) return;

  root.innerHTML = contentState.zonesIndex.zones.map((zone) => {
    const unlocked = state.combatLevel >= (zone.levelRequired ?? 1) || (zone.levelRequired ?? 1) <= 1;
    const current = state.ui.currentZoneId === zone.id;

    return `
      <button
        class="pixel-card w-full text-left ${current ? 'border-cyan-500/50 bg-cyan-500/5' : ''} ${!unlocked ? 'opacity-50' : ''}"
        data-zone-open="${zone.id}"
        ${!unlocked ? 'disabled' : ''}>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-black">${zone.name}</div>
            <div class="text-sm ${current ? 'text-cyan-400' : 'text-zinc-500'}">
              ${current ? 'Current Zone' : unlocked ? 'Travel Here' : 'Locked'}
            </div>
          </div>
          <div class="text-zinc-500">Lvl ${zone.levelRequired}+</div>
        </div>
      </button>
    `;
  }).join('');
}

function updateCombatZoneScreen() {
  const root = document.querySelector('[data-monster-list]');
  if (!root || !contentState.activeZone) return;

  root.innerHTML = (contentState.activeZone.monsters || []).map((monsterId) => {
    return `
      <button class="pixel-card w-full text-left" data-monster-open="${monsterId}">
        <div class="text-lg font-black capitalize">${monsterId.replaceAll('_', ' ')}</div>
      </button>
    `;
  }).join('');
}

function updateMonsterPanel() {
  const root = document.querySelector('[data-monster-panel]');
  if (!root || !contentState.activeMonster) return;

  const monster = contentState.activeMonster;
  const table = contentState.activeDropTable;

  root.innerHTML = `
    <div class="pixel-card space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-2xl font-black">${monster.name}</div>
          <div class="text-sm text-zinc-500">Lvl ${monster.level} | HP ${monster.hp} | ATK ${monster.attack}</div>
        </div>
        ${monster.boss ? '<div class="text-yellow-400 font-black uppercase">Boss</div>' : ''}
      </div>

      <div class="space-y-2">
        <div class="text-sm font-black uppercase tracking-[0.15em] text-zinc-500">Possible Drops</div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>Gold</span>
            <span>${table?.gold?.min ?? 0}-${table?.gold?.max ?? 0}</span>
          </div>
          ${(table?.drops || []).map((drop) => `
            <div class="flex items-center justify-between text-sm">
              <span>${drop.item}</span>
              <span>${(drop.chance * 100).toFixed(drop.chance < 0.01 ? 3 : 1)}%${drop.min ? ` (${drop.min}-${drop.max ?? drop.min})` : ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <button class="btn-primary w-full py-4 text-lg font-black" data-action="fightMonster">
        Fight ${monster.name}
      </button>
    </div>
  `;
}

function wireEvents() {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action], [data-tab], [data-zone-open], [data-monster-open], [data-skill-open], [data-skill-node]');
    if (!button) return;

    const action = button.dataset.action;
    const tab = button.dataset.tab;
    const zoneOpen = button.dataset.zoneOpen;
    const monsterOpen = button.dataset.monsterOpen;
    const skillOpen = button.dataset.skillOpen;
    const skillNode = button.dataset.skillNode;

    if (action === 'open-modal') {
      document.getElementById('modal-root')?.classList.remove('hidden');
      return;
    }

    if (action === 'close-modal') {
      document.getElementById('modal-root')?.classList.add('hidden');
      return;
    }

    if (action === 'fightMonster') {
      startMonsterFight();
      return;
    }

    if (action) {
      void act(action);
      return;
    }

    if (tab) {
      void openTab(tab, true);
      return;
    }

    if (zoneOpen) {
      void openZone(zoneOpen, true);
      return;
    }

    if (monsterOpen) {
      void openMonster(monsterOpen, true);
      return;
    }

    if (skillOpen) {
      void openSkill(skillOpen, true);
      return;
    }

    if (skillNode) {
      startSkillNode(skillNode);
    }
  });

  document.getElementById('modal-root')?.addEventListener('click', (event) => {
    if (event.target?.id === 'modal-root') {
      document.getElementById('modal-root')?.classList.add('hidden');
    }
  });

  document.body.addEventListener('htmx:afterSwap', () => {
    render(state, contentState);
    updateSkillProgressBars();
    updateSkillDetail();
    updateMapScreen();
    updateCombatZoneScreen();
    updateMonsterPanel();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void save(true);
    }
  });

  window.addEventListener('beforeunload', () => {
    void save(true);
  });
}

function startLoop() {
  lastTickAt = Date.now();

  setInterval(() => {
    const now = Date.now();
    const delta = now - lastTickAt;
    lastTickAt = now;

    const changed = processActivity(delta);
    if (changed) {
      markDirty();
    }

    render(state, contentState);
    updateSkillProgressBars();
    updateSkillDetail();
    updateMapScreen();
    updateCombatZoneScreen();
    updateMonsterPanel();
    void save();
  }, TICK_MS);
}

async function init() {
  await load();
  await loadInitialContent();
  await openTab(state.ui.tab || 'combat', false);

  const offlineReport = progressOffline();
  if (offlineReport) {
    markDirty();
  }

  wireEvents();
  initPwa();
  render(state, contentState);
  updateSkillProgressBars();
  updateSkillDetail();
  updateMapScreen();
  updateCombatZoneScreen();
  updateMonsterPanel();

  if (offlineReport) {
    showOfflineSummary(offlineReport);
  }

  await save(true);
  startLoop();
}

void init();
