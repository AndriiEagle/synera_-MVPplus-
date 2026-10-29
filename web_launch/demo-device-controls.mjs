import { exportDevice, eraseDevice } from './privacy-device.mjs';
import { PRIVACY_COPY, languageCode } from './privacy-content.mjs';

export const DEMO_COPY = {
  uk: { demo:'DEMO · вигадані персонажі', scripted:'Відповіді за сценарієм · Live AI вимкнено', before:'Чернетки залишаються на цьому пристрої. Можеш використати вигадані дані. Не додавай чужих приватних даних. Завантаження сайту передає хостингу технічні дані з’єднання.', finish:'Завершити демо', end:'Демо завершено. Очистити дані на цьому телефоні? Дані залишаться, доки ти сам не підтвердиш стирання.', keep:'Залишити дані', pilot:'Участь у пілоті · паперова згода' },
  de: { demo:'DEMO · fiktive Personen', scripted:'Antworten nach Skript · Live-KI ausgeschaltet', before:'Entwürfe bleiben auf diesem Gerät. Verwende gerne fiktive Angaben, keine privaten Daten anderer. Beim Laden der Website erhält der Hoster technische Verbindungsdaten.', finish:'Demo beenden', end:'Demo beendet. Daten auf diesem Telefon löschen? Sie bleiben erhalten, bis du die Löschung selbst bestätigst.', keep:'Daten behalten', pilot:'Pilot-Teilnahme · Erklärung auf Papier' },
  en: { demo:'DEMO · fictional people', scripted:'Scripted replies · Live AI off', before:'Drafts stay on this device. Fictional data is fine. Do not enter other people’s private data. Loading the website sends technical connection data to the host.', finish:'Finish Demo', end:'Demo finished. Erase data on this phone? Data stays until you confirm erasure yourself.', keep:'Keep data', pilot:'Pilot participation · paper consent' },
};
const lang = () => languageCode(document.documentElement.lang);
export function mountDeviceControls(target, { draftForm } = {}) {
  const root = document.createElement('section'); root.className = 'demo-device-controls';
  root.innerHTML = '<div class="privacy-actions"><button type="button" data-device-download></button><button type="button" data-device-erase></button><button type="button" data-demo-finish></button></div><div data-demo-end hidden><p></p><button type="button" data-demo-clean></button><button type="button" data-demo-keep></button></div><p role="status" data-device-status></p>';
  target.append(root);
  const status = root.querySelector('[data-device-status]');
  const translate = () => {
    const c = PRIVACY_COPY[lang()], d = DEMO_COPY[lang()];
    root.querySelector('[data-device-download]').textContent = c.download;
    for (const key of ['erase','clean']) root.querySelector(`[data-${key==='erase'?'device-erase':'demo-clean'}]`).textContent = c.erase;
    root.querySelector('[data-demo-finish]').textContent = d.finish;
    root.querySelector('[data-demo-end] p').textContent = d.end;
    root.querySelector('[data-demo-keep]').textContent = d.keep;
  };
  translate(); new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  async function action(button, fn) { button.disabled=true; try { await fn(); } catch { status.textContent=PRIVACY_COPY[lang()].error; } finally {button.disabled=false;} }
  root.querySelector('[data-device-download]').addEventListener('click', e => action(e.currentTarget, async () => {
    const data = await exportDevice();
    if (draftForm) data.unsavedProfileDraft = Object.fromEntries(new FormData(draftForm));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='synera-device.private.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),30000);
    status.textContent=data.unavailable.length?PRIVACY_COPY[lang()].partial+' '+data.unavailable.join(', '):PRIVACY_COPY[lang()].downloaded;
  }));
  const erase = e => action(e.currentTarget, async () => {
    if (!confirm(PRIVACY_COPY[lang()].confirm)) return;
    window.dispatchEvent(new Event('synera:before-device-erase'));
    const result = await eraseDevice();
    window.dispatchEvent(new Event('synera:device-erased'));
    if (draftForm) draftForm.reset();
    status.textContent=result.ok?PRIVACY_COPY[lang()].done:PRIVACY_COPY[lang()].partial+' '+result.unavailable.join(', ');
  });
  root.querySelector('[data-device-erase]').addEventListener('click',erase);
  root.querySelector('[data-demo-clean]').addEventListener('click',erase);
  root.querySelector('[data-demo-finish]').addEventListener('click',()=>{ const end=root.querySelector('[data-demo-end]');end.hidden=false;end.scrollIntoView({block:'nearest'}); });
  root.querySelector('[data-demo-keep]').addEventListener('click',()=>root.querySelector('[data-demo-end]').hidden=true);
  return root;
}
export function inputNotice(form) {
  const note = document.createElement('p'); note.className='demo-input-notice'; note.dataset.demoInputNotice='';
  const id = `demo-input-notice-${document.querySelectorAll('[data-demo-input-notice]').length}`; note.id=id;
  form.prepend(note);
  for (const input of form.querySelectorAll('input:not([type=checkbox]),textarea')) input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'),id].filter(Boolean).join(' '));
  const translate=()=>note.textContent=DEMO_COPY[lang()].before;
  translate(); new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
export function demoMarker() {
  if (document.querySelector('[data-demo-marker]')) return;
  const node=document.createElement('aside');node.className='demo-marker';node.dataset.demoMarker='';
  const translate=()=>node.textContent=DEMO_COPY[lang()].demo;
  document.body.prepend(node);translate();new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
