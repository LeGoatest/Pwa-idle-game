import {
  GAME_STATE_KEY,
  META_KEY,
  STORE_GAME,
  STORE_META,
  clearDb,
  idbGet,
  idbSet
} from './db.js';
import { TASKS_CONFIG } from './content.js';
import {
  MAX_OFFLINE_MS,
  SAVE_DEBOUNCE_MS,
  TICK_MS,
  cloneDefaultMeta,
  cloneDefaultState,
  createInstallId
} from './state.js';
import { initPwa } from './pwa.js';
import { processTask, progressOffline, setActiveTask } from './systems/tasks.js';
import { render, showOfflineSummary, showToast } from './ui.js';

let state = cloneDefaultState();
let meta = cloneDefaultMeta();

let lastTickAt = Date.now();
let lastSaveAt = 0;
let dirty = false;

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
      ? { ...cloneDefaultState(), ...savedState }
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

async function resetGame() {
  await clearDb();

  state = cloneDefaultState();
  meta = cloneDefaultMeta();
  meta.installId = createInstallId();
  meta.installedAt = Date.now();
  meta.launchCount = 1;
  meta.lastLaunchedAt = Date.now();

  markDirty();
  await save(true);
  await saveMeta();
  render(state);
}

async function act(action) {
  if (TASKS_CONFIG[action]) {
    const transition = setActiveTask(state, action);

    if (transition.started) {
      showToast(
        `${TASKS_CONFIG[transition.stopped]?.name || 'Nothing'} stopped`,
        `${TASKS_CONFIG[transition.started].name} started`
      );

      const launcher = document.getElementById('skills-launcher');
      if (launcher) launcher.classList.add('hidden');

      const station = TASKS_CONFIG[transition.started].station;
      if (typeof htmx !== 'undefined') {
        htmx.ajax('GET', station, {
          target: '#view-root',
          swap: 'innerHTML show:top'
        });
      }
    } else if (transition.stopped) {
      showToast(`${TASKS_CONFIG[transition.stopped]?.name || action} stopped`, 'Activity paused');
    }

    markDirty();
    render(state);
    await save();
    return;
  }

  if (action === 'craftSword') {
    if (state.logs >= 5 && state.ore >= 3) {
      state.logs -= 5;
      state.ore -= 3;
      state.swords += 1;
      state.attack += 1;
      markDirty();
    }
  }

  if (action === 'save') {
    await save(true);
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

  render(state);
  await save();
}

function wireEvents() {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    if (button.dataset.action === 'open-modal') {
      document.getElementById('modal-root')?.classList.remove('hidden');
    }

    if (button.dataset.action === 'close-modal') {
      document.getElementById('modal-root')?.classList.add('hidden');
    }

    if (button.dataset.action === 'toggle-launcher') {
      document.getElementById('skills-launcher')?.classList.toggle('hidden');
      return;
    }

    const launcher = document.getElementById('skills-launcher');
    if (launcher && !launcher.contains(event.target) && !button.closest('#skills-btn')) {
      launcher.classList.add('hidden');
    }

    void act(button.dataset.action);
  });

  document.getElementById('modal-root')?.addEventListener('click', (event) => {
    if (event.target?.id === 'modal-root') {
      document.getElementById('modal-root')?.classList.add('hidden');
    }
  });

  document.body.addEventListener('htmx:afterSwap', (event) => {
    const install = document.getElementById('install-btn');
    if (install) install.classList.remove('hidden');

    const view = event.detail.elt.querySelector('section')?.dataset.view;
    if (view) {
      const titleEl = document.getElementById('station-title');
      if (titleEl) titleEl.textContent = view.charAt(0).toUpperCase() + view.slice(1);
    }

    render(state);
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

    const changed = processTask(state, delta);
    if (changed) {
      markDirty();
    }

    render(state);
    void save();
  }, TICK_MS);
}

async function init() {
  await load();

  const offlineReport = progressOffline(state, MAX_OFFLINE_MS);
  if (offlineReport) {
    markDirty();
  }

  wireEvents();
  initPwa();
  render(state);

  if (offlineReport) {
    showOfflineSummary(offlineReport);
  }

  await save(true);
  startLoop();
}

void init();
