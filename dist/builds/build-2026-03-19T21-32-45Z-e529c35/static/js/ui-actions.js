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
    const target = button.dataset.tabOpen || "";
    if (target === tab) {
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

function openModal(name) {
  if (name === "settings") {
    document.getElementById("settings-modal")?.classList.remove("hidden");
  }
}

function closeModal(name) {
  if (name === "settings") {
    document.getElementById("settings-modal")?.classList.add("hidden");
  }
}

document.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-tab-open]");
  if (tabButton) {
    setMobileTab(tabButton.dataset.tabOpen || "combat");
    return;
  }

  const openModalButton = event.target.closest("[data-open-modal]");
  if (openModalButton) {
    openModal(openModalButton.dataset.openModal || "");
    return;
  }

  const closeButton = event.target.closest("[data-close-modal]");
  if (closeButton) {
    closeModal(closeButton.dataset.closeModal || "");
    return;
  }

  const backdrop = event.target.closest(".modal-backdrop");
  if (backdrop && event.target === backdrop) {
    backdrop.classList.add("hidden");
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
      setMobileTab("gather");
    } else if (action === "buy_item" || action === "equip_item" || action === "use_item") {
      setMobileTab("inventory");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  setMobileTab("combat");
});
