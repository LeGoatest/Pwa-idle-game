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

function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.4));
}

function currentCombatMode(state) {
  const mode = state?.ui?.combatMode || "attack";
  if (mode === "strength" || mode === "defense" || mode === "attack") return mode;
  return "attack";
}

function combatModeLabel(state) {
  switch (currentCombatMode(state)) {
    case "strength":
      return "STR";
    case "defense":
      return "DEF";
    default:
      return "ATK";
  }
}

function combatModeIconClass(state) {
  switch (currentCombatMode(state)) {
    case "strength":
      return "icon-[mdi--arm-flex] icon-sm text-zinc-100";
    case "defense":
      return "icon-[mdi--shield] icon-sm text-emerald-400";
    default:
      return "icon-[mdi--sword] icon-sm text-cyan-400";
  }
}

function combatModeLevel(state) {
  switch (currentCombatMode(state)) {
    case "strength":
      return state.strengthLevel ?? 1;
    case "defense":
      return state.defenseLevel ?? 1;
    default:
      return state.attackLevel ?? 1;
  }
}

function combatModeXP(state) {
  switch (currentCombatMode(state)) {
    case "strength":
      return state.strengthXp ?? 0;
    case "defense":
      return state.defenseXp ?? 0;
    default:
      return state.attackXp ?? 0;
  }
}

function combatDuration(state, runtime) {
  const monsterId = state?.ui?.currentMonsterId || "";
  const reg = runtime?.registry;
  const monster = reg?.monsters?.[monsterId] || reg?.Monsters?.[monsterId];
  return monster?.durationMs ?? monster?.DurationMS ?? 0;
}

function actionSpeedLabel(state, runtime) {
  const duration = combatDuration(state, runtime);
  if (!duration || duration <= 0) return "--";
  return `${(duration / 1000).toFixed(2)}s`;
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

function renderCombatTraining(state, runtime) {
  const smallName = byId("combat-style-name-small");
  if (smallName) smallName.textContent = combatModeLabel(state);

  const level = byId("combat-style-level");
  if (level) level.textContent = `${combatModeLabel(state)} Lv. ${combatModeLevel(state)}`;

  const xp = byId("combat-style-xp");
  if (xp) {
    const cur = Math.floor(combatModeXP(state));
    const need = xpForLevel(combatModeLevel(state));
    xp.textContent = `${cur} / ${need}`;
  }

  const fill = byId("combat-style-xp-fill");
  if (fill) {
    fill.style.width = pct(combatModeXP(state), xpForLevel(combatModeLevel(state)));
  }

  const icon = byId("combat-style-icon");
  if (icon) {
    icon.className = combatModeIconClass(state);
  }

  const speed = byId("action-speed-label");
  if (speed) {
    speed.textContent = actionSpeedLabel(state, runtime);
  }

  const enemySpeed = byId("enemy-action-label");
  if (enemySpeed) {
    enemySpeed.textContent = actionSpeedLabel(state, runtime);
  }
}

function renderStateBits(state, runtime) {
  if (byId("topbar-gold")) byId("topbar-gold").textContent = String(state.gold ?? 0);
  if (byId("stats-gold")) byId("stats-gold").textContent = String(state.gold ?? 0);
  if (byId("stats-attack")) byId("stats-attack").textContent = String(state.attack ?? 0);
  if (byId("stats-defense")) byId("stats-defense").textContent = String(state.defense ?? 0);
  if (byId("stats-hp")) byId("stats-hp").textContent = String(state.hp ?? 0);
  if (byId("stats-combat-level")) byId("stats-combat-level").textContent = String(state.combatLevel ?? 1);
  if (byId("stats-wood-level")) byId("stats-wood-level").textContent = String(state.woodLevel ?? 1);

  const enemyHpTop = byId("enemy-hp-top");
  if (enemyHpTop) enemyHpTop.textContent = String(state.enemyHp ?? 0);

  const playerHpBottom = byId("player-hp-bottom");
  if (playerHpBottom) playerHpBottom.textContent = String(state.hp ?? 0);

  const progressFill = byId("activity-progress-fill");
  if (progressFill) {
    const duration = combatDuration(state, runtime);
    progressFill.style.width = pct(state.activity?.progress ?? 0, duration);
  }

  const enemyActionFill = byId("enemy-action-fill");
  if (enemyActionFill) {
    const duration = combatDuration(state, runtime);
    enemyActionFill.style.width = pct(state.enemyProgress ?? 0, duration);
  }

  renderCombatTraining(state, runtime);
}

function render(runtime) {
  if (!runtime?.state) return;
  renderStateBits(runtime.state, runtime);
  renderInventory(runtime.state);
}

window.GameUIRender = { render };
