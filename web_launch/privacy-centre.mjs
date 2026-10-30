import { PRIVACY_COPY, languageCode } from './privacy-content.mjs';
import { renderNotice } from './privacy-common.mjs';
import { exportDevice, eraseDevice } from './privacy-device.mjs';
import { LIVE_AI_COPY } from './live-ai-client.mjs';
import { qrSVG } from './qr.mjs';
const $ = id => document.getElementById(id), copy = () => PRIVACY_COPY[languageCode(document.documentElement.lang)];
let liveAiProvider;
function translate() {
  const c = copy(); document.title = c.title + ' · Synera';
  for (const node of document.querySelectorAll('[data-privacy-copy]')) node.textContent = c[node.dataset.privacyCopy];
  renderNotice($('privacy-notice'));
  if(liveAiProvider) { const p=document.createElement('p');p.dataset.liveAiProvider='';p.textContent=LIVE_AI_COPY[languageCode(document.documentElement.lang)].processor+': '+liveAiProvider+'.';$('privacy-notice').append(p); }
  $('privacy-account').href = '/?privacy=1&lang=' + languageCode(document.documentElement.lang);
  const link=new URL('/legal.html?lang='+languageCode(document.documentElement.lang),location.origin);
  $('privacy-print-url').href=link.href;$('privacy-print-url').textContent=c.legalLink+' · '+link.href;
  try { $('privacy-print-qr').innerHTML=qrSVG(link.href); } catch { $('privacy-print-qr').replaceChildren(); }
}
translate(); new MutationObserver(translate).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
fetch('/config.json',{cache:'no-store',credentials:'omit'}).then(r=>r.json()).then(config=>{if(config.liveAiReady===true&&typeof config.liveAiProvider==='string'){liveAiProvider=config.liveAiProvider;translate();}}).catch(()=>{});
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
