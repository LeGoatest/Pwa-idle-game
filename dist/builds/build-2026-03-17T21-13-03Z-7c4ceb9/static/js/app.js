import {
  GAME_STATE_KEY,
  META_KEY,
  STORE_GAME,
  STORE_META,
  idbGet,
  idbSet
} from "./db.js";

let lastTickAt = 0;
let lastSaveAt = 0;
let dirty = false;

const SAVE_DEBOUNCE_MS = 5000;
const TICK_MS = 100;

window.GameAppRuntime = {
  state: null,
  meta: null,
  registry: null,
};

function nowMS() {
  return Date.now();
}

function markDirty() {
  dirty = true;
}

async function save(force = false) {
  const now = nowMS();
  if (!force && (!dirty || now - lastSaveAt < SAVE_DEBOUNCE_MS)) {
    return;
  }

  const result = window.GameWASM.exportSave();
  if (!result || !result.ok) return;

  const parsed = JSON.parse(result.save);
  parsed.updatedAt = now;

  await idbSet(STORE_GAME, GAME_STATE_KEY, parsed);
  lastSaveAt = now;
  dirty = false;
}

async function saveMeta() {
  if (!window.GameAppRuntime.meta) return;
  await idbSet(STORE_META, META_KEY, window.GameAppRuntime.meta);
}

function renderState(nextState) {
  window.GameAppRuntime.state = nextState;
  window.GameUIRender?.render(window.GameAppRuntime);
}

async function loadMeta() {
  const saved = await idbGet(STORE_META, META_KEY);
  window.GameAppRuntime.meta = saved || {
    installId: "",
    installedAt: 0,
    launchCount: 0,
    lastLaunchedAt: 0,
  };

  const meta = window.GameAppRuntime.meta;

  if (!meta.installId) {
    meta.installId = `install-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    meta.installedAt = nowMS();
  }

  meta.launchCount += 1;
  meta.lastLaunchedAt = nowMS();

  await saveMeta();
}

async function start() {
  const savedState = await idbGet(STORE_GAME, GAME_STATE_KEY);
  await loadMeta();

  const init = await window.GameWASM.init(savedState ? JSON.stringify(savedState) : "");
  if (!init || !init.ok) {
    throw new Error(init?.error || "failed to initialize wasm");
  }

  if (window.__GAME_WASM_REGISTRY__) {
    window.GameAppRuntime.registry = window.__GAME_WASM_REGISTRY__;
  }

  renderState(JSON.parse(init.state));
  markDirty();
  await save(true);

  startLoop();

  window.addEventListener("beforeunload", () => {
    void save(true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void save(true);
    }
  });
}

function startLoop() {
  lastTickAt = nowMS();

  setInterval(() => {
    const now = nowMS();
    const delta = now - lastTickAt;
    lastTickAt = now;

    const result = window.GameWASM.tick(delta);
    if (result && result.ok) {
      renderState(JSON.parse(result.state));
      if (result.changed) {
        markDirty();
      }
    }

    void save();
  }, TICK_MS);
}

async function dispatch(type, id = "") {
  const result = window.GameWASM.dispatch({ type, id });
  if (result && result.ok) {
    renderState(JSON.parse(result.state));
    markDirty();
    await save();
  }
  return result;
}

window.GameApp = {
  dispatch,
  saveNow: () => save(true),
};

window.addEventListener("DOMContentLoaded", () => {
  void start();
});
