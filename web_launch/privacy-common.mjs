import { PRIVACY_COPY, languageCode, DEVICE_GROUPS } from './privacy-content.mjs';
import { studioData } from './privacy-device.mjs';
const code = () => languageCode(document.documentElement.lang);
function element(tag, text) { const node = document.createElement(tag); if (text) node.textContent = text; return node; }
export function renderNotice(target) {
  const c = PRIVACY_COPY[code()]; target.replaceChildren();
  const draft = element('p', c.draft); draft.className = 'privacy-draft'; target.append(draft);
  for (const [heading, paragraphs] of [['stored', ['inventory', 'memory']], ['retention', ['serverRetention', 'runtime']], ['processors', ['neon', 'cloudflare', 'email', 'maps', 'liveAi']], ['rights', ['rightsText', 'contact']], [null, ['cookies', 'demo']]]) {
    if (heading) target.append(element('h2', c[heading]));
    for (const key of paragraphs) target.append(element('p', c[key]));
    if (heading === 'stored') {
      const list = element('dl'); list.className = 'privacy-inventory';
      for (const [purpose, storage, keys] of DEVICE_GROUPS) { list.append(element('dt', c[purpose])); const row = element('dd'); row.append(element('strong', storage)); for (const key of keys) row.append(element('code', key)); list.append(row); }
      target.append(list);
    }
    const evidence=element('p','NEEDS_REVIEW · '), source=element('a','DSG / EDÖB');
    source.href='https://www.edoeb.admin.ch/en/duty-to-provide-information'; evidence.append(source);target.append(evidence);
  }
}
export function privacyLinks() {
  const c = PRIVACY_COPY[code()];
  for (const target of [...document.querySelectorAll('.header-preferences-content'), ...document.querySelectorAll('footer')]) {
    if (!target || target.querySelector('[data-privacy-link]')) continue;
    const link = element('a', c.title); link.href = '/privacy.html'; link.dataset.privacyLink = ''; target.append(link);
  }
  for (const link of document.querySelectorAll('[data-privacy-link]')) { link.textContent = c.title; link.href = '/privacy.html?lang=' + code(); }
  const notice = document.getElementById('privacy-notice'); if (notice) renderNotice(notice);
}
privacyLinks();
new MutationObserver(privacyLinks).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
// Run on every shared-shell page. Static pages never need to read the stored session text.
studioData('purge').catch(() => { /* Storage may be forbidden. The centre reports unavailable storage explicitly. */ });
