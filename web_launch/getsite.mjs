import { GET_COPY } from './getsite-copy.mjs';
import { PRODUCT_COPY } from './product-access.mjs';
import { qrSVG } from './qr.mjs';
const select = document.querySelector('#site-language');
const action = document.querySelector('#install-primary');
const guide = document.querySelector('#install-guide');
document.querySelector('#install-fallback').hidden = true;
const display = matchMedia('(display-mode: standalone)');
const ua = navigator.userAgent;
const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const platform = ios ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop';
document.body.dataset.device = platform;
let promptEvent, appInstalled = false;
const installed = () => display.matches || navigator.standalone === true || appInstalled;
const initial = new URL(location.href).searchParams.get('lang');
if (Object.hasOwn(GET_COPY, initial)) select.value = initial;
function render() {
  const lang = Object.hasOwn(GET_COPY, select.value) ? select.value : 'uk', c = GET_COPY[lang];
  document.documentElement.lang = lang; document.title = c.title;
  for (const n of document.querySelectorAll('[data-get-copy]')) n.textContent = c[n.dataset.getCopy];
  document.querySelector('#transfer-title').textContent = c[platform==='desktop'?'scan':'other'];
  for (const n of document.querySelectorAll('[data-product-copy]')) n.textContent = PRODUCT_COPY[lang][n.dataset.productCopy];
  action.textContent = c[installed() ? 'open' : ios ? 'ios' : 'android'];
  action.href = `/?draft=1&lang=${lang}`;
  document.querySelector('#continue-browser').href = action.href;
  document.querySelector('#install-manifest').href = `/get-${lang}.webmanifest`;
  document.querySelector('#install-guide-close').setAttribute('aria-label',c.close);
  document.querySelector('#phone-qr').setAttribute('aria-label',c[platform==='desktop'?'scan':'other']);
  for (const link of document.querySelectorAll('[data-get-link]')) {
    const url = new URL(link.href); url.searchParams.set('lang',lang); link.href = url.pathname + url.search + url.hash;
  }
  const url = new URL(location.href);
  // Only the language changes; preserve the current path, next action and fragment.
  url.searchParams.set('lang',lang); history.replaceState(null,'',url);
  document.querySelector('#qr-link').href = url.href;
  try { document.querySelector('#phone-qr').innerHTML = qrSVG(url.href); }
  catch { document.querySelector('#phone-qr').textContent = c.qrError; }
}
select.addEventListener('change',render);
function chooseGuide(isIOS) {
  document.querySelector('#android-guide').hidden = isIOS;
  document.querySelector('#ios-guide').hidden = !isIOS;
  document.querySelector('#guide-android').setAttribute('aria-pressed',String(!isIOS));
  document.querySelector('#guide-ios').setAttribute('aria-pressed',String(isIOS));
}
function showGuide() {
  chooseGuide(ios);
  guide.showModal();
}
action.addEventListener('click',async event => {
  if (installed()) return;
  event.preventDefault();
  if (promptEvent) {
    const pending = promptEvent; promptEvent = null;
    try {
      await pending.prompt();
      const choice = await pending.userChoice;
      if (choice?.outcome === 'accepted') return;
    } catch { /* Keep the browser guide available after a rejected prompt. */ }
  }
  showGuide();
});
window.addEventListener('beforeinstallprompt',event => { event.preventDefault(); promptEvent = event; });
window.addEventListener('appinstalled',() => { promptEvent = null; appInstalled = true; render(); if(guide.open)guide.close(); });
display.addEventListener('change',render);
document.querySelector('#manual-install').addEventListener('click',showGuide);
document.querySelector('#manual-install').disabled = false;
document.querySelector('#install-guide-close').addEventListener('click',()=>guide.close());
document.querySelector('#guide-android').addEventListener('click',()=>chooseGuide(false));
document.querySelector('#guide-ios').addEventListener('click',()=>chooseGuide(true));
render();
// The APK button exists only where the signed file and its public receipt are really served (K5, docs/APK-20261030.uk.md).
async function showApkDownload() {
  const row = document.querySelector('#apk-row'), hash = document.querySelector('#apk-sha256');
  row.hidden = true;
  try {
    const head = await fetch('/synera.apk', { method: 'HEAD', cache: 'no-store', redirect: 'error' });
    if (head.status !== 200) return;
    const meta = await fetch('/android-release.json', { cache: 'no-store', redirect: 'error' });
    if (meta.status !== 200) return;
    const release = await meta.json();
    if (release.packageId !== 'ch.synera.app' || !/^[a-f0-9]{64}$/.test(release.sha256)) return;
    hash.textContent = `SHA-256 ${release.sha256}`;
    row.hidden = false;
  } catch { /* No APK on this origin: the row stays hidden. */ }
}
showApkDownload();
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.mjs',{type:'module',updateViaCache:'none'}).catch(()=>{});
