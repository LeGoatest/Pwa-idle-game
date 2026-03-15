import { xpForLevel } from './systems/progression.js';

let toastTimeoutId = null;
let toastRemoveTimeoutId = null;

export function showToast(title, body) {
  const existing = document.getElementById('game-toast');
  if (existing) existing.remove();

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
  }

  if (toastRemoveTimeoutId) {
    clearTimeout(toastRemoveTimeoutId);
    toastRemoveTimeoutId = null;
  }

  const toast = document.createElement('div');
  toast.id = 'game-toast';
  toast.className = [
    'fixed',
    'z-[200]',
    'bg-zinc-900/95',
    'border-2',
    'border-cyan-500/30',
    'p-4',
    'rounded-2xl',
    'shadow-[0_0_30px_rgba(34,211,238,0.2)]',
    'backdrop-blur-md',
    'animate-in',
    'slide-in-from-bottom-2'
  ].join(' ');

  toast.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/40 shrink-0">
        <span class="icon-[game-icons--radar-sweep] text-cyan-400 icon-md animate-pulse"></span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/70 mb-0.5">${title}</div>
        <div class="text-sm font-black uppercase italic tracking-tight text-zinc-100">${body}</div>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.remove('animate-in', 'slide-in-from-bottom-2');
    toast.classList.add('animate-out', 'slide-out-to-bottom-2');

    toastRemoveTimeoutId = window.setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

export function showOfflineSummary(report) {
  if (!report) return;

  const hours = Math.floor(report.elapsed / (1000 * 60 * 60));
  const mins = Math.floor((report.elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const modalRoot = document.getElementById('modal-root');
  const modalContent = document.getElementById('modal-content');

  if (!modalRoot || !modalContent) return;

  modalContent.innerHTML = `
    <div class="pixel-card bg-zinc-900 border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)] animate-in zoom-in-95 duration-300">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-full mb-4 border border-cyan-500/20">
          <span class="icon-[game-icons--sunrise] text-cyan-400 w-10 h-10 animate-pulse"></span>
        </div>
        <h2 class="text-2xl font-black uppercase tracking-tighter italic">Welcome Back</h2>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Gains during ${timeStr} absence</p>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        ${report.gold > 0 ? `
          <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
            <span class="icon-[game-icons--coins] text-yellow-500 w-5 h-5"></span>
            <div>
              <div class="text-[8px] font-black uppercase text-zinc-500">Gold</div>
              <div class="text-sm font-black tabular-nums">+${report.gold}</div>
            </div>
          </div>
        ` : ''}
        ${report.logs > 0 ? `
          <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
            <span class="icon-[game-icons--birch-trees] text-orange-400 w-5 h-5"></span>
            <div>
              <div class="text-[8px] font-black uppercase text-zinc-500">Logs</div>
              <div class="text-sm font-black tabular-nums">+${report.logs}</div>
            </div>
          </div>
        ` : ''}
        ${report.ore > 0 ? `
          <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
            <span class="icon-[game-icons--pickelhaube] text-blue-400 w-5 h-5"></span>
            <div>
              <div class="text-[8px] font-black uppercase text-zinc-500">Ore</div>
              <div class="text-sm font-black tabular-nums">+${report.ore}</div>
            </div>
          </div>
        ` : ''}
        ${report.kills > 0 ? `
          <div class="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 flex items-center gap-3">
            <span class="icon-[game-icons--skull-mask] text-red-400 w-5 h-5"></span>
            <div>
              <div class="text-[8px] font-black uppercase text-zinc-500">Kills</div>
              <div class="text-sm font-black tabular-nums">+${report.kills}</div>
            </div>
          </div>
        ` : ''}
      </div>

      <button class="btn-primary w-full py-4 flex items-center justify-center gap-2" data-action="close-modal">
        <span class="icon-[game-icons--check-mark] icon-sm"></span>
        <span class="text-xs font-black uppercase italic tracking-widest">Acknowledge</span>
      </button>
    </div>
  `;

  modalRoot.classList.remove('hidden');
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = value;
  });
}

function setWidth(selector, pct) {
  document.querySelectorAll(selector).forEach((el) => {
    el.style.width = `${pct}%`;
  });
}

function getSkillMeta(skillId) {
  if (skillId === 'woodcutting') {
    return { levelKey: 'woodLevel', xpKey: 'woodXp' };
  }
  if (skillId === 'mining') {
    return { levelKey: 'mineLevel', xpKey: 'mineXp' };
  }
  if (skillId === 'combat') {
    return { levelKey: 'combatLevel', xpKey: 'combatXp' };
  }
  return {
    levelKey: `${skillId}Level`,
    xpKey: `${skillId}Xp`
  };
}

export function render(state, contentState) {
  const pulse = document.getElementById('active-pulse');
  const isIdle = state.activity?.kind === 'none';

  if (pulse) {
    if (isIdle) {
      pulse.classList.add('hidden');
      pulse.classList.remove('animate-pulse', 'activity-pulse');
    } else {
      pulse.classList.remove('hidden');
      pulse.classList.add('animate-pulse', 'activity-pulse');
    }
  }

  setText('[data-bind="gold"]', String(state.gold ?? 0));
  setText('[data-bind="logs"]', String(state.logs ?? 0));
  setText('[data-bind="ore"]', String(state.ore ?? 0));
  setText('[data-bind="swords"]', String(state.swords ?? 0));
  setText('[data-bind="kills"]', String(state.kills ?? 0));
  setText('[data-bind="attack"]', String(state.attack ?? 0));
  setText('[data-bind="defense"]', String(state.defense ?? 0));
  setText('[data-bind="hp"]', String(state.hp ?? 0));
  setText('[data-bind="enemyHp"]', `${Math.max(0, state.enemyHp ?? 0)} / ${state.enemyMaxHp ?? 0}`);

  const activeTaskName = (() => {
    if (state.activity?.kind === 'combat' && contentState.activeMonster) {
      return contentState.activeMonster.name;
    }
    if (state.activity?.kind === 'skilling' && contentState.activeSkill) {
      const node = contentState.activeSkill.nodes?.find((n) => n.id === state.activity.nodeId);
      return node ? `${contentState.activeSkill.name}: ${node.name}` : contentState.activeSkill.name;
    }
    return 'Idle';
  })();

  setText('[data-bind="activeTaskName"]', activeTaskName);

  const enemyPct = state.enemyMaxHp > 0 ? Math.max(0, Math.min(100, ((state.enemyHp ?? 0) / state.enemyMaxHp) * 100)) : 0;
  setWidth('[data-bind-style="enemyHpPct"]', enemyPct);

  document.querySelectorAll('[data-bind-class]').forEach((el) => {
    const expr = el.dataset.bindClass;

    if (expr === "activity.kind !== 'none' ? '' : 'hidden'") {
      if (state.activity?.kind !== 'none') el.classList.remove('hidden');
      else el.classList.add('hidden');
    } else if (expr === "activity.kind === 'combat' ? '' : 'hidden'") {
      if (state.activity?.kind === 'combat') el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  document.querySelectorAll('[data-task-bar]').forEach((el) => {
    const duration = (() => {
      if (state.activity?.kind === 'combat' && contentState.activeMonster) {
        return contentState.activeMonster.durationMs || 2000;
      }
      if (state.activity?.kind === 'skilling' && contentState.activeSkill) {
        const node = contentState.activeSkill.nodes?.find((n) => n.id === state.activity.nodeId);
        return node?.durationMs || 1000;
      }
      return 1000;
    })();

    const pct = state.activity?.kind === 'none'
      ? 0
      : Math.min(100, ((state.activity.progress ?? 0) / duration) * 100);

    el.style.width = `${pct}%`;

    if (state.activity?.kind === 'none') {
      el.parentElement?.classList.add('opacity-0');
    } else {
      el.parentElement?.classList.remove('opacity-0');
    }
  });

  document.querySelectorAll('[data-task-status]').forEach((el) => {
    const task = el.dataset.taskStatus;
    const isActive = task === state.activity?.kind || task === state.activity?.skillId;

    el.textContent = isActive ? 'Active' : 'Paused';

    if (isActive) {
      el.classList.add('text-cyan-400');
      el.classList.remove('text-zinc-500');
    } else {
      el.classList.remove('text-cyan-400');
      el.class
