// The rules page follows the language chosen on the other pages (or ?lang=de / ?lang=en). Ukrainian is the
// binding text and the default: a Ukrainian visit loads nothing more than this file. ?original always shows it.
const KEY = 'synera.real-journey.language.v1', CODES = ['de', 'en'];
const query = new URLSearchParams(location.search), asked = query.get('lang');
let saved = null; try { saved = window.localStorage.getItem(KEY); } catch { /* Private mode: Ukrainian. */ }
const code = query.has('original') || asked === 'uk' ? 'uk' : CODES.includes(asked) ? asked : CODES.includes(saved) ? saved : 'uk';
if (code !== 'uk') import('./legal-i18n.mjs').then(page => page.show(document, code)).catch(() => { /* The Ukrainian text stays. */ });
