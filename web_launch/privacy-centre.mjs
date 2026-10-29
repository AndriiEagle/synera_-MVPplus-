import { PRIVACY_COPY, languageCode } from './privacy-content.mjs';
import { renderNotice } from './privacy-common.mjs';
import { exportDevice, eraseDevice } from './privacy-device.mjs';
const $ = id => document.getElementById(id), copy = () => PRIVACY_COPY[languageCode(document.documentElement.lang)];
function translate() {
  const c = copy(); document.title = c.title + ' · Synera';
  for (const node of document.querySelectorAll('[data-privacy-copy]')) node.textContent = c[node.dataset.privacyCopy];
  renderNotice($('privacy-notice'));
  $('privacy-account').href = '/?privacy=1&lang=' + languageCode(document.documentElement.lang);
}
translate(); new MutationObserver(translate).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
async function action(button, task) { button.disabled = true; try { await task(); } catch { $('privacy-status').textContent = copy().error; } finally { button.disabled = false; } }
$('privacy-download').addEventListener('click', event => action(event.currentTarget, async () => {
  const data = await exportDevice(), url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'synera-device.private.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  $('privacy-status').textContent = data.unavailable.length ? copy().partial + ' ' + data.unavailable.join(', ') : copy().downloaded;
}));
$('privacy-erase').addEventListener('click', event => action(event.currentTarget, async () => {
  if (!confirm(copy().confirm)) return;
  const result = await eraseDevice();
  $('privacy-status').textContent = result.ok ? copy().done : copy().partial + ' ' + result.unavailable.join(', ');
}));
