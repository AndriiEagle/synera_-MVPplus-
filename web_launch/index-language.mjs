// Language buttons of the sign-in and profile page. Ukrainian is the default and needs nothing beyond this
// file. German and English load their text only when chosen — here, on the two-person page (the choice is
// shared), or by a link with ?lang=de / ?lang=en. The browser's language is deliberately not consulted.
const KEY = 'synera.real-journey.language.v1', CODES = ['uk', 'de', 'en'];
let storage = null; try { storage = window.localStorage; } catch { /* The choice then lasts for this page only. */ }
let saved = null; try { saved = storage?.getItem(KEY); } catch { /* Private mode. */ }
const asked = new URLSearchParams(location.search).get('lang');
const buttons = [...document.querySelectorAll('#lang-switcher [data-lang]')];
let current = 'uk', overlay = null;
function mark() { for (const button of buttons) { const on = button.dataset.lang === current; button.classList.toggle('active', on); button.setAttribute('aria-pressed', String(on)); } }
async function choose(code) {
  const before = current; current = code; mark();
  try {
    if (code === 'uk' && !overlay) { try { storage?.setItem(KEY, code); } catch { /* This page only. */ } return; }
    const [core, page] = await Promise.all([import('./real-journey-i18n.mjs'), import('./index-i18n.mjs')]);
    core.setLanguage(code, storage); overlay ||= page.startOverlay(document); overlay.apply();
  } catch { current = before; mark(); } // Text could not be loaded: the page stays as it was, and says so by the button.
}
for (const button of buttons) button.addEventListener('click', () => choose(button.dataset.lang));
mark();
const start = CODES.includes(asked) ? asked : CODES.includes(saved) ? saved : 'uk';
if (start !== 'uk') choose(start);
