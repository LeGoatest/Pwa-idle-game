(function () {
  let lastTick = 0;
  let started = false;

  function renderState(state) {
    const root = document.getElementById("app-state");
    if (!root) return;
    root.textContent = JSON.stringify(state, null, 2);
  }

  function persistSave() {
    const result = window.GameWASM.exportSave();
    if (result && result.ok && result.save) {
      try {
        localStorage.setItem("game-save-json", result.save);
      } catch (_) {}
    }
  }

  function frame(now) {
    if (!started) return;

    if (!lastTick) lastTick = now;
    const delta = Math.floor(now - lastTick);
    lastTick = now;

    const result = window.GameWASM.tick(delta);
    if (result && result.ok) {
      try {
        renderState(JSON.parse(result.state));
      } catch (_) {}
    }

    requestAnimationFrame(frame);
  }

  async function start() {
    if (started) return;

    const init = await window.GameWASM.init();
    if (!init || !init.ok) {
      throw new Error(init?.error || "failed to initialize engine");
    }

    try {
      renderState(JSON.parse(init.state));
    } catch (_) {}

    started = true;
    requestAnimationFrame(frame);

    setInterval(persistSave, 5000);
    window.addEventListener("beforeunload", persistSave);
  }

  async function dispatch(type, id = "") {
    const result = window.GameWASM.dispatch({ type, id });
    if (result && result.ok) {
      try {
        renderState(JSON.parse(result.state));
      } catch (_) {}
    }
    persistSave();
    return result;
  }

  window.GameEngine = {
    start,
    dispatch,
    saveNow: persistSave,
  };

  window.addEventListener("DOMContentLoaded", () => {
    void start();
  });
})();
