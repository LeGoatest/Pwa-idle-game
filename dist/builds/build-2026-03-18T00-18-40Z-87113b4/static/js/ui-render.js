function byId(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pct(value, max) {
  if (!max || max <= 0) return "0%";
  const n = Math.max(0, Math.min(100, (value / max) * 100));
  return `${n.toFixed(2)}%`;
}

function renderInventory(state) {
  const root = byId("inventory-list");
  if (!root) return;

  const inventory = state.inventory || {};
  const entries = Object.entries(inventory).sort((a, b) => a[0].localeCompare(b[0]));

  if (entries.length === 0) {
    root.innerHTML = `
      <div class="ui-grid-item-slot"></div>
      <div class="ui-grid-item-slot"></div>
      <div class="ui-grid-item-slot"></div>
      <div class="ui-grid-item-slot"></div>
      <div class="ui-grid-item-slot"></div>
    `;
    return;
  }

  root.innerHTML = entries.map(([itemId, amount]) => `
    <div class="ui-grid-item-slot active">
      <div class="text-center">
        <div class="text-xs font-medium leading-tight">${esc(itemId)}</div>
        <div class="mt-1 text-[11px] text-zinc-400">x${esc(amount)}</div>
      </div>
    </div>
  `).join("");
}

function renderStateBits(state) {
  if (byId("topbar-gold")) byId("topbar-gold").textContent = String(state.gold ?? 0);
  if (byId("enemy-hp-mobile")) byId("enemy-hp-mobile").textContent = `${state.enemyHp ?? 0} / ${state.enemyMaxHp ?? 0}`;
  if (byId("activity-progress-mobile")) byId("activity-progress-mobile").textContent = String(Math.floor(state.activity?.progress || 0));

  const enemyFill = byId("enemy-hp-fill-mobile");
  if (enemyFill) enemyFill.style.width = pct(state.enemyHp ?? 0, state.enemyMaxHp ?? 0);

  const progressFill = byId("activity-progress-fill-mobile");
  if (progressFill) {
    const raw = Math.max(0, Math.min(100, state.activity?.progress ?? 0));
    progressFill.style.width = `${raw.toFixed(2)}%`;
  }
}

function render(runtime) {
  if (!runtime?.state) return;
  renderStateBits(runtime.state);
  renderInventory(runtime.state);
}

window.GameUIRender = { render };
