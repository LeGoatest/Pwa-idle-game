import { TASKS_CONFIG } from '../content.js';
import { gainXp } from './progression.js';

export function getCycleDuration(kind) {
  const config = TASKS_CONFIG[kind];
  if (!config) return 1000;
  return config.baseDuration;
}

export function applyTaskCompletion(state, kind) {
  if (kind === 'combat') {
    state.enemyHp -= state.attack + state.swords;

    if (state.enemyHp <= 0) {
      state.kills += 1;
      state.gold += 5 + state.combatLevel;
      gainXp(state, 'combat', 6);
      state.enemyMaxHp = 10 + state.combatLevel * 3;
      state.enemyHp = state.enemyMaxHp;
    }

    return;
  }

  if (kind === 'woodcutting') {
    state.logs += 1 + Math.floor(state.woodLevel / 5);
    gainXp(state, 'wood', 4);
    return;
  }

  if (kind === 'mining') {
    state.ore += 1 + Math.floor(state.mineLevel / 6);
    gainXp(state, 'mine', 4);
  }
}

export function processTask(state, deltaMs) {
  if (state.activeTask.kind === 'none') return false;

  const kind = state.activeTask.kind;
  const config = TASKS_CONFIG[kind];
  if (!config) return false;

  const duration = getCycleDuration(kind);
  state.activeTask.progress += deltaMs;
  state.activeTask.lastProcessedAt = Date.now();

  let changed = false;

  while (state.activeTask.progress >= duration) {
    state.activeTask.progress -= duration;
    applyTaskCompletion(state, kind);
    changed = true;
  }

  return changed;
}

export function setActiveTask(state, kind) {
  if (state.activeTask.kind === kind) {
    state.activeTask.kind = 'none';
    state.activeTask.startedAt = 0;
    state.activeTask.lastProcessedAt = 0;
    state.activeTask.progress = 0;
    return { stopped: kind, started: null };
  }

  const previous = state.activeTask.kind;
  state.activeTask.kind = kind;
  state.activeTask.startedAt = Date.now();
  state.activeTask.lastProcessedAt = Date.now();
  state.activeTask.progress = 0;

  return { stopped: previous === 'none' ? null : previous, started: kind };
}

export function progressOffline(state, maxOfflineMs) {
  const now = Date.now();
  const elapsed = Math.min(now - state.updatedAt, maxOfflineMs);

  if (elapsed <= 1000) return null;

  const startState = {
    gold: state.gold,
    logs: state.logs,
    ore: state.ore,
    kills: state.kills
  };

  processTask(state, elapsed);

  const report = {
    elapsed,
    gold: state.gold - startState.gold,
    logs: state.logs - startState.logs,
    ore: state.ore - startState.ore,
    kills: state.kills - startState.kills
  };

  if (report.gold || report.logs || report.ore || report.kills) {
    return report;
  }

  return null;
}
