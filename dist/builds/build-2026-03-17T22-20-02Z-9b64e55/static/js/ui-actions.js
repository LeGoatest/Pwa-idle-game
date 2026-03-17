function getRuntime() {
  return window.GameAppRuntime || null;
}

async function dispatchAction(type, id = "") {
  if (!window.GameApp?.dispatch) return;
  await window.GameApp.dispatch(type, id);
}

document.addEventListener("click", async (event) => {
  const zoneButton = event.target.closest("[data-zone-id]");
  if (zoneButton) {
    await dispatchAction("open_zone", zoneButton.dataset.zoneId || "");
    return;
  }

  const monsterButton = event.target.closest("[data-monster-id]");
  if (monsterButton) {
    await dispatchAction("select_monster", monsterButton.dataset.monsterId || "");
    return;
  }

  const skillButton = event.target.closest("[data-skill-id]:not([data-node-id])");
  if (skillButton) {
    await dispatchAction("select_skill", skillButton.dataset.skillId || "");
    return;
  }

  const nodeButton = event.target.closest("[data-node-id]");
  if (nodeButton) {
    const skillId = nodeButton.dataset.skillId || "";
    const nodeId = nodeButton.dataset.nodeId || "";

    if (skillId) {
      await dispatchAction("select_skill", skillId);
    }

    await dispatchAction("start_node", nodeId);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;

  if (action === "start_current_combat") {
    const runtime = getRuntime();
    const monsterId = runtime?.state?.ui?.currentMonsterId || "";
    if (monsterId) {
      await dispatchAction("start_combat", monsterId);
    }
    return;
  }

  if (action === "stop_activity") {
    await dispatchAction("stop_activity");
    return;
  }

  if (action === "save_now") {
    await window.GameApp?.saveNow?.();
  }
});
