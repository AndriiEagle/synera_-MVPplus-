// Shared presentation controls. They never read form values, profile data or consent.
import './style-switcher.mjs';
import './adaptive-ui.mjs';
const KEY = 'synera.real-journey.language.v1', CODES = ['uk', 'de', 'en'];

let storage = null;
try { storage = window.localStorage; } catch { /* This page only. */ }
const select = document.querySelector('#site-language');
const page = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/index';
const ownLanguage = ['/real-journey', '/summit', '/get'].includes(page);
const query = new URLSearchParams(location.search);
let saved = null; try { saved = storage?.getItem(KEY); } catch {}
const asked = query.get('lang');
const start = query.has('original') ? 'uk' : CODES.includes(asked) ? asked : CODES.includes(saved) ? saved : 'uk';
let overlay, revision = 0;
async function language(code) {
  const currentRevision = ++revision;
  try { storage?.setItem(KEY, code); } catch {}
  document.documentElement.lang = code;
  if (code !== 'uk' || overlay) {
    const [core, module] = await Promise.all([import('./real-journey-i18n.mjs'), import('./index-i18n.mjs')]);
    if (currentRevision !== revision) return;
    core.setLanguage(code, storage);
    // The real page translates dynamic data through t()/said(); its static collector owns that page.
    const scope = page === '/index' ? undefined : ownLanguage ? '.site-header,.more-modes' : '.site-header,.more-modes,.studio-heading,.real-heading,.rooms-intro,.lab-intro,.reference-intro';
    overlay ||= module.startOverlay(document, { scope, staticOnly: page !== '/index' });
    overlay.apply();
  }
  if (page === '/legal' && (code !== 'uk' || document.querySelector('#translation-notice'))) {
    const legal = await import('./legal-i18n.mjs');
    if (currentRevision === revision) legal.show(document, code);
  }
}
if (select) {
  select.value = start;
  select.addEventListener('change', () => { language(select.value).catch(() => {}); });
  // Existing page-specific translators consume the same explicit choice.
  select.dispatchEvent(new Event('change'));
}
const preferences = document.querySelector('.header-preferences');
document.addEventListener('click', event => {
  if (preferences?.open && !preferences.contains(event.target)) preferences.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && preferences?.open) {
    preferences.open = false;
    preferences.querySelector('summary').focus();
  }
});
if (page === '/index') document.querySelector('#tour-start')?.removeAttribute('hidden');
document.querySelector('#tour-start')?.addEventListener('click', () => { if (preferences) preferences.open = false; });
