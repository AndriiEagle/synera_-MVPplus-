let installEvent;
const installButton = document.querySelector('#install-app');
const status = document.querySelector('#install-status');
function announce(message) { if (status) status.textContent = message; }
function installed() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
// Safari has no beforeinstallprompt event: keep the manual guide reachable.
if (installButton) installButton.hidden = installed();
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; if (installButton) installButton.hidden = false; announce('Synera можна встановити як PWA у цьому браузері.'); });
window.addEventListener('appinstalled', () => { installEvent = null; announce('Synera встановлена. Відкрий її з домашнього екрана.'); if (installButton) installButton.hidden = true; });
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (installEvent) {
      const pending = installEvent; installEvent = null;
      try { await pending.prompt(); return; } catch { /* Manual installation remains available. */ }
    }
    announce(installed() ? 'Synera вже відкрита як застосунок.'
      : 'Android: Chrome → Встановити застосунок / Додати на головний екран. iPhone: Safari → Поділитися → На початковий екран → Відкривати як вебпрограму. Windows: Edge або Chrome → меню → Встановити Synera. Це PWA, не APK, IPA чи EXE; для встановлення потрібне опубліковане HTTPS-посилання.');
  });
  if (installed()) installButton.hidden = true;
}
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('/sw.mjs', { type: 'module', updateViaCache: 'none' })
  .then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          announce('Доступне оновлення Synera. Збережи роботу, потім онови сторінку у браузері.');
        }
      });
    });
  })
  .catch(() => {
    announce('Офлайн-режим недоступний у цьому браузері. Онлайн-сторінкою можна користуватись.');
  });
  
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Never reload an active form or conversation without the user's action.
    announce('Доступне оновлення Synera. Збережи роботу, потім онови сторінку у браузері.');
  });
}
window.addEventListener('offline', () => { announce('Немає інтернету. Незбережена чернетка залишається у вкладці. Завантаж JSON перед закриттям; серверні зміни потребують з’єднання.'); });
window.addEventListener('online', () => { announce('З’єднання відновлено.'); });
