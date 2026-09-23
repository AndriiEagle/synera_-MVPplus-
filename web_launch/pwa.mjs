export const DESIGN_STORAGE_KEY = 'synera-design-preference';
export const DESIGN_CHOICES = Object.freeze(['premium', 'classic']);

export function normalizeDesign(value, fallback = 'premium') {
  return DESIGN_CHOICES.includes(value) ? value : fallback;
}

export function applyDesign(root, design) {
  const selected = normalizeDesign(design);
  root.dataset.design = selected;
  return selected;
}

export function initDesignSwitch({ doc = document, storage = window.localStorage } = {}) {
  const root = doc.documentElement;
  const controls = [...doc.querySelectorAll('[data-design-choice]')];
  const selected = applyDesign(root, (() => { try { return storage.getItem(DESIGN_STORAGE_KEY) || root.dataset.design; } catch { return root.dataset.design; } })());
  const sync = design => {
    const active = applyDesign(root, design);
    controls.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.designChoice === active)));
    try { storage.setItem(DESIGN_STORAGE_KEY, active); } catch { /* The visual choice stays usable when storage is unavailable. */ }
  };
  controls.forEach(control => control.addEventListener('click', () => sync(control.dataset.designChoice)));
  sync(selected);
  return { selected, controls };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initDesignSwitch();
  let installEvent;
  const installButton = document.querySelector('#install-app');
  const status = document.querySelector('#install-status');
  const installationHelp = 'Android: меню Chrome → Встановити застосунок / Додати на головний екран. iPhone: Safari → Поділитися → На початковий екран → Відкривати як вебпрограму. Windows: використай лише пропозицію встановлення у браузері. На кожному пристрої потрібне опубліковане HTTPS-посилання.';
  function installed() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  if (installButton) installButton.hidden = true;
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; if (installButton) installButton.hidden = false; status.textContent = 'Synera можна встановити через браузерний PWA-запит.'; });
  window.addEventListener('appinstalled', () => { installEvent = null; status.textContent = 'Synera встановлена. Відкрий її з домашнього екрана або меню застосунків.'; if (installButton) installButton.hidden = true; });
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (installEvent) { const pending = installEvent; installEvent = null; await pending.prompt(); return; }
      status.textContent = installed() ? 'Synera вже відкрита як застосунок.' : installationHelp;
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
    .catch(() => { status.textContent = 'Офлайн-режим недоступний у цьому браузері. Встановлення все одно потребує опублікованого HTTPS-сайту та браузерного PWA-запиту.'; });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }
  window.addEventListener('offline', () => { status.textContent = 'Немає інтернету. Незбережена чернетка залишається у вкладці. Завантаж JSON перед закриттям; серверні зміни потребують з’єднання.'; });
  window.addEventListener('online', () => { status.textContent = 'З’єднання відновлено.'; });
}
