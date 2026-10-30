import { enhanceVoice, followVoiceLanguage, resetSpeechNotice } from './voice-input.mjs';
import { splitCapture, speechLanguage } from './voice-core.mjs';
import { VOICE_COPY } from './voice-copy.mjs';
import { readInputDraft, writeInputDraft, clearInputDraft, saveProfileDraft, INPUT_DRAFT_PREFIX } from './input-drafts.mjs';
import { createJournal } from './journal.mjs';
const c = () => VOICE_COPY[speechLanguage(document.documentElement.lang)];
let serial = 0;
function el(tag, key) { const n = document.createElement(tag); if (key) { n.dataset.voiceCopy = key; n.textContent = c()[key]; } return n; }
function button(key, handler) { const b = el('button', key); b.type = 'button'; b.addEventListener('click', handler); return b; }
function field(key, id, limit) {
  const label = el('label'), title = el('span', key), input = el('textarea'); input.id = id; input.rows = 2;
  if (limit) input.maxLength = limit;
  label.append(title, input); return { label, input };
}
export function bindInputDraft(input, scope, preserveCurrent = false) {
  const saved = readInputDraft(scope);
  if (preserveCurrent && input.value) writeInputDraft(scope, {text:input.value});
  else if (typeof saved?.text === 'string') input.value = saved.text;
  input.addEventListener('input', () => writeInputDraft(scope, { text: input.value }));
}
function capture(where, name) {
  const previewScope = 'capture-preview:' + name;
  const card = document.querySelector(`[data-quick-capture="${name}"]`) || el('section'); card.className = 'quick-capture'; card.dataset.quickCapture = name; card.setAttribute('translate', 'no');
  const heading = card.querySelector('h2') || el('h2','capture'); heading.id = `capture-title-${name}`; card.setAttribute('aria-labelledby', heading.id);
  const existingInput = card.querySelector(`#capture-${name}`);
  const raw = existingInput ? {input:existingInput,label:existingInput.closest('label')} : field('paragraph', `capture-${name}`);
  const review = card.querySelector('[data-voice-copy="review"]') || el('button','review'); review.type = 'button'; review.disabled = false;
  review.addEventListener('click', () => {
    const parts = splitCapture(raw.input.value); let any = false;
    for (const [key, f] of Object.entries(previews)) { f.input.value = parts[key]; any ||= Boolean(parts[key]); }
    remainder.textContent = parts.unassigned ? `${c().unassigned} ${parts.unassigned}` : '';
    preview.hidden = false; status.textContent = any ? c().replace : c().empty; apply.disabled = !any;
    savePreview();
  });
  bindInputDraft(raw.input, 'capture:' + name, true);
  raw.input.addEventListener('input', () => { preview.hidden = true; clearInputDraft(previewScope); });
  const preview = el('div'); preview.dataset.capturePreview = ''; preview.hidden = true;
  const previews = Object.fromEntries(['offers','seeks','goal'].map(key => {
    const f = field(key, `capture-${name}-${key}`, key === 'goal' ? 240 : 300); f.input.dataset.captureField = key; preview.append(f.label); return [key, f];
  }));
  const remainder = el('p'); remainder.setAttribute('translate','no'); preview.append(remainder);
  const status = card.querySelector('[role="status"]') || el('p'); status.setAttribute('role','status');
  const apply = button('apply', () => {
    if (Object.values(previews).some(f => f.input.value.length > f.input.maxLength)) { status.textContent = c().tooLong; return; }
    document.getElementById('prepare-profile')?.click();
    const form = document.getElementById('profile-form'); if (!form) return;
    for (const [key,f] of Object.entries(previews)) {
      if (!f.input.value) continue;
      form.elements.namedItem(key).value = f.input.value;
      form.elements.namedItem(key).dispatchEvent(new Event('input', { bubbles:true }));
    }
    status.textContent = c().applied; form.elements.namedItem('offers').focus();
  });
  function savePreview() {
    writeInputDraft(previewScope, { source:raw.input.value, fields:Object.fromEntries(Object.entries(previews).map(([key,f])=>[key,f.input.value])) });
  }
  for (const f of Object.values(previews)) f.input.addEventListener('input', savePreview);
  const savedPreview = readInputDraft(previewScope);
  if (savedPreview?.source === raw.input.value && savedPreview.fields) {
    for (const [key,f] of Object.entries(previews)) if (typeof savedPreview.fields[key] === 'string') f.input.value = savedPreview.fields[key];
    preview.hidden = false; apply.disabled = !Object.values(previews).some(f=>f.input.value);
    const unassigned = splitCapture(raw.input.value).unassigned;
    remainder.textContent = unassigned ? `${c().unassigned} ${unassigned}` : '';
    status.textContent = c().replace;
  }
  apply.dataset.captureApply = ''; preview.append(apply);
  const hint = card.querySelector('[data-voice-copy="captureHint"]') || el('p','captureHint');
  const saved = card.querySelector('[data-voice-copy="saved"]') || el('p','saved');
  const focused = document.activeElement === raw.input, selection = [raw.input.selectionStart,raw.input.selectionEnd];
  card.querySelector('[data-voice-placeholder]')?.remove();
  card.append(heading, hint, raw.label, review, preview, status, saved);
  if (!card.isConnected) where(card);
  if (focused) { raw.input.focus(); raw.input.setSelectionRange(...selection); }
  return card;
}
function clearTabDrafts() {
  try { for (const key of Object.keys(sessionStorage).filter(k => k.startsWith(INPUT_DRAFT_PREFIX))) sessionStorage.removeItem(key); } catch {}
  for (const input of document.querySelectorAll('.quick-capture textarea,[data-voice-note],#visitor-text,#visitor-card input,#people-search')) input.value = '';
  for (const preview of document.querySelectorAll('[data-capture-preview]')) preview.hidden = true;
}
export function mountJournalNotes(parent) {
  if (!parent || parent.querySelector('[data-voice-journal]')) return;
  const form = el('form'); form.dataset.voiceJournal = ''; form.setAttribute('translate','no');
  const note = field('notes', 'journal-note', 3000); note.input.dataset.voiceNote = ''; bindInputDraft(note.input, 'journal-note');
  const status = el('p'); status.setAttribute('role','status');
  const save = el('button','noteSave'); save.type = 'submit';
  form.append(note.label, save, status, el('p','saved'));
  form.addEventListener('submit', e => {
    e.preventDefault(); if (!note.input.value.trim()) return;
    let storage; try { storage = localStorage; } catch {}
    const journal = createJournal(storage); journal.add('note','visitor',note.input.value,{ source:'visitor', localOnly:true });
    status.textContent = journal.persistent ? c().noteSaved : c().storageError;
    if (journal.persistent) { note.input.value = ''; clearInputDraft('journal-note'); window.dispatchEvent(new Event('synera:journal-updated')); }
  });
  parent.prepend(form);
}
function translate() {
  for (const n of document.querySelectorAll('[data-voice-copy]')) n.textContent = c()[n.dataset.voiceCopy];
}
const profile = document.getElementById('profile-form');
if (profile) {
  // Text only. Visibility, matching and every consent are deliberately excluded.
  profile.addEventListener('input', () => {
    if (!saveProfileDraft(profile)) saved.textContent = c().storageError;
  });
  const saved = el('p','saved'); saved.className = 'fine'; saved.setAttribute('translate','no'); profile.prepend(saved);
  capture(card => document.querySelector('.draft-entry')?.after(card), 'home');
  capture(card => profile.before(card), 'draft');
  const search = document.getElementById('people-search'); if (search) bindInputDraft(search, 'search');
}
function discover(root) {
  if (root.nodeType !== 1 && root !== document) return;
  enhanceVoice(root === document ? document : root.parentElement || root);
  const journal = document.getElementById('living-journal'); if (journal) mountJournalNotes(journal);
}
discover(document);
translate();
new MutationObserver(records => {
  let changed = false;
  for (const record of records) {
    if (record.type === 'attributes') {
      if (record.target.matches('input,textarea,fieldset') || record.attributeName === 'hidden') changed = true;
    } else for (const added of record.addedNodes) {
      if (added.nodeType === 1 && (added.matches('input,textarea,#living-journal') || added.querySelector('input,textarea,#living-journal'))) changed = true;
    }
  }
  // A view switch changes several hidden attributes. Reconcile once per batch,
  // including the newly visible view and the one that must stop listening.
  if (changed) discover(document);
}).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['disabled','hidden','readonly'] });
new MutationObserver(() => { followVoiceLanguage(); translate(); }).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });
globalThis.addEventListener('synera:before-device-erase', clearTabDrafts);
globalThis.addEventListener('storage', e => { if (e.key === null || (e.key === 'synera.journal.v1' && e.newValue === null)) clearTabDrafts(); });
document.getElementById('voice-reset-notice')?.addEventListener('click', () => {
  try { resetSpeechNotice(); document.getElementById('privacy-status').textContent = c().noticeReset; }
  catch { document.getElementById('privacy-status').textContent = c().storageError; }
});
