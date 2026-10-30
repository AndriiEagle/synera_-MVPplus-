import { BOT_PROFILES } from './simulation-personas.mjs';
import { livingFeed, startVisitor, visitorMessage, personaRespond, recordVisitorResult } from './simulation-living.mjs';
import { createJournal } from './journal.mjs';
import { COPY, copy } from './simulation-copy.mjs';
import { mountDeviceControls, inputNotice, demoMarker, DEMO_COPY } from './demo-device-controls.mjs';
import { privacyLinks } from './privacy-common.mjs';
import { mountSovereign } from './sovereign-ui.mjs';
import { demoBalanceContext, demoParties } from './adapt-demo.mjs';
import { adaptCopy, MATCH_COPY } from './adapt-copy.mjs';
import { similarPeople } from './journal-matching.mjs';

const $ = id => document.getElementById(id);
let storage; try { storage = localStorage; } catch {}
const lang = Object.hasOwn(COPY, new URL(location.href).searchParams.get('lang')) ? new URL(location.href).searchParams.get('lang') : (() => { try { return storage?.getItem('synera.real-journey.language.v1') || 'uk'; } catch { return 'uk'; } })();
const t = (key, values) => copy(lang, key, values);
let journal = createJournal(storage), session = null, cursor = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, feedTimer, replyTimer;
const savedSession = journal.entries().findLast(e => e.kind === 'session');
let seed = savedSession?.data.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
let feed = livingFeed(seed, lang);
session = journal.entries('visitor').findLast(e => e.data.state)?.data.state || null;
const root = $('living-simulation'); root.hidden = false;
$('simulation-lab').hidden = true;
document.body.classList.add('living'); document.documentElement.lang = Object.hasOwn(COPY, lang) ? lang : 'uk'; document.title = `Synera · ${t('title')}`;
function el(tag, text, className) {
  const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n;
}
function button(text, handler, id) { const b = el('button', text); b.type = 'button'; if (id) b.id = id; b.addEventListener('click', handler); return b; }
const personName = id => id === 'visitor' ? session?.profile.name || t('you') : BOT_PROFILES.find(p => p.id === id)?.display_name || 'Demo';
function avatar(id) {
  const key = id.replace('bot-', ''), wrap = el('span', undefined, 'living-avatar');
  const fallback = el('span', key.slice(0, 2).toUpperCase()); wrap.append(fallback);
  const img = el('img'); img.alt = ''; img.src = `/persona-${key}.webp`; img.width = img.height = 48;
  img.addEventListener('error', () => img.remove()); img.addEventListener('load', () => { fallback.hidden = true; }); wrap.append(img); return wrap;
}
function bubble(e) {
  const item = el('li', undefined, `living-bubble ${e.actor === 'visitor' ? 'from-visitor' : ''}`);
  const head = el('div', undefined, 'bubble-heading'); if (e.actor !== 'visitor') head.append(avatar(e.actor));
  head.append(el('strong', `${personName(e.actor).replace(' · Demo', '')} · Demo`), el('small', t(e.kind === 'message' ? 'messageKind' : e.kind === 'result' ? 'resultKind' : e.kind)));
  item.append(head, el('p', e.text)); return item;
}
root.innerHTML = `<header class="living-header"><a href="/" class="brand">synera<span>· Demo</span></a><nav id="living-language"><a href="?lang=uk" lang="uk">УКР</a><a href="?lang=de" lang="de">DE</a><a href="?lang=en" lang="en">EN</a></nav><details class="header-preferences"><summary>☰</summary><div class="header-preferences-content"><a data-privacy-link href="/privacy.html"></a></div></details></header>
<main class="living-main"><p class="eyebrow" id="living-eyebrow"></p><h1 id="living-title"></h1><p class="lead" id="living-lead"></p><p class="living-honest" id="living-honest"></p><p id="living-status" role="status"></p>
<nav class="living-tabs"><button type="button" data-view="feed"></button><button type="button" data-view="join"></button><button type="button" data-view="journal"></button></nav>
<section id="living-feed"><h2 id="feed-title"></h2><div id="living-people" class="living-people"></div><div id="feed-controls" class="living-controls"></div><p id="motion-note"></p><p id="feed-progress" role="status"></p><div id="living-threads" class="living-threads"></div></section>
<section id="living-join" hidden><h2 id="who-title"></h2><p id="saved-note"></p><form id="visitor-card" class="living-card"><label><span id="name-label"></span><input name="name" autocomplete="nickname" required></label><label><span id="offers-label"></span><input name="offers" required></label><label><span id="seeks-label"></span><input name="seeks" required></label><label><span id="partner-label"></span><select name="partner"></select></label><p id="local-note"></p><button id="visitor-start" type="submit"></button></form>
<section id="visitor-chat" hidden><h3 id="visitor-title"></h3><div id="visitor-terms" class="living-card"></div><p id="visitor-approvals" role="status"></p><ol id="visitor-messages" class="living-messages" aria-live="polite"></ol><p id="visitor-wait" role="status"></p><button type="button" id="visitor-result" hidden></button><p id="visitor-closed" hidden></p><form id="visitor-composer" class="living-composer"><div id="visitor-chips" class="living-chips"></div><label for="visitor-text" id="message-label"></label><div class="composer-row"><textarea id="visitor-text" rows="2" required></textarea><button type="submit" id="visitor-send"></button></div></form></section></section>
<section id="living-journal" hidden><h2 id="journal-title"></h2><p id="journal-local"></p><div class="living-controls"><label><span id="filter-label"></span><select id="journal-filter"></select></label><button id="journal-export" type="button"></button><button id="journal-print" type="button"></button><button id="journal-erase" type="button" class="quiet"></button></div><p id="journal-empty"></p><ol id="journal-events" class="living-messages"></ol></section>
<footer class="living-footer"><a href="/" id="living-home"></a> · <a href="/studio.html">Studio</a> · <a href="/triangle.html">Triangle</a><p><a href="?lab=1" id="living-lab"></a></p></footer></main>`;
// Preserve the one static scene when the public renderer replaces its own root.
const scene = document.querySelector('figure.scene-simulation');
if (scene) root.querySelector('#living-status').after(scene);
demoMarker(); privacyLinks();
inputNotice($('visitor-card'));
$('visitor-text').setAttribute('aria-describedby',$('visitor-card').querySelector('[data-demo-input-notice]').id);
const controls = mountDeviceControls(root.querySelector('.living-main'));
const adaptText=adaptCopy(lang);
const balanceDemo=el('details',undefined,'living-card');balanceDemo.dataset.demoBalance='';
balanceDemo.append(el('summary',adaptText.demoBalance),el('p',adaptText.demoBalanceNote));
const balanceTarget=el('div');balanceDemo.append(balanceTarget);$('living-feed').append(balanceDemo);
mountSovereign(balanceTarget,demoBalanceContext(lang));
const neutralTarget=el('div');$('visitor-chat').append(neutralTarget);
const similarBox=el('section',undefined,'living-card'),similarLabel=el('label'),similarOpt=el('input'),similarList=el('div');similarOpt.type='checkbox';similarOpt.dataset.similarConsent='';
similarLabel.append(similarOpt,el('span',adaptText.similarConsent));similarBox.append(el('h3',adaptText.similar),similarLabel,el('p',adaptText.similarNote),similarList);$('living-join').append(similarBox);
const matchCopy=MATCH_COPY[lang]||MATCH_COPY.uk,matchingFields={};
const savedMatching=journal.entries('visitor').findLast(e=>e.kind==='matching_profile'&&e.data.ownerId==='visitor')?.data.owner;
for(const key of ['give','need']){
  const label=el('label',matchCopy[key]),select=el('select');select.dataset.matchingField=key;
  const blank=el('option',matchCopy.choose);blank.value='';select.append(blank);
  for(const tag of ['design','sales','automation','finance','video','events','research']){const option=el('option',matchCopy[tag]);option.value=tag;select.append(option);}
  select.value=savedMatching?.[key]?.[0]||'';label.append(select);similarBox.insertBefore(label,similarList);matchingFields[key]=select;
  select.addEventListener('change',()=>{if(similarOpt.checked)add('matching_profile','visitor',matchCopy[key],{source:'visitor',ownerId:'visitor',owner:matchingOwner()});renderSimilar();});
}
function matchingOwner(){return {id:'visitor',give:matchingFields.give.value?[matchingFields.give.value]:[],need:matchingFields.need.value?[matchingFields.need.value]:[],formats:['remote'],limits:[]};}
const useful=button(adaptText.useful,()=>{
  if(session?.status!=='result'||!similarOpt.checked)return;
  const partner=demoParties.find(p=>p.id===session.personId);
  add('result','visitor',adaptText.useful,{source:'visitor',ownerId:'visitor',matchingConsent:true,useful:true,partner});renderSimilar();
});useful.hidden=true;similarBox.append(useful);
similarOpt.checked=journal.entries('visitor').findLast(e=>e.kind==='matching_consent')?.data.enabled===true;
similarOpt.addEventListener('change',()=>{add('matching_consent','visitor',adaptText.similarConsent,{source:'visitor',enabled:similarOpt.checked});if(similarOpt.checked)add('matching_profile','visitor',adaptText.similar,{source:'visitor',ownerId:'visitor',owner:matchingOwner()});renderSimilar();});
function renderSimilar(){
  similarOpt.checked=journal.entries('visitor').findLast(e=>e.kind==='matching_consent')?.data.enabled===true;
  similarList.replaceChildren();useful.hidden=session?.status!=='result'||!similarOpt.checked;
  // Explicit selections only: no extraction of private profile text into tags.
  const owner=matchingOwner();
  const results=similarPeople({owner,candidates:demoParties,journal:journal.entries('visitor'),enabled:similarOpt.checked,lang});
  if(!results.length)similarList.append(el('p',adaptText.similarEmpty));
  for(const r of results){const row=el('article');row.append(el('strong',personName(r.id)),el('p',r.why));similarList.append(row);}
}
renderSimilar();
$('living-honest').setAttribute('data-scripted-label', '');
root.querySelector('.header-preferences summary').setAttribute('aria-label',root.querySelector('[data-privacy-link]').textContent);
for (const [id, key] of Object.entries({ 'living-eyebrow': 'eyebrow', 'living-title': 'title', 'living-lead': 'lead', 'living-honest': 'honest', 'feed-title': 'feed', 'who-title': 'who', 'name-label': 'name', 'offers-label': 'offers', 'seeks-label': 'seeks', 'partner-label': 'partner', 'local-note': 'local', 'visitor-start': 'start', 'message-label': 'message', 'visitor-send': 'send', 'visitor-result': 'record', 'visitor-closed': 'closed', 'journal-title': 'journal', 'journal-local': 'local', 'filter-label': 'filter', 'journal-export': 'export', 'journal-print': 'print', 'journal-erase': 'erase', 'living-home': 'home', 'living-lab': 'lab' })) $(id).textContent = t(key);
$('visitor-text').placeholder = t('placeholder');
$('living-language').setAttribute('aria-label', t('language'));
const profile = journal.profile();
if (profile) { for (const k of ['name', 'offers', 'seeks']) $('visitor-card').elements[k].value = profile[k] || ''; $('saved-note').textContent = t('saved'); }
for (const p of BOT_PROFILES) {
  const option = el('option', `${p.display_name} · ${t(`role_${p.id.replace('bot-', '')}`)}`); option.value = p.id; $('visitor-card').elements.partner.append(option);
  const b = button('', () => { $('visitor-card').elements.partner.value = p.id; view('join'); $('visitor-card').scrollIntoView({ block: 'start' }); });
  b.className = 'living-person'; b.dataset.person = p.id;
  b.append(avatar(p.id), el('strong', p.display_name), el('small', t(`role_${p.id.replace('bot-', '')}`)), el('small', t('waiting'), 'person-activity'));
  $('living-people').append(b);
}
function view(which) {
  for (const tab of root.querySelectorAll('[data-view]')) { const active = tab.dataset.view === which; tab.setAttribute('aria-pressed', String(active)); $(`living-${tab.dataset.view}`).hidden = !active; }
  if (which === 'journal') renderJournal();
}
for (const tab of root.querySelectorAll('[data-view]')) { tab.textContent = t(tab.dataset.view); tab.addEventListener('click', () => view(tab.dataset.view)); }
function status(message) { $('living-status').textContent = message || (!journal.persistent ? t('storageError') : navigator.onLine ? t('online') : t('offline')); }
function add(kind, actor, text, data) { journal.add(kind, actor, text, data); status(); }
const pauseButton = button(t(paused ? 'play' : 'pause'), () => { paused = !paused; scheduleFeed(); }, 'feed-pause');
$('feed-controls').append(pauseButton, button(t('next'), nextEvent, 'feed-next'), button(t('restart'), () => {
  seed = crypto.getRandomValues(new Uint32Array(1))[0]; feed = livingFeed(seed, lang); cursor = 0; $('living-threads').replaceChildren();
  for (const b of root.querySelectorAll('.person-activity')) b.textContent = t('waiting');
  add('session', 'Demo', t('restart'), { source: 'community', seed }); nextEvent(); scheduleFeed();
}, 'feed-restart'));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
function motionChanged() { $('motion-note').textContent = motion.matches ? t('motion') : ''; if (motion.matches) { paused = true; scheduleFeed(); } }
motion.addEventListener('change', motionChanged); motionChanged();
function nextEvent() {
  if (cursor >= feed.length) return;
  const e = feed[cursor++]; let thread = document.getElementById(e.thread);
  if (!thread) {
    const card = el('article', undefined, 'living-card'); card.append(el('h3', e.people.map(p => personName(p).replace(' · Demo', '')).join(' ↔ ') + ' · Demo'));
    thread = el('ol', undefined, 'living-messages'); thread.id = e.thread; card.append(thread); $('living-threads').append(card);
  }
  thread.append(bubble(e));
  for (const id of e.people) root.querySelector(`[data-person="${id}"] .person-activity`).textContent = e.kind === 'result' ? t('resultKind') : t('activity');
  add(e.kind, e.actor, e.text, { source: 'community', thread: e.thread, seed });
  $('feed-progress').textContent = cursor === feed.length ? t('finished') : `${cursor} / ${feed.length}`;
  $('feed-next').disabled = cursor === feed.length;
  if (cursor === feed.length) controls.querySelector('[data-demo-end]').hidden = false;
}
function scheduleFeed() {
  clearTimeout(feedTimer); pauseButton.textContent = t(paused ? 'play' : 'pause'); pauseButton.setAttribute('aria-pressed', String(paused));
  if (!paused && !document.hidden && cursor < feed.length) feedTimer = setTimeout(() => { if (!autoWriteAllowed()) return; nextEvent(); scheduleFeed(); }, 3200);
}
function externalErase() {
  clearTimeout(replyTimer); session = null; paused = true; scheduleFeed(); journal = createJournal(storage);
  $('visitor-card').reset(); similarOpt.checked=false; $('saved-note').textContent = ''; renderVisitor(); renderSimilar(); renderJournal(); status(t('erased'));
}
window.addEventListener('synera:before-device-erase', () => { journal.cancelPending(); clearTimeout(replyTimer); clearTimeout(feedTimer); paused=true; session=null; });
window.addEventListener('synera:device-erased', externalErase);
function autoWriteAllowed() {
  // Storage events can arrive AFTER an already queued timer. Check the key at
  // the write boundary too, so a delayed reply cannot recreate an erased journal.
  try { if (storage && journal.persistent && storage.getItem('synera.journal.v1') === null) { externalErase(); return false; } } catch {}
  return true;
}
function persistMessages(previousCount) {
  for (const m of session.messages.slice(previousCount)) add(m.kind, m.actor, m.text, { source: 'visitor', version: session.version, state: session });
}
function renderVisitor() {
  $('visitor-chat').hidden = !session;
  renderSimilar();
  if (!session) {neutralTarget.replaceChildren();return;}
  $('visitor-title').textContent = `${session.profile.name} ↔ ${personName(session.personId)} · Demo`;
  $('visitor-terms').replaceChildren(el('h4', t('terms')));
  const list = el('dl'); for (const [key, label] of [['scope', 'scope'], ['reward', 'reward'], ['limits', 'limits'], ['meeting', 'time']]) list.append(el('dt', t(label)), el('dd', session.terms[key])); $('visitor-terms').append(list);
  $('visitor-approvals').textContent = `${t('you')}: ${t(session.approvals.visitor ? 'yes' : 'pending')} · ${personName(session.personId)}: ${t(session.approvals.persona ? 'yes' : 'pending')}`;
  $('visitor-messages').replaceChildren(...session.messages.map(bubble));
  const closed = ['declined', 'result'].includes(session.status), busy = Boolean(session.pendingIntent);
  $('visitor-wait').textContent = busy ? `${personName(session.personId)} · ${t('writing')}` : '';
  $('visitor-composer').hidden = closed; $('visitor-closed').hidden = !closed;
  $('visitor-result').hidden = session.status !== 'agreed' || busy;
  for (const b of $('visitor-composer').querySelectorAll('button,textarea')) b.disabled = busy;
  const parties=[{...matchingOwner(),goal:session.terms.scope,limits:[session.terms.limits]},demoParties.find(p=>p.id===session.personId)];
  const collaborationId=`visitor-demo-${session.personId}-${session.seed}`;
  const context={lang,parties,collaborationId,events:session.messages.map((m,i)=>({id:`visitor-${i}`,type:m.kind==='message'?'message':m.kind,actor:m.actor,text:m.text,collaborationId}))};
  mountSovereign(neutralTarget,context,{onPause:()=>{clearTimeout(replyTimer);$('visitor-composer').hidden=true;},onResume:()=>{renderVisitor();scheduleReply();}});
}
function scheduleReply() {
  clearTimeout(replyTimer);
  if (!session?.pendingIntent) return;
  const current = session;
  replyTimer = setTimeout(() => { if (session !== current || !autoWriteAllowed()) return; const count = session.messages.length; session = personaRespond(session, lang); persistMessages(count); renderVisitor(); }, motion.matches ? 0 : 1600);
}
function send(value) {
  if (!session || session.pendingIntent || !value.trim()) return;
  const count = session.messages.length; session = visitorMessage(session, value, lang); persistMessages(count);
  $('visitor-text').value = ''; renderVisitor(); scheduleReply();
}
for (const key of ['accept', 'questionChip', 'scopeChip', 'rewardChip', 'limitsChip', 'timeChip', 'decline']) $('visitor-chips').append(button(t(key), () => send(t(key))));
$('visitor-composer').addEventListener('submit', e => { e.preventDefault(); send($('visitor-text').value); });
$('visitor-card').addEventListener('submit', async e => {
  e.preventDefault(); clearTimeout(replyTimer);
  const form = e.currentTarget, profile = Object.fromEntries(['name', 'offers', 'seeks'].map(k => [k, form.elements[k].value.trim()]));
  if (Object.values(profile).some(v => !v)) return;
  const start = $('visitor-start'); if (start.disabled) return; start.disabled = true;
  try {
    // Store the exact notice visible before this local Demo action; never a cloud grant.
    await journal.addConsent({action:'grant', label:t('consent'), document_text:form.querySelector('[data-demo-input-notice]').textContent + '\n' + $('local-note').textContent,
      document_version:'local-demo-20261029', locale:document.documentElement.lang, purpose:'local-demo', recipient:'this-device', expires_at:null});
  } catch { status(t('storageError')); return; } finally { start.disabled = false; }
  add('profile', 'visitor', t('profileSaved'), { source: 'profile', profile });
  session = startVisitor(form.elements.partner.value, profile, seed, lang); persistMessages(0); renderVisitor();
  $('visitor-chat').scrollIntoView({ block: 'start' });
});
$('visitor-result').addEventListener('click', () => { const count = session.messages.length; session = recordVisitorResult(session, lang); persistMessages(count); renderVisitor(); controls.querySelector('[data-demo-end]').hidden=false; });
for (const key of ['all', 'visitor', 'profile', 'community']) { const option = el('option', t(key)); option.value = key; $('journal-filter').append(option); }
function renderJournal() {
  const entries = journal.entries($('journal-filter').value); $('journal-empty').textContent = entries.length ? '' : t('empty');
  $('journal-events').replaceChildren(...entries.map(e => {
    const n = el('li', undefined, 'living-bubble'), time = el('time', new Date(e.at).toLocaleString(document.documentElement.lang)); time.dateTime = e.at;
    n.append(time, el('strong', `${e.actor === 'visitor' ? t('you') : personName(e.actor)} · ${t(e.kind === 'profile' ? 'profile' : e.kind === 'consent' ? 'consentKind' : e.kind === 'message' ? 'messageKind' : e.kind === 'result' ? 'resultKind' : e.kind)}`), el('p', e.text));
    if (e.data.profile) for (const k of ['name', 'offers', 'seeks']) n.append(el('p', `${t(k)} ${e.data.profile[k]}`)); return n;
  }));
}
$('journal-filter').addEventListener('change', renderJournal);
$('journal-export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([journal.export($('journal-filter').value)], { type: 'application/json' }));
  const a = el('a'); a.href = url; a.download = 'synera-journal.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('journal-print').addEventListener('click', () => { renderJournal(); window.print(); });
$('journal-erase').addEventListener('click', () => {
  if (!confirm(t('eraseAsk'))) return;
  try { journal.erase(); paused = true; clearTimeout(replyTimer); session = null; similarOpt.checked=false; $('visitor-card').reset(); $('saved-note').textContent = ''; renderVisitor(); renderJournal(); scheduleFeed(); status(t('erased')); }
  catch { status(t('storageError')); }
});
window.addEventListener('storage', e => {
  if (e.key !== 'synera.journal.v1' && e.key !== null) return;
  journal.cancelPending();
  journal = createJournal(storage);
  // Erasure in the privacy centre/another tab also cancels pending writers here.
  if (e.newValue === null) {
    externalErase(); return;
  }
  renderJournal(); renderSimilar(); status();
});
document.addEventListener('visibilitychange', scheduleFeed);
window.addEventListener('online', () => status()); window.addEventListener('offline', () => status());
if (!savedSession) add('session', 'Demo', t('session'), { source: 'community', seed });
renderVisitor(); if (session?.pendingIntent) scheduleReply(); nextEvent(); scheduleFeed(); view('feed'); status();
if ('serviceWorker' in navigator) Promise.all([
  navigator.serviceWorker.register('/sw.mjs', { type:'module', updateViaCache:'none' }),
  navigator.serviceWorker.register('/simulation-sw.mjs', { scope: '/simulation' }),
])
  .then(() => navigator.serviceWorker.ready).then(() => {
    // Warm optional portraits AFTER activation, so absent graphics never block the shell.
    for (const p of BOT_PROFILES) fetch(`/persona-${p.id.replace('bot-', '')}.webp`).catch(() => {});
  }).catch(() => {});
// VisualViewport follows the real keyboard; the composer remains in document flow.
function keyboard() { const v = visualViewport; document.documentElement.style.setProperty('--living-keyboard', `${v ? Math.max(0, innerHeight - v.height - v.offsetTop) : 0}px`); }
visualViewport?.addEventListener('resize', keyboard); visualViewport?.addEventListener('scroll', keyboard); keyboard();
