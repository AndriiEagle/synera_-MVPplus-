export function installHintMode(platform) {
  if (!platform || typeof platform.userAgent !== 'string' || platform.standalone === true) return 'none';
  const ua = platform.userAgent;
  if (/Android/.test(ua) && /(?:Chrome|Chromium)\//.test(ua) && platform.hasInstallPrompt === true) return 'android-install';
  if (/(?:iPhone|iPad|iPod)/.test(ua) && /AppleWebKit\//.test(ua) && /Version\//.test(ua) && /Safari\//.test(ua) && !/(?:CriOS|FxiOS|EdgiOS|OPiOS)\//.test(ua)) return 'ios-share';
  return 'none';
}

export function createInstallHint({ installed, onInstall }) {
  const hint = document.querySelector('#install-hint');
  if (!hint) return { update() {} };
  const button = hint.querySelector('#install-hint-install');
  const guide = hint.querySelector('#install-hint-guide');
  const key = 'synera.install-hint.dismissed.v1';
  let dismissed = false, pending = false;
  try { dismissed = localStorage.getItem(key) === '1'; } catch { /* The hint also works without storage. */ }
  function update(hasPrompt = pending) {
    pending = hasPrompt;
    const mode = installHintMode({ userAgent: navigator.userAgent, standalone: installed(), hasInstallPrompt: pending });
    hint.hidden = dismissed || mode === 'none';
    button.hidden = mode !== 'android-install';
    guide.hidden = mode !== 'ios-share';
  }
  button.addEventListener('click', onInstall);
  hint.querySelector('#install-hint-close').addEventListener('click', () => {
    dismissed = true;
    try { localStorage.setItem(key, '1'); } catch { /* Dismiss for this page even if storage is blocked. */ }
    update();
  });
  window.matchMedia('(display-mode: standalone)').addEventListener('change', () => update());
  update();
  return { update };
}
