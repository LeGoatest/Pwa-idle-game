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

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action || "";
  const id = actionButton.dataset.id || "";

  if (action === "start_current_combat") {
    const monsterId = window.GameAppRuntime?.state?.ui?.currentMonsterId || "";
    if (monsterId) {
      await dispatchAction("start_combat", monsterId);
    }
    return;
  }

  if (action === "save_now") {
    await window.GameApp?.saveNow?.();
    return;
  }

  if (action) {
    await dispatchAction(action, id);

    if (action === "start_combat" || action === "select_monster") {
      setMobileTab("combat");
    } else if (action === "start_node" || action === "select_skill" || action === "open_zone") {
      setMobileTab("combat");
    } else if (action === "buy_item" || action === "equip_item" || action === "use_item") {
      setMobileTab("inventory");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  setMobileTab("combat");
});
