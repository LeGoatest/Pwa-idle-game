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
  loadRegistryData,
  loadZone,
  loadMonster,
  loadDropTable,
  loadSkill,
  loadShopItem
} from './content_loader.js';
import { loadItemRegistry, getItem } from './item_registry.js';
import { gainXp } from './systems/progression.js';

let state = cloneDefaultState();
let meta = cloneDefaultMeta();

let lastTickAt = Date.now();
let lastSaveAt = 0;
let dirty = false;

const contentState = {
  registry: null,
  zonesIndex: null,
  activeZone: null,
  activeMonster: null,
  activeDropTable: null,
  skillsIndex: null,
  activeSkill: null,
  shopIndex: null,
  shopItems: []
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

  merged.inventory = {
    ...(base.inventory || {}),
    ...(saved.inventory || {})
  };

  merged.equipment = {
    ...(base.equipment || {}),
    ...(saved.equipment || {})
  };

  return merged;
}

async function load() {
  try {
    const savedState = await idbGet(STORE_GAME, GAME_STATE_KEY);
    state = savedState ? mergeState(cloneDefaultState(), savedState) : cloneDefaultState();

    const savedMeta = await idbGet(STORE_META, META_KEY);
    meta = savedMeta ? { ...cloneDefaultMeta(), ...savedMeta } : cloneDefaultMeta();

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

async function resetGame() {
  await clearDb();

  state = cloneDefaultState();
  meta = cloneDefaultMeta();
  meta.installId = createInstallId();
  meta.installedAt = Date.now();
  meta.launchCount = 1;
  meta.lastLaunchedAt = Date.now();

  contentState.registry = null;
  contentState.zonesIndex = null;
  contentState.activeZone = null;
  contentState.activeMonster = null;
  contentState.activeDropTable = null;
  contentState.skillsIndex = null;
  contentState.activeSkill = null;
  contentState.shopIndex = null;
  contentState.shopItems = [];

  markDirty();
  await save(true);
  await saveMeta();
  render(state, contentState);
}

function ensureInventoryItem(itemKey, amount) {
  if (!state.inventory) state.inventory = {};
  state.inventory[itemKey] = (state.inventory[itemKey] || 0) + amount;
}

function removeInventoryItem(itemKey, amount = 1) {
  if (!state.inventory?.[itemKey]) return false;

  state.inventory[itemKey] -= amount;
  if (state.inventory[itemKey] <= 0) {
    delete state.inventory[itemKey];
  }
  return true;
}

function getSkillMeta(skillId) {
  if (skillId === 'woodcutting') return { short: 'wood', levelKey: 'woodLevel', xpKey: 'woodXp' };
  if (skillId === 'mining') return { short: 'mine', levelKey: 'mineLevel', xpKey: 'mineXp' };
  if (skillId === 'combat') return { short: 'combat', levelKey: 'combatLevel', xpKey: 'combatXp' };
  return {
    short: skillId,
    levelKey: `${skillId}Level`,
    xpKey: `${skillId}Xp`
  };
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

function setActivity(payload) {
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

function equipByItemId(itemId) {
  const item = getItem(itemId);
  if (!item?.equipSlot) return false;
  if (!state.inventory?.[itemId]) return false;

  if (!state.equipment) state.equipment = {};

  const previous = state.equipment[item.equipSlot];
  if (previous === itemId) return true;

  if (previous) {
    ensureInventoryItem(previous, 1);
  }

  removeInventoryItem(itemId, 1);
  state.equipment[item.equipSlot] = itemId;
  markDirty();
  return true;
}

function rollRange(min = 1, max = 1) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDrops(dropTable) {
  if (!dropTable?.drops) return [];

  const results = [];

  for (const entry of dropTable.drops) {
    if (Math.random() < entry.chance) {
      results.push({
        item: entry.item,
        amount: rollRange(entry.min ?? 1, entry.max ?? 1)
      });
    }
  }

  return results;
}

function getActiveSkillNode() {
  if (!contentState.activeSkill || !state.activity?.nodeId) return null;
  return contentState.activeSkill.nodes?.find((node) => node.id === state.activity.nodeId) || null;
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

    if (yieldItem) {
      ensureInventoryItem(yieldItem, yieldAmount);

      if (yieldItem === 'logs') state.logs += yieldAmount;
      if (yieldItem === 'ore') state.ore += yieldAmount;
      if (yieldItem === 'gold') state.gold += yieldAmount;
    }

    const meta = getSkillMeta(contentState.activeSkill.id);
    gainXp(state, meta.short, node.xp);
    changed = true;
  }

  return changed;
}

function processCombat(deltaMs) {
  if (!contentState.activeMonster) return false;

  state.activity.progress += deltaMs;
  state.activity.lastProcessedAt = Date.now();

  const duration = contentState.activeMonster.durationMs || 2000;
  let changed = false;

  while (state.activity.progress >= duration) {
    state.activity.progress -= duration;

    const damage = Math.max(1, (state.attack || 0) + (state.swords || 0));
    state.enemyHp -= damage;

    if (state.enemyHp <= 0) {
      state.kills += 1;

      const rewards = contentState.activeMonster.rewards || {};
      const goldMin = rewards.goldMin ?? contentState.activeDropTable?.gold?.min ?? 0;
      const goldMax = rewards.goldMax ?? contentState.activeDropTable?.gold?.max ?? goldMin;

      state.gold += rollRange(goldMin, goldMax);

      if (rewards.combatXp) {
        gainXp(state, 'combat', rewards.combatXp);
      }

      const drops = rollDrops(contentState.activeDropTable);
      for (const drop of drops) {
        ensureInventoryItem(drop.item, drop.amount);
      }

      state.enemyMaxHp = contentState.activeMonster.hp || 12;
      state.enemyHp = state.enemyMaxHp;
    }

    changed = true;
  }

  return changed;
}

function processActivity(deltaMs) {
  if (state.activity?.kind === 'none') return false;
  if (state.activity?.kind === 'skilling') return processSkilling(deltaMs);
  if (state.activity?.kind === 'combat') return processCombat(deltaMs);
  return false;
}

function progressOffline() {
  const now = Date.now();
  const elapsed = Math.min(now - state.updatedAt, MAX_OFFLINE_MS);

  if (elapsed <= 1000) return null;

  const start = {
    gold: state.gold,
    logs: state.logs,
    ore: state.ore,
    kills: state.kills
  };

  processActivity(elapsed);

  const report = {
    elapsed,
    gold: state.gold - start.gold,
    logs: state.logs - start.logs,
    ore: state.ore - start.ore,
    kills: state.kills - start.kills
  };

  return report.gold || report.logs || report.ore || report.kills ? report : null;
}

async function loadInitialContent() {
  contentState.registry = await loadRegistryData();
  contentState.zonesIndex = contentState.registry.zonesIndex;
  contentState.skillsIndex = contentState.registry.skillsIndex;
  contentState.shopIndex = contentState.registry.shopIndex;
  contentState.shopItems = contentState.registry.shopItemsList || [];

  await loadItemRegistry();

  if (state.ui?.currentZoneId) {
    await openZone(state.ui.currentZoneId, false);
  }

  if (state.ui?.currentMonsterId) {
    await openMonster(state.ui.currentMonsterId, false);
  }

  if (state.ui?.currentSkillId) {
    await openSkill(state.ui.currentSkillId, false);
  }
}

async function openTab(tab, persist = true) {
  if (persist) setCurrentTab(tab);

  const routeMap = {
    combat: './views/combat.html',
    map: './views/map.html',
    skills: './views/skills.html',
    equipment: './views/equipment.html',
    items: './views/inventory.html',
    shop: './views/shop.html'
  };

  const route = routeMap[tab] || './views/combat.html';

  if (typeof htmx !== 'undefined') {
    await htmx.ajax('GET', route, {
      target: '#view-root',
      swap: 'innerHTML show:top'
    });
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
  state.enemyHp = state.enemyMaxHp;

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

  const meta = getSkillMeta(contentState.activeSkill.id);
  const currentLevel = state[meta.levelKey] ?? 1;

  if (currentLevel < node.levelRequired) {
    showToast('Locked', `${node.name} requires level ${node.levelRequired}`);
    return;
  }

  setActivity({
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

  setActivity({
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

async function buyItem(itemId) {
  const item = contentState.shopItems.find((entry) => entry.id === itemId)
    || await loadShopItem(itemId).catch(() => null);

  if (!item) {
    showToast('Shop', 'Item not found');
    return;
  }

  if ((state.gold ?? 0) < item.price) {
    showToast('Shop', 'Not enough gold');
    return;
  }

  state.gold -= item.price;

  if (item.effect?.type === 'stat' && item.effect.stat) {
    state[item.effect.stat] = (state[item.effect.stat] ?? 0) + (item.effect.value ?? 0);
  } else if (item.effect?.type === 'heal') {
    state.hp = Math.min((state.hp ?? 0) + (item.effect.value ?? 0), 999999);
  } else if (item.effect?.type === 'item') {
    ensureInventoryItem(item.effect.itemKey, item.effect.amount ?? 1);
  }

  if (item.id === 'sword') {
    state.swords += 1;
  }

  if (item.id === 'potion') {
    state.potions += 1;
    ensureInventoryItem('potion', 1);
  }

  markDirty();
  showToast('Shop', `${item.name} purchased`);
  render(state, contentState);
  await save();
}

async function act(action, button = null) {
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

  if (action === 'fightMonster') {
    startMonsterFight();
    return;
  }

  if (action === 'buyItem') {
    const itemId = button?.dataset.itemId;
    if (itemId) {
      await buyItem(itemId);
    }
    return;
  }

  if (action === 'equipItem') {
    const itemId = button?.dataset.itemId;
    if (itemId) {
      if (equipByItemId(itemId)) {
        showToast('Equipment', `${getItem(itemId)?.name || itemId} equipped`);
        render(state, contentState);
        await save();
      } else {
        showToast('Equipment', 'Cannot equip that item');
      }
    }
    return;
  }

  if (action === 'reset' && confirm('Reset all progress?')) {
    await resetGame();
    return;
  }

  if (action === 'forceUpdate') {
    if (confirm('Unregister service worker and clear cache? The app will reload.')) {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
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

function renderShop() {
  const root = document.querySelector('[data-shop-list]');
  if (!root) return;

  root.innerHTML = (contentState.shopItems || []).map((item) => `
    <div class="pixel-card flex items-center justify-between gap-4">
      <div>
        <div class="font-black">${item.name}</div>
        <div class="text-sm text-zinc-500">${item.description}</div>
      </div>

      <button
        class="btn-primary"
        data-action="buyItem"
        data-item-id="${item.id}">
        Buy (${item.price})
      </button>
    </div>
  `).join('');
}

function wireEvents() {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action], [data-tab], [data-nav-tab], [data-zone-open], [data-monster-open], [data-skill-open], [data-skill-node]');
    if (!button) return;

    const action = button.dataset.action;
    const tab = button.dataset.tab || button.dataset.navTab;
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

    if (action) {
      void act(action, button);
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
    renderShop();
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
    renderShop();
    void save();
  }, TICK_MS);
}

async function init() {
  await load();
  await loadInitialContent();
  await openTab(state.ui?.tab || 'combat', false);

  const offlineReport = progressOffline();
  if (offlineReport) {
    markDirty();
  }

  wireEvents();
  initPwa();
  render(state, contentState);
  renderShop();

  if (offlineReport) {
    showOfflineSummary(offlineReport);
  }

  await save(true);
  startLoop();
}

void init();
