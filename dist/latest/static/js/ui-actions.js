async function dispatchAction(type, id = "") {
  if (!window.GameApp?.dispatch) return;
  await window.GameApp.dispatch(type, id);
}

function setMobileTab(tab) {
  const panels = document.querySelectorAll("[data-tab-panel]");
  panels.forEach((panel) => {
    if (panel.dataset.tabPanel === tab) {
      panel.classList.remove("hidden");
    } else {
      panel.classList.add("hidden");
    }
  });

  const buttons = document.querySelectorAll(".tab-nav-btn");
  buttons.forEach((button) => {
    if (button.dataset.tabOpen === tab) {
      button.classList.remove("text-zinc-400");
      button.classList.add("text-cyan-400");
    } else {
      button.classList.remove("text-cyan-400");
      button.classList.add("text-zinc-400");
    }
  });

  window.GameAppRuntime = window.GameAppRuntime || {};
  window.GameAppRuntime.mobileTab = tab;
}

document.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-tab-open]");
  if (tabButton) {
    setMobileTab(tabButton.dataset.tabOpen || "combat");
    return;
  }

  const zoneButton = event.target.closest("[data-zone-id]");
  if (zoneButton) {
    await dispatchAction("open_zone", zoneButton.dataset.zoneId || "");
    return;
  }

  const monsterButton = event.target.closest("[data-monster-id]");
  if (monsterButton) {
    const id = monsterButton.dataset.monsterId || "";
    await dispatchAction("select_monster", id);
    await dispatchAction("start_combat", id);
    setMobileTab("combat");
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
    setMobileTab("gather");
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;

  if (action === "start_current_combat") {
    const monsterId = window.GameAppRuntime?.state?.ui?.currentMonsterId || "";
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

document.addEventListener("DOMContentLoaded", () => {
  setMobileTab("combat");
});
