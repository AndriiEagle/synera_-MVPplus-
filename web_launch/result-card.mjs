import { SESSION_VALUE_LIMITS } from './session-value.mjs';

const COPY = {
  uk: ['Приватна картка внеску', 'Результат співпраці', 'Редагована чернетка автора', 'Початкова чернетка ґрунтується на внеску, прийнятому його одержувачем. Текст може бути відредагований автором. Це не незалежна сертифікація чи перевірка особи.', 'Файл не опубліковано. Перед поширенням перевір текст, приватні відомості та дозволи інших людей.'],
  de: ['Private Beitragskarte', 'Ergebnis der Zusammenarbeit', 'Bearbeitbarer Entwurf der Autorin oder des Autors', 'Der ursprüngliche Entwurf basiert auf einem vom Empfänger angenommenen Beitrag. Der Text kann bearbeitet worden sein. Dies ist keine unabhängige Zertifizierung oder Identitätsprüfung.', 'Die Datei wurde nicht veröffentlicht. Prüfe vor dem Teilen den Text, private Angaben und die Zustimmung anderer Personen.'],
  en: ['Private contribution card', 'Collaboration outcome', 'Editable author draft', 'The original draft is based on a contribution accepted by its recipient. Its author may have edited the text. This is not independent certification or identity verification.', 'This file has not been published. Before sharing, review the text, private information and other people’s permissions.'],
};
const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// Presentation only: the caller must freshly revalidate the accepted outcome and its session.
export function createResultCard(draft, { language = 'uk', text = draft?.text } = {}) {
  if (!Object.hasOwn(COPY, language) || draft?.kind !== 'private_social_draft' || draft.publishable !== false ||
      draft.trust !== 'same_device_unverified' || draft.proof_scope !== 'participant_attestation') throw Object.assign(new Error('Invalid private result draft'), { code: 'result_card_draft_invalid' });
  if (typeof text !== 'string' || !text.trim() || new TextEncoder().encode(text).byteLength > SESSION_VALUE_LIMITS.maxArchiveBytes) throw Object.assign(new Error('Invalid result card text'), { code: 'result_card_text_invalid' });
  const [title, heading, label, scope, privacy] = COPY[language];
  const html = `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${title} · Synera</title><style>
*{box-sizing:border-box}body{margin:0;padding:clamp(16px,5vw,64px);background:#eef1f8;color:#182239;font:16px/1.65 system-ui,sans-serif}
main{max-width:740px;margin:auto;padding:clamp(22px,5vw,48px);background:white;border:1px solid #d8deed;border-radius:24px;box-shadow:0 18px 60px #17294912}
.brand{letter-spacing:.18em;font-weight:750;color:#4c54a8}.label{display:inline-block;padding:4px 12px;border-radius:30px;background:#edf0ff;color:#343f82;font-size:13px}
h1{font-size:clamp(28px,5vw,42px);line-height:1.2}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;padding:24px 0;border-block:1px solid #e2e6ef}
footer{color:#515d72;font-size:14px}footer p:last-child{font-weight:600}@media print{body{padding:0;background:white}main{border:0;box-shadow:none;max-width:none}}
</style></head><body><main><p class="brand">SYNERA</p><p class="label">${label}</p><h1>${heading}</h1><pre>${escape(text)}</pre><footer><p>${scope}</p><p>${privacy}</p></footer></main></body></html>`;
  return { html, fileName: `synera-result-card-${language}.html`, mimeType: 'text/html;charset=utf-8', scope: 'private_author_draft' };
}
