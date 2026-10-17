// Language buttons of the sign-in and profile page. Ukrainian is the default and needs nothing beyond this
// file. German and English load their text only when chosen — here, on the two-person page (the choice is
// shared), or by a link with ?lang=de / ?lang=en. The browser's language is deliberately not consulted.
const KEY = 'synera.real-journey.language.v1', CODES = ['uk', 'de', 'en'];
let storage = null; try { storage = window.localStorage; } catch { /* The choice then lasts for this page only. */ }
let saved = null; try { saved = storage?.getItem(KEY); } catch { /* Private mode. */ }
const asked = new URLSearchParams(location.search).get('lang');
const buttons = [...document.querySelectorAll('#lang-switcher [data-lang]')];
let current = 'uk', shown = 'uk', overlay = null; // what the buttons say, and what the page actually shows
function mark() { for (const button of buttons) { const on = button.dataset.lang === current; button.classList.toggle('active', on); button.setAttribute('aria-pressed', String(on)); } }
async function choose(code) {
  current = code; mark();
  try {
    if (code === 'uk' && !overlay) { try { storage?.setItem(KEY, code); } catch { /* This page only. */ } return; }
    const [core, page] = await Promise.all([import('./real-journey-i18n.mjs'), import('./index-i18n.mjs')]);
    if (current !== code) return; // the person chose again while the text was loading: the newer choice wins
    core.setLanguage(code, storage); overlay ||= page.startOverlay(document); overlay.apply(); shown = code;
  } catch { if (current === code) { current = shown; mark(); } } // Text could not be loaded: the page stays as it was, and the buttons say so.
}
for (const button of buttons) button.addEventListener('click', () => choose(button.dataset.lang));
mark();
const start = CODES.includes(asked) ? asked : CODES.includes(saved) ? saved : 'uk';
if (start !== 'uk') choose(start);
else if (asked === 'uk') { try { storage?.setItem(KEY, 'uk'); } catch { /* This page only. */ } }
