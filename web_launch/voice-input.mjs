import { insertPhrase, SPEECH_LOCALES, speechLanguage } from './voice-core.mjs';
import { VOICE_COPY } from './voice-copy.mjs';
export const VOICE_NOTICE_KEY = 'synera.voice.notice.v1';
const NOTICE_VERSION = 'browser-audio-v1';
const entries = new Set(), mounted = new WeakMap();
let active = null, pending = null, dialog, serial = 0;
const uiLanguage = () => speechLanguage(document.documentElement.lang);
const copy = () => VOICE_COPY[uiLanguage()];
const Recognition = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
function storage() { try { return localStorage; } catch { return null; } }
function stopAll() { active?.abort(); pending = null; if (dialog?.open) dialog.close(); }
export function resetSpeechNotice() { stopAll(); const local = storage(); if (!local) throw Error('Storage unavailable'); local.removeItem(VOICE_NOTICE_KEY); }
function node(tag, text, className) { const n = document.createElement(tag); if (text) n.textContent = text; if (className) n.className = className; return n; }
function attribute(n, name, value) { if (n.getAttribute(name) !== value) n.setAttribute(name,value); }
function label(n, value) { if (n.textContent !== value) n.textContent = value; }
function button(text, click) { const b = node('button', text, 'quiet'); b.type = 'button'; b.addEventListener('click', click); return b; }
function ask(start) {
  try { if (storage()?.getItem(VOICE_NOTICE_KEY) === NOTICE_VERSION) { start(); return; } } catch {}
  if (!dialog) {
    dialog = node('dialog'); dialog.id = 'voice-notice'; dialog.setAttribute('aria-labelledby', 'voice-notice-title'); dialog.setAttribute('aria-describedby', 'voice-notice-text');
    dialog.innerHTML = '<h2 id="voice-notice-title"></h2><p id="voice-notice-text"></p><label class="check"><input type="checkbox" id="voice-notice-remember"><span></span></label><div class="actions"></div>';
    dialog.querySelector('.actions').append(button('', () => {
      const run = pending; pending = null;
      if (dialog.querySelector('input').checked) try { storage()?.setItem(VOICE_NOTICE_KEY, NOTICE_VERSION); } catch {}
      dialog.close(); run?.();
    }), button('', () => { pending = null; dialog.close(); }));
    dialog.addEventListener('cancel', () => { pending = null; });
    document.body.append(dialog);
  }
  pending = start; const c = copy();
  dialog.querySelector('h2').textContent = c.noticeTitle; dialog.querySelector('p').textContent = c.notice;
  dialog.querySelector('span').textContent = c.remember; dialog.querySelector('input').checked = false;
  const buttons = dialog.querySelectorAll('button'); buttons[0].textContent = c.allow; buttons[1].textContent = c.cancel;
  dialog.showModal();
}
export function mountVoice(field) {
  if (mounted.has(field) || field.readOnly || !field.matches('textarea,input:not([type]),input[type="text"],input[type="search"]') ||
      field.matches('[inputmode="numeric"],[inputmode="decimal"],[autocomplete="one-time-code"],[data-no-voice]') || /(?:confirmation|json|prompt|token|password|otp)/i.test(field.id + ' ' + field.name)) return;
  if (!field.id) field.id = field.form?.id === 'profile-form' ? `profile-${field.name}` : `voice-field-${++serial}`;
  const title = field.labels?.[0]?.textContent.trim() || field.getAttribute('aria-label') || field.placeholder || copy().paragraph;
  if (!field.labels?.length && !field.hasAttribute('aria-label') && !field.hasAttribute('aria-labelledby')) {
    const visibleLabel = node('label', title, 'voice-field-label'); visibleLabel.htmlFor = field.id; field.before(visibleLabel);
  }
  const bar = node('div', null, 'voice-tools'); bar.dataset.voiceFor = field.id; bar.setAttribute('translate', 'no');
  const mic = button('', () => {
    if (active === entry) { entry.recognition?.stop(); return; }
    if (!Recognition() || !isSecureContext) { field.focus(); status.textContent = copy().fallback; return; }
    ask(start);
  }); mic.dataset.voiceMic = '';
  // A local vector avoids loading a platform emoji font on the first hidden-field reveal.
  const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 24 24'); icon.setAttribute('width','18'); icon.setAttribute('height','18'); icon.setAttribute('aria-hidden','true');
  icon.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></g>';
  const micLabel = node('span'); mic.append(icon,micLabel);
  const languages = node('div', null, 'voice-languages'); languages.setAttribute('role', 'group');
  const undo = button('', () => {
    entry.abort(); const previous = entry.history.pop();
    if (previous && field.value === previous.after) { field.value = previous.before; emit(); }
    update(); field.focus();
  }); undo.dataset.voiceUndo = '';
  const status = node('output', '', 'voice-status'); status.id = `${field.id}-voice-status`; status.setAttribute('aria-live', 'polite');
  field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), status.id].filter(Boolean).join(' '));
  const entry = { field, bar, recognition: null, history: [], lang: uiLanguage(), override: false, abort() {
    const r = entry.recognition; entry.recognition = null; if (active === entry) active = null;
    r?.abort(); status.textContent = ''; update();
  }, update };
  for (const [code, label] of Object.entries({ uk: 'УКР', de: 'DE', en: 'EN' })) {
    const b = button(label, () => { entry.abort(); entry.lang = code; entry.override = true; update(); }); b.dataset.voiceLang = code; languages.append(b);
  }
  function emit() { field.dispatchEvent(new Event('input', { bubbles: true })); }
  function update() {
    const c = copy(), on = active === entry;
    label(micLabel, c[on ? 'stop' : 'mic']); attribute(mic, 'aria-label', `${c[on ? 'stop' : 'mic']}: ${title}`); attribute(mic, 'aria-pressed', String(on));
    const disabled = field.matches(':disabled') || field.readOnly;
    if (mic.disabled !== disabled) mic.disabled = disabled;
    label(undo, '↶ ' + c.undo); if (undo.disabled !== (!entry.history.length || disabled)) undo.disabled = !entry.history.length || disabled;
    attribute(languages, 'aria-label', c.language);
    for (const b of languages.children) { attribute(b, 'aria-pressed', String(b.dataset.voiceLang === entry.lang)); if (b.disabled !== disabled) b.disabled = disabled; }
  }
  function start() {
    if (!field.isConnected || field.matches(':disabled') || field.readOnly || document.hidden || field.closest('[hidden]')) return;
    active?.abort(); active = entry;
    let r; try { r = new (Recognition())(); } catch { active = null; status.textContent = copy().error; update(); return; }
    entry.recognition = r; r.lang = SPEECH_LOCALES[entry.lang]; r.interimResults = true; r.continuous = true;
    let startAt = field.selectionStart ?? field.value.length, endAt = field.selectionEnd ?? startAt, last = field.value;
    const finalIds = new Set();
    r.onresult = e => {
      if (entry.recognition !== r || !field.isConnected || field.matches(':disabled') || field.readOnly || field.closest('[hidden]')) { if (entry.recognition === r) entry.abort(); return; }
      if (field.value !== last) { entry.abort(); return; }
      const interim = [];
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result.isFinal) { interim.push(result[0].transcript); continue; }
        if (finalIds.has(i)) continue; finalIds.add(i);
        const next = insertPhrase(field.value, result[0].transcript, startAt, endAt, field.maxLength);
        if (next.full) { entry.abort(); status.textContent = copy().full; return; }
        if (next.changed) {
          entry.history.push({ before: field.value, after: next.value }); field.value = next.value; last = next.value;
          startAt = next.start; endAt = next.end; emit();
        }
      }
      status.textContent = interim.join(' ') || copy().listening; update();
    };
    r.onerror = () => { if (entry.recognition !== r) return; entry.abort(); status.textContent = copy().error + ' ' + copy().fallback; };
    r.onend = () => { if (entry.recognition !== r) return; entry.recognition = null; if (active === entry) active = null; status.textContent = copy().ready; update(); };
    try { r.start(); status.textContent = copy().listening; } catch { entry.abort(); status.textContent = copy().error; } update();
  }
  field.addEventListener('beforeinput', () => { entry.abort(); entry.history.length = 0; update(); });
  field.addEventListener('input', e => { if (e.isTrusted) { entry.abort(); entry.history.length = 0; update(); } });
  bar.append(mic, languages, undo, status);
  const wrappingLabel = field.closest('label');
  if (wrappingLabel?.control === field) {
    // Extra labelable buttons cannot live inside the input's label. Keep the
    // pair in one grid cell, with an independently reachable toolbar beside it.
    const focused = document.activeElement === field, selection = [field.selectionStart,field.selectionEnd];
    const group = node('div', null, 'voice-field'); wrappingLabel.before(group); group.append(wrappingLabel,bar);
    if (focused) { field.focus(); field.setSelectionRange(...selection); }
  } else field.after(bar);
  mounted.set(field, entry); entries.add(entry); update();
  return entry;
}
export function enhanceVoice(root = document) {
  for (const field of root.querySelectorAll('input,textarea')) mountVoice(field);
  for (const entry of entries) {
    if (!entry.field.isConnected) { entry.abort(); entries.delete(entry); }
    else { if (entry.field.matches(':disabled') || entry.field.readOnly || entry.field.closest('[hidden]')) { if (active === entry) entry.abort(); } entry.update(); }
  }
}
export function followVoiceLanguage() {
  stopAll(); for (const entry of entries) { entry.lang = uiLanguage(); entry.override = false; entry.update(); }
}
globalThis.addEventListener?.('pagehide', stopAll);
globalThis.addEventListener?.('synera:before-device-erase', stopAll);
globalThis.addEventListener?.('storage', e => { if (e.key === VOICE_NOTICE_KEY || e.key === null) stopAll(); });
globalThis.document?.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
