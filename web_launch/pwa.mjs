let installEvent;
const installButton = document.querySelector('#install-app');
const status = document.querySelector('#install-status');
function installed() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
if (installButton) installButton.hidden = true;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; if (installButton) installButton.hidden = false; status.textContent = 'Synera можна встановити на домашній екран.'; });
window.addEventListener('appinstalled', () => { installEvent = null; status.textContent = 'Synera встановлена. Відкрий її з домашнього екрана.'; if (installButton) installButton.hidden = true; });
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (installEvent) { const pending = installEvent; installEvent = null; await pending.prompt(); return; }
    status.textContent = installed() ? 'Synera вже відкрита як застосунок.'
      : 'Android: меню Chrome → Встановити застосунок / Додати на головний екран. iPhone: Safari → Поділитися → На початковий екран → Відкривати як вебпрограму. На телефоні потрібне опубліковане HTTPS-посилання.';
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
          status.textContent = 'Synera оновлюється. Перезавантажуємо...';
          setTimeout(() => window.location.reload(), 1500);
        }
      });
    });
  })
  .catch(() => {
    status.textContent = 'Офлайн-режим недоступний у цьому браузері. Онлайн-сторінкою можна користуватись.';
  });
  
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
window.addEventListener('offline', () => { status.textContent = 'Немає інтернету. Незбережена чернетка залишається у вкладці. Завантаж JSON перед закриттям; серверні зміни потребують з’єднання.'; });
window.addEventListener('online', () => { status.textContent = 'З’єднання відновлено.'; });
