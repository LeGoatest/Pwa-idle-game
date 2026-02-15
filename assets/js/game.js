const DB_NAME = 'idle-frontier-db';
const DB_VERSION = 1;
const STORE_GAME = 'game';
const STORE_META = 'meta';
const GAME_STATE_KEY = 'state';
const META_KEY = 'client';

const TICK_MS = 1000;
const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;

const defaultState = {
  version: 2,
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
  activeTask: {
    kind: 'none',
    startedAt: 0,
    lastProcessedAt: 0,
    progress: 0
  },
  updatedAt: Date.now()
};

const TASKS_CONFIG = {
  combat: {
    name: 'Hunt',
    baseDuration: 2000,
    station: './views/combat.html',
    onComplete: () => {
      state.enemyHp -= state.attack + state.swords;
      if (state.enemyHp <= 0) {
        state.kills += 1;
        state.gold += 5 + state.combatLevel;
        gainXp('combat', 6);
        state.enemyMaxHp = 10 + state.combatLevel * 3;
        state.enemyHp = state.enemyMaxHp;
      }
    }
  },
  woodcutting: {
    name: 'Woodcutting',
    baseDuration: 3000,
    station: './views/gathering.html',
    onComplete: () => {
      state.logs += 1 + Math.floor(state.woodLevel / 5);
      gainXp('wood', 4);
    }
  },
  mining: {
    name: 'Mining',
    baseDuration: 4000,
    station: './views/gathering.html',
    onComplete: () => {
      state.ore += 1 + Math.floor(state.mineLevel / 6);
      gainXp('mine', 4);
    }
  }
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

function getCycleDuration(kind) {
  const config = TASKS_CONFIG[kind];
  if (!config) return 1000;
  // Modifiers can be added here
  return config.baseDuration;
}

function processTask(deltaMs) {
  if (state.activeTask.kind === 'none') return;

  const kind = state.activeTask.kind;
  const config = TASKS_CONFIG[kind];
  if (!config) return;

  const duration = getCycleDuration(kind);
  state.activeTask.progress += deltaMs;
  state.activeTask.lastProcessedAt = Date.now();

  while (state.activeTask.progress >= duration) {
    state.activeTask.progress -= duration;
    config.onComplete();
  }
}

function progressOffline() {
  const now = Date.now();
  const elapsed = Math.min(now - state.updatedAt, MAX_OFFLINE_MS);
  if (elapsed <= 0) return;
  processTask(elapsed);
}

function showToast(title, body) {
  const existing = document.getElementById('game-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'game-toast';
  toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xs bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300';
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
        <span class="icon-[lucide--info] text-cyan-400"></span>
      </div>
      <div>
        <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500">${title}</div>
        <div class="text-xs font-bold text-zinc-200">${body}</div>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function setActiveTask(kind) {
  const oldKind = state.activeTask.kind;

  if (oldKind === kind) {
    state.activeTask.kind = 'none';
    showToast(`${TASKS_CONFIG[kind]?.name || kind} stopped`, 'Activity paused');
  } else {
    state.activeTask.kind = kind;
    state.activeTask.startedAt = Date.now();
    state.activeTask.lastProcessedAt = Date.now();
    state.activeTask.progress = 0;

    const config = TASKS_CONFIG[kind];
    if (config) {
      showToast(`${TASKS_CONFIG[oldKind]?.name || 'Nothing'} stopped`, `${config.name} started`);
      // Close launcher if it's open (it will be handled by the click listener usually, but just in case)
      const launcher = document.getElementById('skills-launcher');
      if (launcher) launcher.classList.add('hidden');

      // Navigate to station
      if (typeof htmx !== 'undefined') {
        htmx.ajax('GET', config.station, { target: '#view-root', swap: 'innerHTML show:top' });
      }
    }
  }

  render();
  await save();
}

async function act(action) {
  if (TASKS_CONFIG[action]) {
    await setActiveTask(action);
    return;
  }

  if (action === 'craftSword') {
    if (state.logs >= 5 && state.ore >= 3) {
      state.logs -= 5;
      state.ore -= 3;
      state.swords += 1;
      state.attack += 1;
    }
  }
  if (action === 'forceUpdate') {
    if (confirm('Unregister service worker and clear cache? The app will reload.')) {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (let key of keys) {
          await caches.delete(key);
        }
      }
      window.location.reload(true);
      return;
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
    else if (key === 'activeTaskName') el.textContent = TASKS_CONFIG[state.activeTask.kind]?.name || 'Idle';
    else el.textContent = state[key] ?? '0';
  });

  document.querySelectorAll('[data-bind-class]').forEach((el) => {
    const expr = el.dataset.bindClass;
    // Simple expression evaluator for specific cases
    if (expr === "activeTask.kind !== 'none' ? '' : 'hidden'") {
      if (state.activeTask.kind !== 'none') el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  document.querySelectorAll('[data-bind-style="enemyHpPct"]').forEach((el) => {
    const pct = Math.max(0, Math.min(100, (state.enemyHp / state.enemyMaxHp) * 100));
    el.style.width = `${pct}%`;
  });

  // Render progress bar for active task
  const currentKind = state.activeTask.kind;
  document.querySelectorAll('[data-task-bar]').forEach(el => {
     const taskKind = el.dataset.taskBar;
     if (taskKind === currentKind) {
        const duration = getCycleDuration(currentKind);
        const pct = Math.min(100, (state.activeTask.progress / duration) * 100);
        el.style.width = `${pct}%`;
        el.parentElement.classList.remove('opacity-0');
     } else {
        el.style.width = '0%';
        el.parentElement.classList.add('opacity-0');
     }
  });

  // Update Start/Pause buttons
  document.querySelectorAll('[data-action]').forEach(btn => {
    const action = btn.dataset.action;
    if (TASKS_CONFIG[action]) {
       const icon = btn.querySelector('.icon-contract');
       if (icon) {
         if (state.activeTask.kind === action) {
           icon.classList.remove('icon-[game-icons--play-button]');
           icon.classList.add('icon-[game-icons--pause-button]');
         } else {
           icon.classList.remove('icon-[game-icons--pause-button]');
           icon.classList.add('icon-[game-icons--play-button]');
         }
       }
    }
  });

  // Highlight active skill in launcher
  document.querySelectorAll('#skills-launcher [data-action]').forEach(btn => {
    const action = btn.dataset.action;
    if (action === state.activeTask.kind) {
      btn.classList.add('border-cyan-500/50', 'bg-cyan-500/10');
      btn.querySelector('span')?.classList.add('text-cyan-400');
    } else {
      btn.classList.remove('border-cyan-500/50', 'bg-cyan-500/10');
      btn.querySelector('span')?.classList.remove('text-cyan-400');
    }
  });

  // Dock highlight
  const activeStation = document.querySelector('#view-root section')?.dataset.view;
  document.querySelectorAll('footer nav button').forEach(btn => {
     const hxGet = btn.getAttribute('hx-get');
     if (hxGet && hxGet.includes(activeStation)) {
        btn.classList.add('text-cyan-400');
        btn.classList.remove('text-zinc-400');
        btn.setAttribute('aria-selected', 'true');
     } else {
        // Special case for Skills launcher
        if (btn.id === 'skills-btn' && (state.activeTask.kind === 'woodcutting' || state.activeTask.kind === 'mining')) {
           // btn.classList.add('text-cyan-400'); // Maybe?
        }
     }
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

    // Skills Launcher toggle
    if (button.dataset.action === 'toggle-launcher') {
       const launcher = document.getElementById('skills-launcher');
       launcher.classList.toggle('hidden');
    } else {
       // Close launcher when clicking anything else
       const launcher = document.getElementById('skills-launcher');
       if (launcher && !launcher.contains(event.target) && !button.closest('#skills-btn')) {
          launcher.classList.add('hidden');
       }
    }

    void act(button.dataset.action);
  });

  // Close modal on background click
  document.getElementById('modal-root').addEventListener('click', (event) => {
    if (event.target.id === 'modal-root') {
      document.getElementById('modal-root').classList.add('hidden');
    }
  });

  document.body.addEventListener('htmx:afterSwap', (event) => {
    const install = document.getElementById('install-btn');
    if (install && installPrompt) install.classList.remove('hidden');

    // Update title based on newly swapped content
    const view = event.detail.elt.querySelector('section')?.dataset.view;
    if (view) {
       const titleEl = document.getElementById('station-title');
       if (titleEl) {
          titleEl.textContent = view.charAt(0).toUpperCase() + view.slice(1);
       }

       // Highlight dock
       document.querySelectorAll('footer nav button').forEach(btn => {
         const hxGet = btn.getAttribute('hx-get');
         if (hxGet && hxGet.includes(view)) {
            btn.classList.add('text-cyan-400');
            btn.classList.remove('text-zinc-400');
            btn.setAttribute('aria-selected', 'true');
         } else {
            btn.classList.remove('text-cyan-400');
            btn.classList.add('text-zinc-400');
            btn.removeAttribute('aria-selected');
         }
       });
    }

    render();
  });
}

function initPwa() {
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

  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;

    processTask(delta);
    void save();
    render();
  }, 100); // 10fps for smooth bars
}

void init();
