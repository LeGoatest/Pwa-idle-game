const DB_NAME = 'idle-frontier-db';
const DB_VERSION = 1;
const STORE_GAME = 'game';
const STORE_META = 'meta';
const GAME_STATE_KEY = 'state';
const META_KEY = 'client';

const TICK_MS = 1000;
const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;

const defaultState = {
  version: 1,
  gold: 0,
  logs: 0,
  ore: 0,
  potions: 0,
  swords: 0,
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
  autoCombat: false,
  updatedAt: Date.now()
};

const defaultMeta = {
  installId: '',
  installedAt: 0,
  launchCount: 0,
  lastLaunchedAt: 0
};

let state = structuredClone(defaultState);
let meta = structuredClone(defaultMeta);
let installPrompt = null;
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_GAME)) db.createObjectStore(STORE_GAME);
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbGet(storeName, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(storeName, key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearDb() {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    if (db) db.close();
    dbPromise = null;
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB delete blocked'));
  });
}

function createInstallId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `install-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.4));
}

function gainXp(skill, amount) {
  const xpKey = `${skill}Xp`;
  const levelKey = `${skill}Level`;
  state[xpKey] += amount;
  while (state[xpKey] >= xpForLevel(state[levelKey])) {
    state[xpKey] -= xpForLevel(state[levelKey]);
    state[levelKey] += 1;
    if (skill === 'combat') state.attack += 1;
  }
}

function progressOffline() {
  const elapsed = Math.min(Date.now() - state.updatedAt, MAX_OFFLINE_MS);
  const ticks = Math.floor(elapsed / TICK_MS);
  if (ticks <= 0) return;
  if (state.autoCombat) {
    for (let i = 0; i < ticks; i += 1) combatTick();
  }
  state.logs += Math.floor(ticks * 0.2 * state.woodLevel);
  state.ore += Math.floor(ticks * 0.15 * state.mineLevel);
}

function combatTick() {
  state.enemyHp -= state.attack + state.swords;
  if (state.enemyHp <= 0) {
    state.kills += 1;
    state.gold += 5 + state.combatLevel;
    gainXp('combat', 6);
    state.enemyMaxHp = 10 + state.combatLevel * 3;
    state.enemyHp = state.enemyMaxHp;
  }
}

async function act(action) {
  if (action === 'combat') combatTick();
  if (action === 'toggleAutoCombat') state.autoCombat = !state.autoCombat;
  if (action === 'woodcutting') {
    state.logs += 1 + Math.floor(state.woodLevel / 5);
    gainXp('wood', 4);
  }
  if (action === 'mining') {
    state.ore += 1 + Math.floor(state.mineLevel / 6);
    gainXp('mine', 4);
  }
  if (action === 'craftSword') {
    if (state.logs >= 5 && state.ore >= 3) {
      state.logs -= 5;
      state.ore -= 3;
      state.swords += 1;
      state.attack += 1;
    }
  }
  if (action === 'save') await save();
  if (action === 'reset' && confirm('Reset all progress?')) {
    await clearDb();
    state = structuredClone(defaultState);
    meta = {
      ...structuredClone(defaultMeta),
      installId: createInstallId(),
      installedAt: Date.now(),
      launchCount: 1,
      lastLaunchedAt: Date.now()
    };
    await save();
    await saveMeta();
  }
  render();
}

async function save() {
  state.updatedAt = Date.now();
  await idbSet(STORE_GAME, GAME_STATE_KEY, state);
}

async function saveMeta() {
  await idbSet(STORE_META, META_KEY, meta);
}

async function load() {
  try {
    const savedState = await idbGet(STORE_GAME, GAME_STATE_KEY);
    state = savedState ? { ...structuredClone(defaultState), ...savedState } : structuredClone(defaultState);

    const savedMeta = await idbGet(STORE_META, META_KEY);
    meta = savedMeta ? { ...structuredClone(defaultMeta), ...savedMeta } : structuredClone(defaultMeta);
    if (!meta.installId) {
      meta.installId = createInstallId();
      meta.installedAt = Date.now();
    }
    meta.launchCount += 1;
    meta.lastLaunchedAt = Date.now();
    await saveMeta();
  } catch (error) {
    console.error('Failed to load IndexedDB state:', error);
    state = structuredClone(defaultState);
    meta = {
      ...structuredClone(defaultMeta),
      installId: createInstallId(),
      installedAt: Date.now(),
      launchCount: 1,
      lastLaunchedAt: Date.now()
    };
  }
}

function render() {
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    if (key === 'enemyHp') el.textContent = `${Math.max(0, state.enemyHp)} / ${state.enemyMaxHp}`;
    else if (key === 'autoCombat') el.textContent = state.autoCombat ? 'On' : 'Off';
    else el.textContent = state[key] ?? '0';
  });
  document.querySelectorAll('[data-bind-style="enemyHpPct"]').forEach((el) => {
    const pct = Math.max(0, Math.min(100, (state.enemyHp / state.enemyMaxHp) * 100));
    el.style.width = `${pct}%`;
  });
}

function wireEvents() {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    if (button.dataset.action === 'open-modal') {
      document.getElementById('modal-root').classList.remove('hidden');
    }
    if (button.dataset.action === 'close-modal') {
      document.getElementById('modal-root').classList.add('hidden');
    }

    void act(button.dataset.action);
  });

  // Close modal on background click
  document.getElementById('modal-root').addEventListener('click', (event) => {
    if (event.target.id === 'modal-root') {
      document.getElementById('modal-root').classList.add('hidden');
    }
  });

  document.body.addEventListener('htmx:afterSwap', () => {
    const install = document.getElementById('install-btn');
    if (install && installPrompt) install.classList.remove('hidden');
    render();
  });

  document.querySelector('footer nav').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-title]');
    if (!btn) return;

    // Update dynamic title
    const titleEl = document.getElementById('station-title');
    if (titleEl) titleEl.textContent = btn.dataset.title;

    // Update active state in dock
    document.querySelectorAll('footer nav button').forEach(b => {
      b.classList.remove('text-cyan-400');
      b.classList.add('text-zinc-400');
      b.removeAttribute('aria-selected');
    });
    btn.classList.add('text-cyan-400');
    btn.classList.remove('text-zinc-400');
    btn.setAttribute('aria-selected', 'true');
  });
}

function initPwa() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./assets/js/sw.js', { scope: '/' });
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.classList.remove('hidden');
  });

  document.body.addEventListener('click', async (event) => {
    if (event.target.id !== 'install-btn' || !installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    event.target.classList.add('hidden');
  });
}

async function init() {
  await load();
  progressOffline();
  wireEvents();
  initPwa();
  render();
  await save();
  setInterval(() => {
    if (state.autoCombat) combatTick();
    void save();
    render();
  }, TICK_MS);
}

void init();
