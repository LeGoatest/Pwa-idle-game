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

function renderInventory(state) {
  const root = byId("inventory-list");
  if (!root) return;

  const inventory = state.inventory || {};
  const entries = Object.entries(inventory).sort((a, b) => a[0].localeCompare(b[0]));

  if (entries.length === 0) {
    root.innerHTML = `<div class="text-sm text-zinc-500">Inventory is empty.</div>`;
    return;
  }

  root.innerHTML = entries.map(([itemId, amount]) => `
    <div class="rounded border border-zinc-800 bg-zinc-950 p-3">
      <div class="font-medium">${esc(itemId)}</div>
      <div class="text-sm text-zinc-400">x${esc(amount)}</div>
    </div>
  `).join("");
}

function renderStats(state) {
  if (byId("stat-gold")) byId("stat-gold").textContent = String(state.gold ?? 0);
  if (byId("stat-kills")) byId("stat-kills").textContent = String(state.kills ?? 0);
  if (byId("stat-attack")) byId("stat-attack").textContent = String(state.attack ?? 0);
  if (byId("stat-combat-level")) byId("stat-combat-level").textContent = String(state.combatLevel ?? 1);
}

function renderActivity(state) {
  if (byId("activity-kind")) byId("activity-kind").textContent = state.activity?.kind || "-";
  if (byId("activity-zone")) byId("activity-zone").textContent = state.activity?.zoneId || "-";
  if (byId("activity-monster")) byId("activity-monster").textContent = state.activity?.monsterId || "-";
  if (byId("activity-skill")) byId("activity-skill").textContent = state.activity?.skillId || "-";
  if (byId("activity-node")) byId("activity-node").textContent = state.activity?.nodeId || "-";
  if (byId("activity-progress")) byId("activity-progress").textContent = String(Math.floor(state.activity?.progress || 0));
  if (byId("enemy-hp")) byId("enemy-hp").textContent = `${state.enemyHp ?? 0} / ${state.enemyMaxHp ?? 0}`;
}

function renderDebug(state) {
  const root = byId("app-state");
  if (!root) return;
  root.textContent = JSON.stringify(state, null, 2);
}

function render(runtime) {
  if (!runtime?.state) return;
  renderStats(runtime.state);
  renderActivity(runtime.state);
  renderInventory(runtime.state);
  renderDebug(runtime.state);
}

window.GameUIRender = { render };
