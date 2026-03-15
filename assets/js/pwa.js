export function initPwa() {
  let installPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.classList.remove('hidden');
  });

  document.body.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== 'install-btn') return;
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    target.classList.add('hidden');
  });
}
