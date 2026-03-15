import { TASKS_CONFIG } from './content.js';
import { getCycleDuration } from './systems/tasks.js';

export function showToast(title, body) {
  const existing = document.getElementById('game-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'game-toast';
  toast.className =
    'fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xs bg-zinc-900 border-2 border-cyan-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-in slide-in-from-bottom-2 duration-300 backdrop-blur-md';

  toast.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/40">
        <span class="icon-[game-icons--radar-sweep] text-cyan-400 icon-md animate-pulse"></span>
      </div>
      <div class="flex-1">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/70 mb-0.5">${title}</div>
        <div class="text-sm font-black uppercase italic tracking-tight text-zinc-100">${body}</div>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export function showOfflineSummary(report) {
  if (!report) return;

  const hours = Math.floor(report.elapsed / (1000 * 60 * 60));
  const mins = Math.floor((report.elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const modalRoot = document.getElementById('modal-root');
  const modalContent = document.getElementById('modal-content');

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

export function render(state) {
  const isIdle = state.activeTask.kind === 'none';

  const pulse = document.getElementById('active-pulse');
  if (pulse) {
    if (isIdle) {
      pulse.classList.add('hidden');
      pulse.classList.remove('animate-pulse', 'activity-pulse');
    } else {
      pulse.classList.remove('hidden');
      pulse.classList.add('animate-pulse', 'activity-pulse');
    }
  }

  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    const val = state[key] ?? '0';

    if (key === 'enemyHp') {
      el.textContent = `${Math.max(0, state.enemyHp)} / ${state.enemyMaxHp}`;
      return;
    }

    if (key === 'activeTaskName') {
      el.textContent = TASKS_CONFIG[state.activeTask.kind]?.name || 'Idle';
      if (!isIdle) el.classList.add('text-cyan-400');
      else el.classList.remove('text-cyan-400');
      return;
    }

    const next = String(val);
    if (el.textContent !== next) {
      el.textContent = next;
      if (['gold', 'logs', 'ore', 'potions', 'swords'].includes(key)) {
        el.classList.remove('stat-pop');
        void el.offsetWidth;
        el.classList.add('stat-pop');
      }
    }
  });

  document.querySelectorAll('[data-bind-class]').forEach((el) => {
    const expr = el.dataset.bindClass;

    if (expr === "activeTask.kind !== 'none' ? '' : 'hidden'") {
      if (state.activeTask.kind !== 'none') el.classList.remove('hidden');
      else el.classList.add('hidden');
    } else if (expr === "activeTask.kind === 'combat' ? '' : 'hidden'") {
      if (state.activeTask.kind === 'combat') el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  document.querySelectorAll('[data-bind-style="enemyHpPct"]').forEach((el) => {
    const pct = Math.max(0, Math.min(100, (state.enemyHp / state.enemyMaxHp) * 100));
    el.style.width = `${pct}%`;
  });

  const currentKind = state.activeTask.kind;
  document.querySelectorAll('[data-task-bar]').forEach((el) => {
    const taskKind = el.dataset.taskBar;
    if (taskKind === currentKind) {
      const duration = getCycleDuration(currentKind);
      const pct = Math.min(100, (state.activeTask.progress / duration) * 100);
      el.style.width = `${pct}%`;
      el.parentElement?.classList.remove('opacity-0');
    } else {
      el.style.width = '0%';
      el.parentElement?.classList.add('opacity-0');
    }
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    const action = btn.dataset.action;
    if (!action || !TASKS_CONFIG[action]) return;

    const icon = btn.querySelector('.icon-contract');
    const textSpan = btn.querySelector('span:not(.icon-contract)');
    const isActiveTask = state.activeTask.kind === action;

    if (icon) {
      if (isActiveTask) {
        icon.classList.remove('icon-[game-icons--play-button]');
        icon.classList.add('icon-[game-icons--pause-button]');
      } else {
        icon.classList.remove('icon-[game-icons--pause-button]');
        icon.classList.add('icon-[game-icons--play-button]');
      }
    }

    if (textSpan && action === 'combat') {
      textSpan.textContent = isActiveTask ? 'Stop Hunt' : 'Begin Hunt';
    }
  });

  document.querySelectorAll('[data-task-status]').forEach((el) => {
    const task = el.dataset.taskStatus;
    const isActiveTask = state.activeTask.kind === task;
    el.textContent = isActiveTask ? 'Active' : 'Paused';
    if (isActiveTask) {
      el.classList.add('text-cyan-400');
      el.classList.remove('text-zinc-500');
    } else {
      el.classList.remove('text-cyan-400');
      el.classList.add('text-zinc-500');
    }
  });

  document.querySelectorAll('#skills-launcher [data-action]').forEach((btn) => {
    const action = btn.dataset.action;
    if (action === state.activeTask.kind) {
      btn.classList.add('border-cyan-500/50', 'bg-cyan-500/10');
      btn.querySelector('span')?.classList.add('text-cyan-400');
    } else {
      btn.classList.remove('border-cyan-500/50', 'bg-cyan-500/10');
      btn.querySelector('span')?.classList.remove('text-cyan-400');
    }
  });

  const activeStation = document.querySelector('#view-root section')?.dataset.view;
  document.querySelectorAll('footer nav button').forEach((btn) => {
    const hxGet = btn.getAttribute('hx-get');
    if (hxGet && activeStation && hxGet.includes(activeStation)) {
      btn.classList.add('text-cyan-400');
      btn.classList.remove('text-zinc-400');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('text-cyan-400');
      btn.classList.add('text-zinc-400');
      btn.removeAttribute('aria-selected');
    }
  });
}
