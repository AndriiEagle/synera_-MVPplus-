import { SupabaseStore, ServiceError } from './online-store.mjs';
import { NeonStore } from './neon-store.mjs';
import { cleanProfileFields, createInvitationDraft, createShareCard, parseProfileCsv, profileCompletion, profileSafetyFindings } from './profile-portability.mjs';
import { completeProfileJson as createPortableProfileJson, importCompleteProfile as parseProfileImport } from './profile-package.mjs';
import { normalizeBrief, briefProblems, compareRealProfiles, collaborationDraft, ALL_MODES, CAPABILITIES, CITIES, LANGUAGES, MODES, profileAIPayload, profileAIPrompt, validateAIDraft } from './profile-brief.mjs';
// SYN_CASE_STATE_IMPORTED
import { buildBusinessCase, businessCaseText, createCaseState, approveCase, withdrawApproval, reviseCase, reviewCaseAction, INVALIDATION_MATRIX, caseMaterialProblems, materialTermsFromInput } from './business-case.mjs';
// SYN_INTRODUCTION_GATED
import { reviewIntroduction } from './matching.mjs';
import { createPeopleMap } from './map.mjs';
import { consentRecord } from './pilot-policy.mjs';
import { CHATGPT_PROFILE_PROMPT, summarizeTransfer } from './chatgpt-transfer.mjs';
// SYN_IMPORT: export parsing stays local, deterministic, in-memory only.
import { parseChatGptExport, parseClaudeExport, redactHints, mapHintsToProfileDraft } from './profile-import.mjs';
import { meetingCalendar } from './calendar.mjs';
const $ = selector => document.querySelector(selector);
const form = $('#profile-form');
const callbackUrl = new URL(location.href);
const emailCallback = { hash: callbackUrl.searchParams.get('token_hash'), type: callbackUrl.searchParams.get('type') };
if (emailCallback.hash || callbackUrl.hash || callbackUrl.searchParams.has('error')) history.replaceState(null, '', location.pathname);
let store, config, onlineReady = false, own, people = [], meetings = [], recipient, currentTab = 'profile', busy = false, draft, policyAction;
let importFormat = 'text', importedBrief, pageOffset = 0, morePeople = false, activeChat, safetyPerson, aiPayload, aiSource, aiDraft;
let otpEmail = '', otpConsent = null;
let importSnapshot = '', importRevision = 0;
const labels = { pending: 'Очікує відповіді', accepted: 'Прийнято', declined: 'Відхилено', cancelled: 'Скасовано' };
const peopleMap = createPeopleMap($('#people-map'), person => {
  $('#map-selected').textContent = person.display_name + ' · ' + person.city + ' (центр міста)';
  document.getElementById('person-' + person.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
function message(text, error = false) { $('#notice').textContent = text; $('#notice').classList.toggle('error', error); if (error) $('#notice').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function btn(text, action, quiet = false) { const node = el('button', text, quiet ? 'quiet' : ''); node.type = 'button'; node.addEventListener('click', () => run(action)); return node; }
function closeDialog(selector) { const dialog = $(selector); if (dialog.open) dialog.close(); }
function download(value, name, type) { const url = URL.createObjectURL(new Blob([value], { type })); const link = el('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function safeStorage() { try { return localStorage; } catch { return null; } }
async function copyText(text, selector) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const field = $(selector); if (!field) return false;
    const previous = field.value; field.value = text; field.focus(); field.select();
    try { return document.execCommand('copy'); } catch { return false; } finally { field.value = previous; }
  }
}
function readProfileForm() {
  const data = new FormData(form);
  const profile = cleanProfileFields(Object.fromEntries(data));
  profile.is_discoverable = data.has('is_discoverable');
  profile.map_visible = data.has('map_visible') && profile.is_discoverable;
  // SYN_MODE_DETAILS_COLLECTED
  profile.brief = normalizeBrief({ ...Object.fromEntries(data), offer_tags: data.getAll('offer_tags'), need_tags: data.getAll('need_tags'), languages: data.getAll('languages'), modes: data.getAll('modes'), mode_details: { paid_service: { role: data.get('paid_role') || '' }, referral: { role: data.get('referral_role') || '', benefitTags: data.getAll('referral_benefit_tags'), sourceDeclared: data.has('referral_source_declared'), recipientScopeDeclared: data.has('referral_recipient_scope_declared'), thirdPartyStatus: 'not_consulted' }, hybrid: { components: data.getAll('hybrid_components') } }, max_km: Number(data.get('max_km')), remote: data.has('remote'), confidentiality: data.has('confidentiality'), accepts_confidentiality: data.has('accepts_confidentiality') });
  return profile;
}
// SYN_CONSENT_STATE_BEFORE_USE: declared before the startup await; session restore reads it through fillProfileForm/renderPeople.
const CONSENT_PANEL_DEFAULTS = Object.freeze({ visibility: false, comparison: false, introduction: false, external_ai: false, recording: false, summary: false, analytics_sync: false });
const consentState = { ...CONSENT_PANEL_DEFAULTS };
function fillProfileForm(profile) {
  const clean = cleanProfileFields(profile), brief = normalizeBrief(profile.brief);
  for (const key of ['display_name','city','offers','seeks']) form.elements.namedItem(key).value = clean[key];
  for (const key of ['goal','city_code','max_km','available_from','available_until']) form.elements.namedItem(key).value = brief[key];
  for (const key of ['remote','confidentiality','accepts_confidentiality']) form.elements.namedItem(key).checked = brief[key];
  for (const key of ['offer_tags','need_tags','languages','modes']) form.querySelectorAll('input[name="' + key + '"]').forEach(node => { node.checked = brief[key].includes(node.value); });
  // SYN_MODE_DETAILS_RESTORED
  const details = brief.mode_details;
  if (details) {
    form.elements.namedItem('paid_role').value = details.paid_service?.role || '';
    form.elements.namedItem('referral_role').value = details.referral?.role || '';
    form.elements.namedItem('referral_source_declared').checked = details.referral?.sourceDeclared === true;
    form.elements.namedItem('referral_recipient_scope_declared').checked = details.referral?.recipientScopeDeclared === true;
    form.querySelectorAll('input[name="referral_benefit_tags"]').forEach(node => { node.checked = details.referral?.benefitTags?.includes(node.value) === true; });
    form.querySelectorAll('input[name="hybrid_components"]').forEach(node => { node.checked = details.hybrid?.components?.includes(node.value) === true; });
  }
  form.elements.namedItem('is_discoverable').checked = clean.is_discoverable;
  form.elements.namedItem('map_visible').checked = profile.map_visible === true && clean.is_discoverable;
  // SYN_CONSENT_PANEL_7: the visibility toggle mirrors the domain state, never persists a consent on its own
  consentState.visibility = clean.is_discoverable;
  const visibilityToggle = document.getElementById('consent-visibility');
  if (visibilityToggle) visibilityToggle.checked = clean.is_discoverable;
  renderProfileProgress();
}
function renderProfileProgress() {
  const p = readProfileForm(), missing = briefProblems(p.brief), completion = profileCompletion(p);
  $('#profile-progress').textContent = missing.length ? 'ДО ПУБЛІКАЦІЇ: ЩЕ ' + (missing.length + Number(!p.display_name)) + ' ПУНКТІВ' : 'УМОВИ СПІВПРАЦІ ЗАПОВНЕНО';
  $('#profile-progress').title = [...completion.missing, ...missing].join(' · ');
  // SYN_BRIEF_PROBLEMS_VISIBLE
  briefProblemsList.replaceChildren(...missing.map(item => el('li', item)));
  briefProblemsList.hidden = !missing.length;
  form.elements.namedItem('map_visible').disabled = !p.is_discoverable;
  if (!p.is_discoverable) form.elements.namedItem('map_visible').checked = false;
}
const briefProblemsList = el('ul', undefined, 'brief-problems');
briefProblemsList.id = 'brief-problems';
briefProblemsList.hidden = true;
form.querySelector('.visibility').before(briefProblemsList);
for (const [key, title, choices] of [['offer_tags','Можу дати',CAPABILITIES],['need_tags','Потрібно мені',CAPABILITIES],['languages','Мови розмови',LANGUAGES],['modes','Формати співпраці',ALL_MODES]]) {
  const fieldset = el('fieldset', undefined, 'choice-set'); fieldset.append(el('legend', title));
  for (const [value, title] of Object.entries(choices)) { const label = el('label', undefined, 'check'); const input = el('input'); input.type = 'checkbox'; input.name = key; input.value = value; label.append(input, el('span', title)); fieldset.append(label); }
  $('#brief-fields').append(fieldset);
}
for (const [code, city] of Object.entries(CITIES)) { const option = el('option', city.label); option.value = code; $('#city-code').append(option); }
function importPreviewProfile() { return cleanProfileFields({ display_name: $('#import-display-name').value, city: $('#import-city').value, offers: $('#import-offers').value, seeks: $('#import-seeks').value }); }
function currentPublicUrl() { return config?.publicSiteUrl || (location.protocol === 'https:' ? location.href : ''); }
function applyAuthState() {
  $('#auth-fields').disabled = busy || !onlineReady;
  $('#signup').hidden = config?.backend === 'neon' || !config?.registrationEnabled;
  $('#otp-tools').hidden = config?.backend !== 'neon' || !otpEmail;
  $('#otp-code').required = config?.backend === 'neon' && Boolean(otpEmail);
  if (config?.backend === 'neon') {
    const continuing = Boolean(store?.user);
    $('#auth-title').textContent = continuing ? 'Завершимо вхід' : otpEmail ? 'Перевір свою пошту' : 'Почни зі знайомства';
    $('#auth-step').textContent = continuing ? 'КРОК 3 / 3 · ТВІЙ ПРОФІЛЬ' : otpEmail ? 'КРОК 2 / 3 · ПІДТВЕРДЖЕННЯ' : 'КРОК 1 / 3 · ВХІД';
    $('#auth-submit').textContent = continuing ? 'Продовжити вхід' : otpEmail ? 'Підтвердити код' : 'Отримати код на пошту';
    $('#otp-code').required = Boolean(otpEmail) && !continuing;
    $('#otp-field').hidden = !otpEmail || continuing;
    $('#otp-tools').hidden = !otpEmail || continuing;
  }
  $('#run-ai').disabled = busy || !config?.localAI?.enabled || !$('#ai-consent').checked;
  $('#apply-ai').disabled = busy || !aiDraft || !$('#ai-consent').checked;
  $('#more-people').hidden = !morePeople;
}
async function run(action) {
  if (busy) return;
  // SYN_RUN_KEEPS_GATES: restore each button's own state afterwards. Enabling every button would reopen
  // domain gates (introduction before two approvals, the other party's approval slot).
  const previous = new Map([...document.querySelectorAll('button')].map(b => [b, b.disabled]));
  busy = true; $('#auth-form').setAttribute('aria-busy', 'true'); previous.forEach((_, b) => { b.disabled = true; });
  try { await action(); }
  catch (error) {
    message(error instanceof ServiceError ? error.message : (error?.userMessage || 'Не вдалося завершити дію. Перевір дані та з’єднання. Незбережені поля залишаються у формі.'), true);
    if (error?.status === 402) { onlineReady = false; $('#mode').textContent = 'Вхід тимчасово недоступний'; }
    if (!store?.user && own?.id) showSignedOut();
  } finally { busy = false; $('#auth-form').setAttribute('aria-busy', 'false'); previous.forEach((was, b) => { b.disabled = was; }); applyAuthState(); }
}
function knownError(text) { const error = new Error(text); error.userMessage = text; return error; }
function requireAccount() { if (!store?.user) throw knownError('Це чернетка у вкладці. Для збереження, пошуку людей і зустрічей потрібно увійти.'); }
function tab(name) {
  if (name !== 'profile' && !store?.user) { message('Увійди, щоб перейти до реальних учасників, зустрічей і налаштувань.'); return; }
  currentTab = name;
  for (const value of ['people','profile','meetings','settings']) $('#' + value + '-view').hidden = name !== value;
  document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === name); b.setAttribute('aria-current', b.dataset.tab === name ? 'page' : 'false'); });
  if (name === 'settings') run(renderBlocks);
}
function showWorkspace() { $('#welcome').hidden = true; $('#workspace').hidden = false; $('#logout').hidden = !store?.user; $('#back-login').hidden = Boolean(store?.user); document.body.classList.add('signed-in'); }
function showSignedOut() {
  document.body.classList.remove('signed-in'); $('#workspace').hidden = true; $('#welcome').hidden = false; $('#logout').hidden = true; $('#back-login').hidden = true;
  document.querySelectorAll('dialog').forEach(d => { if (d.open) d.close(); });
  form.reset(); $('#password').value = ''; $('#invite-note').value = ''; $('#people-search').value = '';
  otpEmail = ''; otpConsent = null; $('#otp-code').value = ''; $('#otp-field').hidden = true; $('#email').readOnly = false;
  if (config?.backend === 'neon') $('#auth-submit').textContent = 'Надіслати код';
  for (const selector of ['#profile-import-text','#profile-share-output','#ai-json','#ai-gpt-prompt','#chat-body','#report-detail','#delete-confirmation']) $(selector).value = '';
  $('#import-preview').querySelectorAll('input,textarea').forEach(node => { node.value = ''; });
  for (const selector of ['#people','#meetings','#blocked-people','#chat-messages','#ai-result','#ai-payload','#map-selected']) $(selector).replaceChildren();
  peopleMap.clear(); own = null; people = []; meetings = []; draft = null; aiDraft = aiPayload = aiSource = null; activeChat = safetyPerson = null;
  currentTab = 'profile'; importedBrief = null; pageOffset = 0; morePeople = false;
  caseStates.clear(); caseNotices.clear(); caseTerms.clear();
  $('#map-panel').hidden = true; $('#toggle-map').textContent = 'Показати карту'; $('#toggle-map').setAttribute('aria-expanded','false'); $('#map-roads').textContent = 'Увімкнути OpenStreetMap';
  form.dataset.dirty = ''; renderProfileProgress();
}
async function checkOnline() {
  onlineReady = false; applyAuthState();
  if (!store) { $('#mode').textContent = 'Вхід ще не підключено'; $('#welcome-text').textContent = 'Можна підготувати та завантажити власний профіль. Онлайн-акаунти стануть доступні після налаштування сервісу.'; return; }
  if (config.backend === 'neon' && (!config.realPilotEnabled || !config.pilotSafetyEnabled)) {
    $('#mode').textContent = 'Підключаємо Neon'; $('#welcome-text').textContent = 'Готуємо вхід кодом із пошти. Поки можеш заповнити власний профіль у цій вкладці.';
    message('Вхід відкриється після перевірки нового сервера.'); return;
  }
  try { await store.availability(); }
  catch (error) { $('#mode').textContent = 'Вхід тимчасово недоступний'; $('#welcome-text').textContent = 'База тимчасово не приймає вхід. Ти можеш підготувати власний профіль у вкладці й зберегти копію файлом.'; throw error instanceof ServiceError ? error : knownError('Онлайн-вхід зараз недоступний. Чернетка та імпорт власного профілю працюють у вкладці.'); }
  if (!config.realPilotEnabled || !config.pilotSafetyEnabled) { $('#mode').textContent = 'Готуємо відкриття пілоту'; $('#welcome-text').textContent = 'Онлайн-сервіс відповідає. Реєстрація відкриється після перевірки правил і захисту даних.'; return; }
  onlineReady = true; $('#mode').textContent = 'Приватний пілот'; $('#welcome-text').textContent = 'Увійди за запрошенням. Ми надішлемо одноразовий код на твій email.'; applyAuthState();
}
async function load({ profile = false } = {}) {
  requireAccount();
  const [saved, found, requests] = await Promise.all([store.ownProfile(), store.discover(), store.meetings()]);
  own = saved; people = found; meetings = requests; pageOffset = found.length; morePeople = found.length === 50;
  showWorkspace();
  if (profile) { fillProfileForm(!saved.display_name && draft ? { ...draft, is_discoverable: false, map_visible: false } : saved); form.dataset.dirty = ''; draft = null; }
  renderPeople(); renderMeetings(); tab(currentTab);
}
function publicReason(reason, person) { return reason.replaceAll(own?.id || 'never-id', 'Твій профіль').replaceAll(person.id, person.display_name); }
function openInvite(person, comparison) {
  requireAccount(); if (!own?.display_name) { tab('profile'); throw knownError('Спочатку збережи власний профіль. Показ у загальному пошуку можна залишити вимкненим.'); } recipient = person.id;
  $('#invite-title').textContent = 'Зустріч: ' + person.display_name;
  $('#invite-note').value = collaborationDraft(own, person, comparison) || createInvitationDraft(own, person);
  $('#invite-time').value = ''; $('#invite-dialog').showModal();
}
function openSafety(person) { safetyPerson = person.id; $('#safety-title').textContent = 'Спілкування: ' + person.display_name; $('#report-detail').value = ''; $('#safety-dialog').showModal(); }
// SYN_CASE_V2_RENDERED
let caseStates = new Map(), caseNotices = new Map(), caseEpoch = 0;
// SYN_TERMS_FROM_HUMAN_INPUT: terms typed by this person for a pair; merged into the material, hashed by the domain.
const caseTerms = new Map(), caseTermsOpen = new Set();
const MATERIAL_PROBLEM_LABELS = { 'compensation unresolved': 'винагорода', 'paid service compensation must be explicit money terms': 'для платної послуги — грошова винагорода', 'money amount, currency and invoice choice required': 'сума, валюта і рішення щодо рахунку', 'revision limit unresolved': 'ліміт правок', 'confidentiality unresolved': 'конфіденційність', 'intellectual property unresolved': 'права на результат', 'cancellation unresolved': 'припинення співпраці' };
const UNRESOLVED_LABELS = { amount: 'сума винагороди', currency: 'валюта', invoice: 'рахунок', acceptance: 'критерії прийняття', third_party_consent_verification: 'перевірка згоди третьої сторони', third_party_agreement: 'згода третьої сторони', referral_compensation: 'винагорода за рекомендацію' };
const COMPENSATION_LABELS = { unresolved: 'не погоджено', agreed_exchange: 'обмін послугами', agreed_money: 'грошова оплата', agreed_none: 'без винагороди' };
const TERMS_LABELS = { revision_limit: 'Ліміт правок', confidentiality: 'Конфіденційність', intellectual_property: 'Права на результат', cancellation: 'Припинення співпраці' };
const TERM_VALUE_LABELS = { confidentiality: { unresolved: 'не погоджено', required: 'потрібна', not_required: 'не потрібна' }, intellectual_property: { unresolved: 'не погоджено', giver: 'у сторони, що надає роботу', receiver: 'у отримувача', shared: 'спільно' }, cancellation: { unresolved: 'не погоджено', mutual_written_notice: 'спільне письмове повідомлення', either_party_before_start: 'будь-яка сторона до початку' } };
const CASE_STATUS_LABELS = { draft: 'чернетка', awaiting_approval: 'очікує підтверджень сторін', approved_for_next_step: 'підтверджено обома сторонами · лише наступний крок', revoked: 'відкликано', abandoned: 'залишено' };
const currentApproval = (state, id) => { const record = state?.approvals?.[id]; return Boolean(record && record.version === state.version && record.termsHash === state.termsHash); };
const matrixNotice = reason => { const row = INVALIDATION_MATRIX[reason]; return { clear_both: 'обидва погодження стерто', clear_withdrawing_party: 'погодження стерто лише у відкликаючої сторони', preserve_as_history: 'погодження залишено як історію' }[row.approvals] + '; ' + { block: 'наступний крок заблоковано' }[row.next_action] + '; ' + { increment: 'номер версії піднято', preserve: 'номер версії без змін' }[row.version] + '; ' + { preserve: 'історію збережено' }[row.history] + '.'; };
function caseMaterialFor(person, comparison) {
  const candidate = (comparison.modeCandidates ?? []).find(item => item.status === 'eligible' && ['exchange', 'paid_service', 'referral', 'hybrid'].includes(item.mode));
  if (!candidate) return null;
  const profiles = new Map([[own.id, own], [person.id, person]]);
  const goalOf = id => normalizeBrief(profiles.get(id)?.brief).goal || '';
  const legs = [], seen = new Set();
  const addLeg = (giver, receiver, tag) => { const key = giver + '|' + receiver + '|' + tag; if (!seen.has(key)) { seen.add(key); legs.push({ giver, receiver, tag }); } };
  for (const direction of comparison.directions) for (const item of direction.matched) addLeg(direction.giver, direction.receiver, item.tag);
  if (candidate.mode === 'referral' && Array.isArray(candidate.matchedTags)) for (const tag of candidate.matchedTags) addLeg(candidate.introducer, candidate.seeker, tag);
  for (const leg of candidate.legs ?? []) if (leg.status === 'eligible' && Array.isArray(leg.matchedTags)) for (const tag of leg.matchedTags) addLeg(leg.introducer ?? leg.giver, leg.seeker ?? leg.receiver, tag);
  if (!legs.length) return null;
  const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  const briefs = [own, person].map(profile => normalizeBrief(profile.brief));
  const startsOn = [new Date().toISOString().slice(0, 10), ...briefs.map(brief => day(brief.available_from))].filter(Boolean).sort().at(-1);
  const dueOn = briefs.map(brief => day(brief.available_until)).filter(Boolean).sort()[0];
  if (!startsOn || !dueOn || dueOn < startsOn) return null;
  const target = leg => goalOf(leg.receiver) || 'Покриття потреби: ' + CAPABILITIES[leg.tag];
  return {
    mode: candidate.mode, components: Array.isArray(candidate.components) ? candidate.components : [candidate.mode],
    outcomes: legs.map(leg => ({ receiver_id: leg.receiver, capability_tag: leg.tag, target: target(leg) })),
    trial: { starts_on: startsOn, due_on: dueOn, deliverables: legs.map(leg => ({ giver_id: leg.giver, receiver_id: leg.receiver, capability_tag: leg.tag, target: target(leg), acceptance_criteria: 'Критерій прийняття формулює й підтверджує отримувач до початку проби.' })) },
    ...caseTerms.get(person.id),
  };
}
const caseErrorText = error => {
  const text = String(error?.message || '');
  const missing = text.startsWith('Material terms incomplete: ') ? text.replace('Material terms incomplete: ', '').split('; ').map(problem => MATERIAL_PROBLEM_LABELS[problem] || problem) : [];
  return missing.length ? 'Спершу заповни умови: ' + missing.join(', ') + '.' : 'Дію з чернеткою умов не виконано.';
};
// SYN_CASE_ACTION_NOT_NESTED: btn() already runs this inside run(); a second run() would see busy and drop the click.
function caseAction(personId, action, note) {
  try { action(personId); }
  catch (error) { throw knownError(caseErrorText(error)); }
  renderPeople();
  message(note);
}
function caseSection(person, comparison, businessCase, gate = {}) {
  const box = el('div', undefined, 'case-state'); box.hidden = true; const epoch = caseEpoch;
  (async () => {
    try {
      const material = caseMaterialFor(person, comparison);
      let state = caseStates.get(person.id);
      if (material) {
        const now = new Date().toISOString();
        if (!state) state = await createCaseState({ caseId: ('case-' + person.id).slice(0, 64), participants: [own.id, person.id], material, now, expiresAt: new Date(Date.parse(material.trial.due_on + 'T00:00:00.000Z') + 86400000).toISOString() });
        else {
          const revised = await reviseCase(state, { material, now });
          if (revised.termsHash !== state.termsHash) { state = revised; caseNotices.set(person.id, 'material_change'); }
        }
        if (epoch === caseEpoch) caseStates.set(person.id, state);
      }
      if (epoch !== caseEpoch || !state) return;
      const nameOf = id => id === own.id ? 'Ти' : id === person.id ? person.display_name : id;
      box.replaceChildren();
      const facts = el('div', undefined, 'case-facts');
      facts.append(el('h4', 'Матеріальні умови чернетки · версія ' + state.version + ' · SHA-256: ' + state.termsHash.slice(0, 8)));
      facts.append(el('p', 'Формат: ' + (ALL_MODES[state.material.mode] || state.material.mode), 'fine'));
      for (const outcome of state.material.outcomes) facts.append(el('p', 'Очікуваний результат для ' + nameOf(outcome.receiver_id) + ': ' + CAPABILITIES[outcome.capability_tag] + ' — ' + outcome.target, 'fine'));
      facts.append(el('p', 'Проба: ' + state.material.trial.starts_on + ' → ' + state.material.trial.due_on, 'fine'));
      for (const deliverable of state.material.trial.deliverables) facts.append(el('p', 'Пробний результат від ' + nameOf(deliverable.giver_id) + ' для ' + nameOf(deliverable.receiver_id) + ': ' + CAPABILITIES[deliverable.capability_tag] + ' — ' + deliverable.target, 'fine'));
      const compensation = state.material.compensation;
      facts.append(el('p', 'Винагорода: ' + COMPENSATION_LABELS[compensation.status] + (compensation.status === 'agreed_money' ? ' — ' + compensation.amount_minor + ' ' + compensation.currency + ' (дрібні одиниці), рахунок: ' + (compensation.invoice_required ? 'потрібен' : 'не потрібен') : ''), 'fine'));
      for (const [term, values] of Object.entries(TERM_VALUE_LABELS)) facts.append(el('p', TERMS_LABELS[term] + ': ' + values[state.material.terms[term]], 'fine'));
      facts.append(el('p', TERMS_LABELS.revision_limit + ': ' + (state.material.terms.revision_limit === null ? 'не погоджено' : state.material.terms.revision_limit), 'fine'));
      facts.append(el('p', 'Статус: ' + (CASE_STATUS_LABELS[state.status] || state.status) + ' · ' + state.approvalAttestation, 'fine'));
      box.append(facts);
      const unresolved = [];
      if (state.material.compensation.status === 'unresolved') unresolved.push('винагорода');
      if (state.material.terms.revision_limit === null) unresolved.push('ліміт правок');
      for (const [term] of Object.entries(TERM_VALUE_LABELS)) if (state.material.terms[term] === 'unresolved') unresolved.push(TERMS_LABELS[term].toLocaleLowerCase());
      for (const question of businessCase.unresolved) unresolved.push(UNRESOLVED_LABELS[question] || question);
      if (unresolved.length) {
        const list = el('div', undefined, 'case-unresolved');
        list.append(el('h4', 'Ще не погоджено'));
        for (const item of [...new Set(unresolved)]) list.append(el('p', item, 'fine'));
        box.append(list);
      }
      // SYN_TERMS_FROM_HUMAN_INPUT: every value comes from this person; an empty field stays «не погоджено».
      const current = state.material;
      const termsForm = el('details', undefined, 'case-terms'); termsForm.open = caseTermsOpen.has(person.id);
      termsForm.addEventListener('toggle', () => { if (termsForm.open) caseTermsOpen.add(person.id); else caseTermsOpen.delete(person.id); });
      termsForm.append(el('summary', 'Заповнити умови · вводить лише людина'));
      termsForm.append(el('p', 'Порожнє поле лишається «не погоджено». Будь-яка зміна піднімає версію і стирає обидва підтвердження.', 'fine'));
      const field = (label, control) => { const wrap = el('label', label); wrap.append(control); termsForm.append(wrap); return control; };
      const select = (name, label, options, value) => { const node = el('select'); node.name = name; for (const [key, text] of options) { const option = el('option', text); option.value = key; option.selected = key === value; node.append(option); } return field(label, node); };
      const input = (name, label, value, mode) => { const node = el('input'); node.name = name; node.value = value; node.inputMode = mode; node.placeholder = 'не погоджено'; return field(label, node); };
      const controls = [
        select('compensation_status', 'Винагорода', Object.entries(COMPENSATION_LABELS), current.compensation.status),
        input('amount', 'Сума, якщо винагорода грошова', current.compensation.amount_minor === null ? '' : String(current.compensation.amount_minor / 100), 'decimal'),
        select('currency', 'Валюта', [['', 'не погоджено'], ['CHF', 'CHF'], ['EUR', 'EUR']], current.compensation.currency),
        select('invoice', 'Рахунок', [['', 'не погоджено'], ['yes', 'потрібен'], ['no', 'не потрібен']], current.compensation.invoice_required === null ? '' : current.compensation.invoice_required ? 'yes' : 'no'),
        input('revision_limit', TERMS_LABELS.revision_limit + ' (0–100)', current.terms.revision_limit === null ? '' : String(current.terms.revision_limit), 'numeric'),
        ...Object.entries(TERM_VALUE_LABELS).map(([term, values]) => select(term, TERMS_LABELS[term], Object.entries(values), current.terms[term])),
      ];
      termsForm.append(btn('Оновити умови чернетки', () => caseAction(person.id, key => { caseTerms.set(key, materialTermsFromInput(Object.fromEntries(controls.map(control => [control.name, control.value])))); }, 'Умови чернетки оновлено. Якщо щось змінилося, версію піднято, а обидва підтвердження стерто.')));
      box.append(termsForm);
      const missingTerms = caseMaterialProblems(current).map(problem => MATERIAL_PROBLEM_LABELS[problem] || problem);
      const evidence = el('div', undefined, 'case-evidence');
      evidence.append(el('h4', 'Статус доказів сторін'));
      for (const side of [own.id, person.id]) {
        const provides = businessCase.benefits.some(benefit => benefit.giver === side);
        const receives = businessCase.benefits.filter(benefit => benefit.receiver === side);
        const lines = [];
        if (provides) lines.push('навички: заявлені самою стороною, ще не підтверджені');
        if (receives.some(benefit => benefit.competence === 'third_party_unverified')) lines.push('допомога через третю сторону: не перевірена');
        if (receives.length) lines.push('потреба: не підтверджена; прийняття результату: не отримане');
        evidence.append(el('p', nameOf(side) + ': ' + (lines.join(' · ') || 'заявлених результатів у чернетці немає'), 'fine'));
      }
      box.append(evidence);
      // SYN_APPROVALS_WIRED
      const approvals = el('div', undefined, 'case-approvals');
      approvals.append(el('h4', 'Підтвердження умов · окремо для кожної сторони'));
      if (missingTerms.length) approvals.append(el('p', 'Підтвердити можна, коли заповнено: ' + missingTerms.join(', ') + '.', 'fine'));
      for (const side of [own.id, person.id]) {
        const row = el('p', undefined, 'case-approval');
        row.append(el('span', nameOf(side) + ': ' + (currentApproval(state, side) ? 'умови підтверджені · версія ' + state.approvals[side].version + ' · SHA-256: ' + state.approvals[side].termsHash.slice(0, 8) : state.approvals[side] ? 'відмітка старої версії не діє · умови ще не підтверджені' : 'умови ще не підтверджені')));
        if (side === own.id) {
          if (currentApproval(state, side)) row.append(btn('Відкликати моє підтвердження', () => caseAction(person.id, key => { const next = withdrawApproval(caseStates.get(key), { partyId: own.id, now: new Date().toISOString() }); caseStates.set(key, next); caseNotices.set(key, 'terms_approval_withdrawn'); }, 'Мою відмітку про умови відкликано.'), true));
          else {
            const approve = btn('Підтвердити умови', () => caseAction(person.id, key => { const current = caseStates.get(key); const next = approveCase(current, { partyId: own.id, termsHash: current.termsHash, now: new Date().toISOString() }); caseStates.set(key, next); caseNotices.delete(key); }, 'Твою відмітку про умови збережено в чернетці; наступний крок поки не відкритий.'));
            if (missingTerms.length) { approve.disabled = true; approve.title = 'Спершу заповни: ' + missingTerms.join(', '); }
            row.append(approve);
          }
        } else {
          const foreign = el('button', 'Підтвердить у власному вході', 'quiet'); foreign.type = 'button'; foreign.disabled = true; foreign.title = 'Погодження іншої сторони фіксується тільки у її власному вході; звідси його стан змінити не можна.';
          row.append(foreign);
        }
        approvals.append(row);
      }
      box.append(approvals);
      const notice = caseNotices.get(person.id);
      if (notice) box.append(el('p', 'Наслідок: ' + matrixNotice(notice), 'fine'));
      // SYN_INTRODUCTION_GATED
      if (gate.inviteButton) {
        const gateResult = reviewIntroduction(comparison, { [own.id]: currentApproval(state, own.id), [person.id]: currentApproval(state, person.id) });
        // This async render finishes after renderPeople applied the consent gate, so both conditions are decided here.
        const open = gateResult.allowed && consentState.introduction === true;
        gate.inviteButton.disabled = !open;
        gate.inviteButton.title = open ? '' : gateResult.allowed ? 'Увімкни дозвіл «Введення в розмову» у розділі «Приватність».' : 'Стане активною після підтвердження чернетки умов обома сторонами у власних входах.';
        if (gate.gateNote && open) gate.gateNote.textContent = '';
      }
      box.hidden = false;
    } catch { box.hidden = true; }
  })();
  return box;
}
function renderPeople() {
  const target = $('#people'); target.replaceChildren(); if (!own) return;
  caseEpoch++;
  const query = $('#people-search').value.toLocaleLowerCase().trim();
  const priority = { review_candidate:0, insufficient_mutual_value:1, needs_information:2, incompatible:3, consent_required:4 };
  const rows = people.map(person => ({ person, comparison: compareRealProfiles(own, person) }));
  const ranked = rows
    .filter(({person,comparison}) => (!$('#reciprocal-only').checked || comparison.status === 'review_candidate') && (!query || [person.display_name,person.city,person.offers,person.seeks,person.brief?.goal].join(' ').toLocaleLowerCase().includes(query)))
    .sort((a,b) => priority[a.comparison.status] - priority[b.comparison.status] || a.person.id.localeCompare(b.person.id));
  $('#people-count').textContent = ranked.length + ' з ' + people.length + ' завантажених профілів' + (morePeople ? ' · є наступна сторінка' : '');
  peopleMap.setPeople(ranked.map(row => row.person).filter(p => p.map_visible === true));
  if (!ranked.length) {
    // SYN_COLD_START_EXPLAINED
    const empty = el('div', undefined, 'empty');
    if (!people.length) {
      empty.append(el('h3', 'Нікого ще немає'));
      empty.append(el('p', 'Жодного відкритого профілю інших людей поки не завантажено, тому кандидата теж немає. Перша співпраця починається з двох: запроси колегу створити власний профіль. Після його згоди з’являться причини для розмови.'));
    } else {
      const counts = {};
      for (const { comparison } of rows) counts[comparison.status] = (counts[comparison.status] || 0) + 1;
      const reasons = {
        insufficient_mutual_value: 'немає взаємного покриття заявлених потреб — це не оцінка цінності людини',
        needs_information: 'бракує явних полів умов (мова, формат співпраці, ролі) — кандидат не формується',
        incompatible: 'заявлені ролі або компоненти бізнес-режиму несумісні',
        consent_required: 'хтось зі сторін не дав дозвіл на порівняння профілів',
      };
      empty.append(el('h3', 'Кандидата за поточними умовами немає'));
      for (const status of ['insufficient_mutual_value', 'needs_information', 'incompatible', 'consent_required']) if (counts[status]) empty.append(el('p', counts[status] + ' з профілів: ' + reasons[status] + '.', 'fine'));
      if (counts.review_candidate) empty.append(el('p', 'Є профілі зі статусом кандидата, але їх сховав активний пошук або фільтр сумісності.', 'fine'));
      if (query || $('#reciprocal-only').checked) empty.append(el('p', 'Зміни запит або вимкни фільтр сумісності. Немає збігу за умовами — ще не означає, що ви не знайдете спільної ідеї.', 'fine'));
      empty.append(el('p', 'Це статуси порівняння умов, а не оцінка людей.', 'fine'));
    }
    if (own?.synthetic === true) empty.append(el('p', 'Синтетичний учасник', 'fine'));
    empty.append(btn('Запросити колегу своєю карткою', () => { tab('profile'); openShareDialog(); }, true)); target.append(empty); return;
  }
  for (const {person,comparison} of ranked) {
    const card = el('article', undefined, 'person'); card.id = 'person-' + person.id;
    card.append(el('div', person.display_name.slice(0,1), 'avatar'), el('h3', person.display_name), el('p', person.city || 'Онлайн', 'city'));
    for (const [title,value] of [['МОЖУ ДАТИ',person.offers],['ЗАРАЗ ШУКАЮ',person.seeks],['ПЕРШИЙ РЕЗУЛЬТАТ',person.brief?.goal]]) { const fact=el('div',undefined,'fact'); fact.append(el('small',title),el('span',value || 'Не вказано')); card.append(fact); }
    const fit=el('div',undefined,'fit');
    fit.append(el('strong', comparison.status === 'review_candidate' ? 'Є користь для обох' : 'Що варто уточнити'));
    if (comparison.algorithmic?.status === 'scored' && comparison.algorithmic.mutual_score !== null) {
      fit.append(el('p', `Двостороннє покриття заявлених потреб: ${comparison.algorithmic.mutual_score}/100. Різниця напрямків: ${comparison.algorithmic.asymmetry}/100. Це не оцінка людини, довіри чи доходу.`, 'fine'));
      for (const topic of comparison.algorithmic.topics.slice(0, 3)) fit.append(el('p', topic.text, 'fine'));
    }
    for (const direction of comparison.directions) if (direction.matched.length) fit.append(el('p', (direction.receiver === own.id ? 'Тобі: ' : 'Іншій стороні: ') + direction.matched.map(m => CAPABILITIES[m.tag]).join(', '), 'fine'));
    for (const reason of comparison.reasons.slice(0,3)) fit.append(el('p',publicReason(reason,person),'fine'));
    if (comparison.logistics) fit.append(el('p', comparison.logistics.languages.map(v => LANGUAGES[v]).join(', ') + ' · ' + (comparison.logistics.remote ? 'Онлайн' : comparison.logistics.distanceKm + ' км між містами') + ' · до ' + comparison.logistics.until, 'fine'));
    card.append(fit);
    // SYN_INTRODUCTION_GATED
    const inviteButton = btn('Обговорити співпрацю ↗', () => openInvite(person, comparison));
    inviteButton.disabled = true;
    const gateNote = el('p', 'Чому кнопка вимкнена: введення в розмову відкривається після того, як обидві сторони підтвердять чернетку умов у власних входах. Контакти до двох підтверджень не передаються; автоматичних надсилань немає.', 'fine');
    if (comparison.status === 'review_candidate' && !consentState.comparison) {
      // SYN_CONSENT_PANEL_7: revoke comparison -> case output hidden instantly
      const hidden = el('details', undefined, 'brief-details');
      hidden.append(el('summary', 'Бізнес-кейс сховано дозволом'));
      hidden.append(el('p', 'Порівняння профілів вимкнено у твоїх дозволах. Кейс з’явиться одразу після ввімкнення перемикача «Порівняння профілів» — без збереження й передавання будь-куди.', 'fine'));
      card.append(hidden);
    } else if (comparison.status === 'review_candidate') {
      const details = el('details', undefined, 'brief-details');
      details.append(el('summary', 'Бізнес-кейс: результати, теми й умови'));
      const businessCase = buildBusinessCase(own, person);
      const preview = el('textarea'); preview.readOnly = true; preview.rows = 14;
      preview.setAttribute('aria-label', 'Чернетка бізнес-кейсу з ' + person.display_name);
      preview.value = businessCaseText(businessCase, own.id);
      details.append(preview); card.append(details);
      // SYN_CASE_V2_RENDERED
      card.append(caseSection(person, comparison, businessCase, { inviteButton, gateNote }));
    }
    // SYN_CONSENT_PANEL_7: revoking introduction keeps the invite button disabled
    if (!consentState.introduction) inviteButton.disabled = true;
    // SYN_INTRODUCTION_GATED
    card.append(inviteButton, gateNote, btn('Межі спілкування / скарга',()=>openSafety(person),true));
    target.append(card);
  }
}
const when = value => new Intl.DateTimeFormat('uk-UA',{dateStyle:'medium',timeStyle:'short',timeZoneName:undefined}).format(new Date(value));
function renderMeetings() {
  const target=$('#meetings'); target.replaceChildren(); $('#meeting-count').textContent=meetings.filter(m=>m.status==='pending').length;
  if (!meetings.length) { target.append(el('p','Тут будуть реальні запрошення. Обери людину й запропонуй конкретний час та результат розмови.','empty')); return; }
  for(const meeting of meetings) {
    const incoming=meeting.recipient_id===store.user.id, otherId=incoming?meeting.sender_id:meeting.recipient_id;
    const person=people.find(p=>p.id===otherId) || { id:otherId, display_name:(incoming?meeting.sender_name:meeting.recipient_name) || 'Учасник зустрічі' }, card=el('article',undefined,'meeting');
    card.append(el('p',(incoming?'Вхідний запит':'Твоя пропозиція')+(person?' · '+person.display_name:''),'eyebrow'),el('h3',labels[meeting.status]),el('p',meeting.note));
    if(meeting.proposed_at) card.append(el('p',when(meeting.proposed_at)+' · '+meeting.duration_minutes+' хв · '+meeting.meeting_place+' · '+Intl.DateTimeFormat().resolvedOptions().timeZone,'fine'));
    const actions=el('div',undefined,'actions');
    if(incoming && meeting.status==='pending') for(const [status,title] of [['accepted','Прийняти час і пропозицію'],['declined','Відхилити']]) actions.append(btn(title,async()=>{await store.respond(meeting.id,status);await load();message('Відповідь збережено.');},status==='declined'));
    if(!incoming && ['pending','accepted'].includes(meeting.status)) actions.append(btn('Скасувати зустріч',async()=>{await store.cancelMeeting(meeting.id);await load();message('Зустріч скасовано.');},true));
    if(meeting.status==='accepted') {
      actions.append(btn('Уточнити деталі',async()=>{activeChat=meeting.id;$('#chat-title').textContent=person?'Розмова: '+person.display_name:'Деталі зустрічі';await renderChat();$('#chat-dialog').showModal();}));
      if(meeting.proposed_at) actions.append(btn('До календаря',()=>download(meetingCalendar(meeting),'synera-meeting.ics','text/calendar'),true));
    }
    actions.append(btn('Межі спілкування',()=>openSafety(person || {id:otherId,display_name:'учасник зустрічі'}),true));
    card.append(actions); target.append(card);
  }
}
async function renderChat() {
  const rows=await store.messages(activeChat); const target=$('#chat-messages'); target.replaceChildren();
  if(!rows.length) target.append(el('p','Уточніть посилання або місце й один очікуваний результат.','fine'));
  if(rows.length===100) target.append(el('p','Показано останні 100 повідомлень. Повну копію можна завантажити у розділі «Приватність».','fine'));
  for(const row of rows.toReversed()) { const message=el('article',undefined,'chat-message'); message.append(el('small',(row.sender_id===store.user.id?'Ти':'Співрозмовник')+' · '+when(row.created_at)),el('p',row.body)); target.append(message); }
}
async function renderBlocks() {
  const rows=await store.blocks(), target=$('#blocked-people'); target.replaceChildren();
  if(!rows.length) target.append(el('p','Немає заблокованих учасників.','fine'));
  rows.forEach((row,index)=>{const line=el('p');line.append(el('span','Учасник '+(index+1)+' · '+when(row.created_at)+' '),btn('Розблокувати',async()=>{await store.unblock(row.blocked_id);await renderBlocks();await load();},true));target.append(line);});
}
function requestPolicy(action) { policyAction=action;$('#policy-form').reset();$('#policy-context').textContent='Підтвердження правил зберігається з акаунтом і серверним часом. Публікація вмикається окремо.';$('#policy-dialog').showModal(); }
async function finishOnlineSignIn(accepted) {
  if(!config.realPilotEnabled || !store.pilotSafetyEnabled) { await store.signOut();throw knownError('Пілот потребує перевірки серверного налаштування.'); }
  if(!await store.hasPolicy()) {
    if (accepted) await store.acceptPolicy(accepted);
    else {requestPolicy(async accepted=>{await store.acceptPolicy(accepted);await load({profile:true});tab('profile');message('Правила підтверджено. Заповни власний профіль.');});return;}
  }
  await load({profile:true}); if(!own.display_name)tab('profile');message('Ти увійшов. Зміни профілю зберігаються лише кнопкою «Зберегти».');
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
$('#prepare-profile').addEventListener('click',()=>{showWorkspace();fillProfileForm(draft || {});tab('profile');$('#mode').textContent='Твоя чернетка · у цій вкладці';message('Підготуй власний профіль або перенеси його з файлу. Завантаж JSON перед закриттям вкладки.');});
$('#back-login').addEventListener('click',()=>{draft=readProfileForm();$('#workspace').hidden=true;$('#welcome').hidden=false;$('#back-login').hidden=true;document.body.classList.remove('signed-in');message('Чернетка залишається у вкладці. Після входу перевір її та збережи.');});
$('#check-online').addEventListener('click',()=>run(checkOnline));
$('#policy-cancel').addEventListener('click',()=>{policyAction=null;$('#password').value='';$('#policy-dialog').close();});
$('#policy-dialog').addEventListener('cancel',()=>{policyAction=null;$('#password').value='';});
$('#policy-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{const accepted=consentRecord({terms:$('#accept-terms').checked,privacy:$('#accept-privacy').checked});const action=policyAction;policyAction=null;$('#policy-dialog').close();if(action)await action(accepted);});});
async function sendLoginCode(accepted) {
  const email = $('#email').value.trim();
  await store.requestOtp(email, accepted); otpEmail = email; otpConsent = accepted;
  $('#email').readOnly = true; $('#otp-field').hidden = false; $('#otp-code').value = '';
  $('#welcome-text').textContent = 'Введи 6 цифр з останнього листа. Якщо листа немає, перевір «Спам».';
  applyAuthState(); message('Код надіслано. Відкрий останній лист від Synera / Neon.'); $('#otp-code').focus();
}
function requestLoginCode() {
  if (!$('#email').reportValidity() || !$('#email').value || !config.registrationEnabled) return;
  if (otpConsent && otpEmail === $('#email').value.trim()) { run(() => sendLoginCode(otpConsent)); return; }
  requestPolicy(sendLoginCode);
}
$('#resend-otp').addEventListener('click', requestLoginCode);
$('#change-otp-email').addEventListener('click', () => { otpEmail = ''; otpConsent = null; $('#email').readOnly = false; $('#otp-code').value = ''; $('#otp-field').hidden = true; $('#auth-submit').textContent = 'Надіслати код'; applyAuthState(); $('#email').focus(); });
$('#auth-form').addEventListener('submit',event=>{event.preventDefault();
  if (config?.backend === 'neon') {
    if (!otpEmail && !store.user) { requestLoginCode(); return; }
    run(async()=>{ if (!store.user) { await store.verifyOtp(otpEmail, $('#otp-code').value.trim()); $('#otp-code').value = ''; }
      await finishOnlineSignIn(otpConsent); otpConsent = null; }); return;
  }
  run(async()=>{store.remember($('#remember-session').checked?safeStorage():null);try{await store.signIn($('#email').value.trim(),$('#password').value);}finally{$('#password').value='';}await finishOnlineSignIn();});});
$('#signup').addEventListener('click',()=>{if(!$('#auth-form').reportValidity())return;if($('#password').value.length<12){message('Для нового акаунта потрібен пароль від 12 до 128 символів.',true);return;}requestPolicy(async consent=>{let ready;try{ready=await store.signUp($('#email').value.trim(),$('#password').value,consent);}finally{$('#password').value='';}if(ready){await store.acceptPolicy(consent);await load({profile:true});tab('profile');}message(ready?'Акаунт створено. Перевір профіль і збережи.':'Перевір пошту, підтвердь email і увійди. На першому вході підтвердження правил буде записано з акаунтом.');});});
$('#logout').addEventListener('click',()=>run(async()=>{try{await store.signOut();}finally{showSignedOut();message('Ти вийшов. Дані сесії та форми очищено.');}}));
$('#refresh').addEventListener('click',()=>run(load));
$('#refresh-meetings').addEventListener('click',()=>run(load));
$('#more-people').addEventListener('click',()=>run(async()=>{const next=await store.discover({offset:pageOffset});pageOffset+=next.length;morePeople=next.length===50;people=[...new Map([...people,...next].map(p=>[p.id,p])).values()];renderPeople();}));
$('#people-search').addEventListener('input',renderPeople);$('#reciprocal-only').addEventListener('change',renderPeople);
$('#toggle-map').addEventListener('click',()=>{$('#map-panel').hidden=!$('#map-panel').hidden;$('#toggle-map').setAttribute('aria-expanded',String(!$('#map-panel').hidden));$('#toggle-map').textContent=$('#map-panel').hidden?'Показати карту':'Сховати карту';renderPeople();});
$('#map-zoom-in').addEventListener('click',()=>peopleMap.zoom(1));$('#map-zoom-out').addEventListener('click',()=>peopleMap.zoom(-1));$('#map-reset').addEventListener('click',()=>peopleMap.reset());
$('#map-roads').addEventListener('click',()=>{$('#map-roads').textContent=peopleMap.toggleRoads()?'Вимкнути OpenStreetMap':'Увімкнути OpenStreetMap';});
form.addEventListener('input',()=>{form.dataset.dirty='true';renderProfileProgress();});
$('#city-code').addEventListener('change',()=>{const city=CITIES[$('#city-code').value];if(city)form.elements.namedItem('city').value=city.label;});
form.addEventListener('submit',event=>{event.preventDefault();run(async()=>{requireAccount();const profile=readProfileForm();const missing=briefProblems(profile.brief);if(profile.is_discoverable&&missing.length)throw knownError('Заповни перед публікацією: '+missing.join('; '));await store.saveProfile(profile);await load({profile:true});message(profile.is_discoverable?'Профіль збережено й доступний учасникам.':'Профіль збережено приватно.');});});
$('#invite-cancel').addEventListener('click',()=>$('#invite-dialog').close());
$('#invite-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{await store.invite(recipient,$('#invite-note').value,{proposed_at:$('#invite-time').value,duration_minutes:Number($('#invite-duration').value),meeting_place:$('#invite-place').value});$('#invite-dialog').close();await load();tab('meetings');message('Запрошення збережено. Дочекайся підтвердження іншої сторони.');});});
$('#chat-cancel').addEventListener('click',()=>{$('#chat-body').value='';$('#chat-dialog').close();});$('#refresh-chat').addEventListener('click',()=>run(renderChat));
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{await store.sendMessage(activeChat,$('#chat-body').value);$('#chat-body').value='';await renderChat();});});
$('#safety-cancel').addEventListener('click',()=>$('#safety-dialog').close());
$('#safety-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{await store.report(safetyPerson,$('#report-reason').value,$('#report-detail').value);$('#safety-dialog').close();message('Скаргу збережено для ручного розгляду оператором.');});});
$('#block-person').addEventListener('click',()=>run(async()=>{await store.block(safetyPerson);$('#safety-dialog').close();closeDialog('#chat-dialog');await load();message('Блокування збережено. Нові запрошення й повідомлення між вами припинено.');}));
$('#export-account').addEventListener('click',()=>run(async()=>{const data=await store.exportAccount();download(JSON.stringify(data,null,2),'synera-my-data.private.json','application/json');message('Підготовлено приватний файл твоїх даних. Збережи його на власному пристрої.');}));
$('#delete-profile').addEventListener('click',()=>{$('#delete-confirmation').value='';$('#delete-dialog').showModal();});
$('#delete-cancel').addEventListener('click',()=>$('#delete-dialog').close());
$('#delete-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{if($('#delete-confirmation').value!=='ВИДАЛИТИ')return;await store.deleteProfile();$('#delete-dialog').close();draft=null;await load({profile:true});tab('profile');message('Профіль, зустрічі й повідомлення видалено. Акаунт для входу залишився.');});});
function resetAI() { aiDraft=null;$('#ai-result').replaceChildren();$('#apply-ai').hidden=true;applyAuthState(); }
$('#prepare-ai').addEventListener('click',()=>{
  try {
    aiSource=JSON.stringify(readProfileForm());aiPayload=profileAIPayload(readProfileForm(),{consent:true});resetAI();$('#ai-consent').checked=false;$('#ai-json').value='';$('#ai-status').textContent='';
    $('#ai-payload').textContent=JSON.stringify({offers:aiPayload.offers,seeks:aiPayload.seeks,goal:aiPayload.goal},null,2);
    $('#ai-gpt-prompt').value=profileAIPrompt(aiPayload);
    $('#ai-availability').textContent=config?.localAI?.enabled?'Локальний AI на цьому комп’ютері. Текст не надсилається зовнішньому провайдеру. Рушій перевірить навантаження перед запуском.':'Вбудований AI ще не активований на цьому сервері. Можна використати власний ChatGPT через промпт нижче.';
    $('#ai-dialog').showModal();applyAuthState();
  }catch(error){message(error.message,true);}
});
function acceptAIResult(raw) {
  if(!$('#ai-consent').checked)throw knownError('Підтвердь право й дозвіл обробити показаний текст.');
  if(aiSource!==JSON.stringify(readProfileForm()))throw knownError('Профіль змінився. Закрий AI та підготуй запит ще раз.');
  try { aiDraft=validateAIDraft(raw,aiPayload); } catch(error) { throw knownError(error.message); }
  const target=$('#ai-result');target.replaceChildren();target.append(el('h3','Перевір запропоноване'));
  for(const proof of aiDraft.evidence) {const row=el('label',undefined,'check');const input=el('input');input.type='checkbox';input.name=proof.field==='offers'?'ai-offer':'ai-need';input.value=proof.tag;input.checked=true;row.append(input,el('span',(proof.field==='offers'?'Можу дати: ':'Потрібно: ')+CAPABILITIES[proof.tag]+' — «'+proof.quote+'»'));target.append(row);}
  for(const question of aiDraft.questions)target.append(el('p',question,'fine'));
  target.append(el('p','Цитати підтверджують джерело, але відповідність навички перевіряєш ти. Результат ще не збережено й не опубліковано.','fine'));
  $('#apply-ai').hidden=false;applyAuthState();
}
$('#ai-consent').addEventListener('change',()=>{if(!$('#ai-consent').checked)resetAI();applyAuthState();});
$('#run-ai').addEventListener('click',()=>run(async()=>{
  if(!$('#ai-consent').checked)throw knownError('Підтвердь дозвіл на AI-обробку.');
  $('#ai-status').textContent='AI перевіряє опис. Профіль залишиться незмінним до твого підтвердження.';
  try {
  const response=await fetch('/api/profile-ai',{method:'POST',headers:{'Content-Type':'application/json','X-Synera-Local':config.localAI.nonce},body:JSON.stringify(aiPayload),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(95000)});
  const result=await response.json();
  if(!response.ok)throw knownError(result.message || 'AI недоступний. Форма не змінена.');
  acceptAIResult(result.draft);
  $('#ai-status').textContent='Пропозиції готові для перевірки.';
  } catch(error) { $('#ai-status').textContent=error.userMessage || 'AI зараз недоступний. Можна використати власний ChatGPT або заповнити навички вручну.'; throw error; }
}));
$('#review-ai-json').addEventListener('click',()=>run(()=>{try{acceptAIResult($('#ai-json').value);$('#ai-status').textContent='Відповідь пройшла перевірку формату та цитат. Перевір зміст.';}catch(error){$('#ai-status').textContent=error.userMessage;throw error;}}));
$('#copy-ai-prompt').addEventListener('click',async()=>{message(await copyText($('#ai-gpt-prompt').value,'#ai-gpt-prompt')?'Промпт скопійовано. Встав у власний ChatGPT і поверни тільки JSON.':'Скопіюй промпт із поля вручну.');});
$('#apply-ai').addEventListener('click',()=>{
  if(!aiDraft||!$('#ai-consent').checked||aiSource!==JSON.stringify(readProfileForm())){message('Потрібне актуальне підтверджене прев’ю AI.',true);return;}
  for(const [target,source] of [['offer_tags','ai-offer'],['need_tags','ai-need']]){const selected=[...$('#ai-result').querySelectorAll('input[name="'+source+'"]:checked')].map(n=>n.value);form.querySelectorAll('input[name="'+target+'"]').forEach(n=>{n.checked=selected.includes(n.value);});}
  form.dataset.dirty='true';renderProfileProgress();$('#ai-dialog').close();resetAI();message('Вибрані навички перенесено у форму. Перевір умови й збережи профіль самостійно.');
});
$('#ai-cancel').addEventListener('click',()=>{$('#ai-dialog').close();resetAI();});

function resetImportPreview() { importRevision++; importSnapshot = ''; importedBrief = undefined; $('#import-preview').hidden = true; $('#apply-import').hidden = true; $('#import-brief-summary').replaceChildren(); }
function resetImportSession() {
  resetImportPreview(); importFormat = 'text'; $('#import-status').textContent = '';
  $('#profile-import-text').value = ''; $('#profile-import-text').maxLength = 5000; $('#profile-authorized').checked = false;
  for (const id of ['import-display-name', 'import-city', 'import-offers', 'import-seeks', 'profile-file']) $('#' + id).value = '';
}
function openProfileImport(chatgpt = false) {
  resetImportSession(); $('#profile-source').selectedIndex = 0;
  if (chatgpt) $('#profile-source').value = 'chatgpt';
  updateImportSource(); $('#import-dialog').showModal();
}
$('#import-profile').addEventListener('click', () => openProfileImport());
$('#start-chatgpt-transfer').addEventListener('click', () => openProfileImport(true));
$('#import-cancel').addEventListener('click', () => $('#import-dialog').close());
$('#import-dialog').addEventListener('close', resetImportSession);
$('#parse-profile').addEventListener('click', () => {
  resetImportPreview();
  let result;
  try { result = (importFormat === 'csv' ? parseProfileCsv : parseProfileImport)($('#profile-import-text').value, { authorized: $('#profile-authorized').checked }); }
  catch (error) { $('#import-status').textContent = error.message; $('#import-preview').hidden = true; $('#apply-import').hidden = true; return; }
  $('#import-status').textContent = result.warnings.join(' ') || 'Профіль розібрано. Перевір поля перед застосуванням.';
  $('#import-preview').hidden = !['ready', 'needs_review'].includes(result.status);
  $('#apply-import').hidden = $('#import-preview').hidden;
  if (!$('#import-preview').hidden) {
    importSnapshot = JSON.stringify([importFormat, $('#profile-import-text').value]);
    importedBrief = result.profile.brief;
    $('#import-display-name').value = result.profile.display_name;
    $('#import-city').value = result.profile.city;
    $('#import-offers').value = result.profile.offers;
    $('#import-seeks').value = result.profile.seeks;
    if (importedBrief) {
      $('#import-brief-summary').append(el('h3', 'Умови з відповіді'));
      for (const row of summarizeTransfer(result.profile)) { const item = el('p'); item.append(el('strong', row.label + ': '), el('span', row.value)); $('#import-brief-summary').append(item); }
      $('#import-brief-summary').append(el('p', 'Це пропозиції з ChatGPT. Перевір актуальність; усі умови можна змінити у формі перед збереженням.', 'fine'));
    }
    $('#import-preview').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});
$('#apply-import').addEventListener('click', () => {
  if (!$('#profile-authorized').checked) { $('#import-status').textContent = 'Підтвердь право переносити цей профіль.'; return; }
  if ($('#import-preview').hidden || importSnapshot !== JSON.stringify([importFormat, $('#profile-import-text').value])) { resetImportPreview(); $('#import-status').textContent = 'Відповідь змінилася. Перевір нове прев’ю перед застосуванням.'; return; }
  const profile = { ...importPreviewProfile(), brief: importedBrief }, findings = profileSafetyFindings(profile);
  if (findings.length) { $('#import-status').textContent = 'Прибери email, телефон або ключі з полів перед застосуванням.'; return; }
  if (!profile.display_name || (!profile.offers && !profile.seeks)) { $('#import-status').textContent = 'Потрібне ім’я і хоча б одна конкретна пропозиція або потреба.'; return; }
  fillProfileForm(profile); form.dataset.dirty = 'true'; form.elements.namedItem('is_discoverable').checked = false; $('#profile-import-text').value = ''; $('#profile-authorized').checked = false; resetImportPreview(); $('#import-dialog').close(); message('Поля й умови заповнено з імпорту. Видимість вимкнена. Перевір і натисни «Зберегти профіль».');
});
function openShareDialog() {
  try {
    const profile = readProfileForm();
    $('#profile-share-output').value = createShareCard(profile, { publicUrl: currentPublicUrl() });
    $('#share-status').textContent = 'Це ручна картка для знайомства. JSON переносить профіль назад у Synera; видимість після імпорту вимкнена.';
    $('#share-dialog').showModal();
  } catch (error) {
    message(error.message === 'Profile name is required' ? 'Спочатку заповни ім’я профілю.' : 'Прибери приватні контакти або ключі перед поширенням.', true);
  }
}
$('#export-profile').addEventListener('click', openShareDialog);
$('#share-profile').addEventListener('click', openShareDialog);
$('#share-cancel').addEventListener('click', () => $('#share-dialog').close());
$('#copy-share-card').addEventListener('click', async () => { $('#share-status').textContent = await copyText($('#profile-share-output').value, '#profile-share-output') ? 'Текст картки скопійовано.' : 'Скопіюй текст із поля вручну.'; });
$('#copy-profile-json').addEventListener('click', async () => {
  try { $('#share-status').textContent = await copyText(createPortableProfileJson(readProfileForm()), '#profile-share-output') ? 'JSON профілю скопійовано.' : 'Скопіюй JSON вручну.'; }
  catch { $('#share-status').textContent = 'Прибери приватні контакти або ключі перед експортом JSON.'; }
});
$('#native-share-profile').addEventListener('click', async () => {
  if (!navigator.share) { $('#share-status').textContent = await copyText($('#profile-share-output').value, '#profile-share-output') ? 'Web Share недоступний. Текст скопійовано.' : 'Web Share недоступний. Скопіюй текст вручну.'; return; }
  try { await navigator.share({ title: 'Synera profile', text: $('#profile-share-output').value }); $('#share-status').textContent = 'Системне вікно поширення відкрито.'; }
  catch { $('#share-status').textContent = 'Поширення скасовано або недоступне. Можна скопіювати текст.'; }
});

// Local file transfer and a selective ChatGPT prompt use the existing preview flow.
const importTools = el('div', undefined, 'import-tools');
const fileLabel = el('label', 'Обрати свій файл: Profile.csv, .json або .txt');
const fileInput = el('input'); fileInput.type = 'file'; fileInput.id = 'profile-file'; fileInput.accept = '.csv,.json,.txt'; fileLabel.append(fileInput);
const promptDetails = el('section', undefined, 'chatgpt-guide'); promptDetails.id = 'chatgpt-guide'; promptDetails.hidden = true;
promptDetails.append(el('h3', 'Твій ChatGPT → твій профіль'));
promptDetails.append(el('p', 'Synera не читає пам’ять твого ChatGPT. Попроси свій звичайний чат скласти професійну чернетку з того, що йому доступно. Передай сюди лише результат.', 'fine'));
const transferSteps = el('ol', undefined, 'transfer-steps');
for (const [title, hint] of [['Скопіюй завдання', 'Готова інструкція — без твоїх особистих даних.'], ['Встав у свій ChatGPT', 'У звичайний чат із доступною пам’яттю або в розмову, де ти вже розповідав про себе.'], ['Поверни відповідь сюди', 'Встав JSON нижче. Synera розбере поля, а ти перевіриш чернетку.']]) { const li = el('li'); li.append(el('strong', title), el('span', hint)); transferSteps.append(li); }
promptDetails.append(transferSteps);
const transferActions = el('div', undefined, 'actions');
const copyPromptButton = btn('1. Скопіювати завдання', async () => { const copied = await copyText(CHATGPT_PROFILE_PROMPT, '#gpt-profile-prompt'); $('#import-status').textContent = copied ? 'Скопійовано. Відкрий свій ChatGPT і встав завдання. Потім поверни лише відповідь JSON.' : 'Копіювання недоступне. Відкрий текст завдання нижче й скопіюй вручну.'; if (!copied) promptDisclosure.open = true; }); copyPromptButton.id = 'copy-chatgpt-transfer';
const openChatGPT = el('a', '2. Відкрити ChatGPT ↗', 'button-link quiet'); openChatGPT.href = 'https://chatgpt.com/'; openChatGPT.target = '_blank'; openChatGPT.rel = 'noopener noreferrer';
transferActions.append(copyPromptButton, openChatGPT); promptDetails.append(transferActions);
const promptDisclosure = el('details'); promptDisclosure.append(el('summary', 'Переглянути завдання'));
const promptText = el('textarea'); promptText.id = 'gpt-profile-prompt'; promptText.setAttribute('aria-label', 'Завдання для твого ChatGPT'); promptText.readOnly = true; promptText.value = CHATGPT_PROFILE_PROMPT; promptText.rows = 6; promptDisclosure.append(promptText); promptDetails.append(promptDisclosure);
const importHint = el('p', 'LinkedIn: Settings & Privacy → Data privacy → Get a copy of your data. Вибери власний Profile.csv. Повний архів, контакти й посилання на чужі профілі не імпортуються.', 'fine');
importTools.append(promptDetails, fileLabel, importHint); $('#profile-source').closest('label').after(importTools);
importTools.before($('#profile-authorized').closest('label'));
const gptOption = el('option', 'Мій ChatGPT'); gptOption.value = 'chatgpt'; $('#profile-source').append(gptOption);
function updateImportSource() {
  const fromChatGPT = $('#profile-source').value === 'chatgpt';
  promptDetails.hidden = !fromChatGPT; fileLabel.hidden = fromChatGPT; importHint.hidden = fromChatGPT;
  $('#paste-chatgpt-response').hidden = !fromChatGPT;
  $('#profile-import-text').placeholder = fromChatGPT ? 'Встав сюди відповідь JSON із твого ChatGPT…' : 'Name: ...\nCity: ...\nI can help with: ...\nLooking for: ...';
}
$('#paste-chatgpt-response').addEventListener('click', async () => {
  if (!$('#profile-authorized').checked) { $('#import-status').textContent = 'Спочатку підтвердь право перенести ці дані.'; return; }
  const revision = importRevision;
  try {
    const text = await navigator.clipboard.readText();
    if (!$('#profile-authorized').checked || revision !== importRevision) return;
    if (text.length > 5000) { $('#import-status').textContent = 'Відповідь завелика. Потрібен короткий профіль JSON, а не вся переписка.'; return; }
    resetImportPreview(); importFormat = 'text'; $('#profile-import-text').value = text; $('#parse-profile').click();
  } catch { $('#import-status').textContent = 'Натисни на поле відповіді й вибери «Вставити» або Ctrl+V.'; $('#profile-import-text').focus(); }
});
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]; if (!file) return;
  resetImportPreview(); const revision = importRevision;
  if (!$('#profile-authorized').checked) { $('#import-status').textContent = 'Спочатку підтвердь право на перенесення, потім вибери файл.'; fileInput.value = ''; return; }
  const csv = /\.csv$/i.test(file.name);
  if (!/\.(csv|json|txt)$/i.test(file.name) || file.size > (csv ? 50000 : 10000)) { $('#import-status').textContent = 'Вибери короткий профіль: CSV до 50 KB або JSON/TXT до 10 KB. Повний архів акаунта не підходить.'; fileInput.value = ''; return; }
  const text = await file.text(); if (!$('#profile-authorized').checked || revision !== importRevision) return;
  importFormat = csv ? 'csv' : 'text'; $('#profile-import-text').maxLength = csv ? 50000 : 5000; $('#profile-import-text').value = text;
  $('#parse-profile').click(); fileInput.value = '';
});
$('#profile-import-text').addEventListener('input', resetImportPreview);
$('#profile-import-text').addEventListener('paste', () => { setTimeout(() => { if ($('#profile-authorized').checked) $('#parse-profile').click(); }, 0); });
$('#profile-source').addEventListener('change', () => { importFormat = 'text'; $('#profile-import-text').maxLength = 5000; resetImportPreview(); updateImportSource(); });
$('#profile-authorized').addEventListener('change', () => { if (!$('#profile-authorized').checked) resetImportPreview(); });
$('#share-dialog .actions').append(btn('Завантажити JSON', () => {
  const blob = new Blob([createPortableProfileJson(readProfileForm())], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const link = el('a'); link.href = url; link.download = 'synera-profile.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}, true));

// SYN_IMPORT_UI_CONFIRMED: local import of a ChatGPT / Claude memory export into the profile form.
// Flow: file/drop → parse → redact → per-field checkboxes → confirm → existing fillProfileForm path.
// In-memory only: no network, no model calls, no autosave; the user saves with the existing save button.
// The flag is a code constant, default OFF; nothing in localStorage, URL or config may enable it.
const AI_MEMORY_IMPORT_ENABLED = false;
if (AI_MEMORY_IMPORT_ENABLED) {
  const MEMORY_IMPORT_PARSERS = { chatgpt: parseChatGptExport, claude: parseClaudeExport };
  const MAX_MEMORY_IMPORT_BYTES = 40000, MAX_MEMORY_IMPORT_CHARS = 20000;
  const MEMORY_ROLE_LABELS = { buyer: 'покупець', supplier: 'постачальник', introducer: 'рекомендую (інтродюсер)', seeker: 'шукаю рекомендацію' };
  const memoryButton = $('#ai-memory-import'); memoryButton.hidden = false;
  const memoryDialog = el('dialog'); memoryDialog.id = 'ai-memory-import-dialog';
  const memoryForm = el('form'); memoryDialog.append(memoryForm);
  memoryForm.append(el('p', 'ПЕРЕНЕСТИ З ІНШОГО АСИСТЕНТА', 'eyebrow'), el('h2', 'Імпорт з ChatGPT / Claude'));
  memoryForm.append(el('p', 'Файл читається лише в пам’яті цієї вкладки: без мережі, без моделей, без збереження. Експорт — це дані, а не інструкції. Після підтвердження ти сам зберігаєш профіль кнопкою «Зберегти профіль».', 'fine'));
  const memorySource = el('select'); memorySource.id = 'ai-memory-source';
  for (const [value, title] of [['chatgpt', 'Експорт з ChatGPT'], ['claude', 'Експорт з Claude']]) { const option = el('option', title); option.value = value; memorySource.append(option); }
  const sourceLabel = el('label', 'Джерело'); sourceLabel.append(memorySource); memoryForm.append(sourceLabel);
  const memoryFile = el('input'); memoryFile.type = 'file'; memoryFile.id = 'ai-memory-file'; memoryFile.accept = '.json,.txt';
  const memoryFileLabel = el('label', 'Вибрати файл .json або .txt'); memoryFileLabel.append(memoryFile); memoryForm.append(memoryFileLabel);
  const memoryDrop = el('div', '…або перетягни файл сюди', 'fine'); memoryDrop.id = 'ai-memory-drop';
  memoryDrop.style.cssText = 'border:1px dashed currentcolor;border-radius:6px;padding:8px;text-align:center;cursor:pointer;';
  memoryForm.append(memoryDrop);
  const memoryStatus = el('p', undefined, 'fine'); memoryStatus.id = 'ai-memory-status'; memoryStatus.setAttribute('role', 'status'); memoryStatus.setAttribute('aria-live', 'polite');
  memoryForm.append(memoryStatus);
  const memoryPreview = el('fieldset'); memoryPreview.id = 'ai-memory-preview'; memoryPreview.hidden = true;
  memoryPreview.append(el('legend', 'Ось що ми зрозуміли'));
  const memoryFields = el('div'); memoryFields.id = 'ai-memory-fields'; memoryPreview.append(memoryFields);
  memoryForm.append(memoryPreview);
  const memoryActions = el('div', undefined, 'actions');
  const memoryConfirm = el('button', 'Підтвердити'); memoryConfirm.type = 'submit'; memoryConfirm.id = 'ai-memory-confirm'; memoryConfirm.hidden = true;
  const memoryCancel = el('button', 'Закрити', 'quiet'); memoryCancel.type = 'button'; memoryCancel.id = 'ai-memory-cancel';
  memoryActions.append(memoryConfirm, memoryCancel); memoryForm.append(memoryActions);
  document.body.append(memoryDialog);

  let memoryDraft = null;
  function resetMemoryImport() { memoryDraft = null; memoryStatus.textContent = ''; memoryPreview.hidden = true; memoryConfirm.hidden = true; memoryFields.replaceChildren(); memoryFile.value = ''; }
  memoryDialog.addEventListener('close', resetMemoryImport);
  memoryCancel.addEventListener('click', () => memoryDialog.close());
  function memoryFieldRows(draft) {
    const rows = [];
    for (const tag of draft.offer_tags) rows.push(['offer_tags:' + tag, 'Можу дати: ' + CAPABILITIES[tag]]);
    for (const tag of draft.need_tags) rows.push(['need_tags:' + tag, 'Потрібно мені: ' + CAPABILITIES[tag]]);
    for (const code of draft.languages) rows.push(['languages:' + code, 'Мова розмови: ' + LANGUAGES[code]]);
    if (draft.city_code) rows.push(['city_code:' + draft.city_code, 'Місто: ' + CITIES[draft.city_code].label]);
    for (const mode of draft.modes) rows.push(['modes:' + mode, 'Формат співпраці: ' + ALL_MODES[mode]]);
    if (draft.mode_details?.paid_service?.role) rows.push(['paid_role:' + draft.mode_details.paid_service.role, 'Роль у платній послузі: ' + MEMORY_ROLE_LABELS[draft.mode_details.paid_service.role]]);
    if (draft.mode_details?.referral?.role) rows.push(['referral_role:' + draft.mode_details.referral.role, 'Роль у рекомендації: ' + MEMORY_ROLE_LABELS[draft.mode_details.referral.role]]);
    for (const component of draft.mode_details?.hybrid?.components ?? []) rows.push(['hybrid_component:' + component, 'Компонент змішаного формату: ' + ALL_MODES[component]]);
    return rows;
  }
  function parseMemoryExport(text) {
    resetMemoryImport();
    const parsed = MEMORY_IMPORT_PARSERS[memorySource.value](text);
    const { hints, blockedSecrets } = redactHints(parsed);
    // Secrets gate: any blocked secret stops the import before mapping; nothing is kept or filled.
    if (blockedSecrets.length) { memoryStatus.textContent = 'Ризик секретів — імпорт зупинено. Нічого не зберігається й не заповнюється.'; return; }
    const draft = mapHintsToProfileDraft({ ...hints, warnings: parsed.warnings });
    const rows = memoryFieldRows(draft);
    if (!rows.length) { memoryStatus.textContent = draft.warnings.join(' ') || 'У експорті немає полів, які пілот вміє перенести. Заповни профіль вручну.'; return; }
    memoryDraft = draft;
    for (const [value, label] of rows) {
      const row = el('label', undefined, 'check'); const input = el('input'); input.type = 'checkbox'; input.value = value; input.checked = true;
      row.append(input, el('span', label)); memoryFields.append(row);
    }
    if (draft.warnings.length) memoryPreview.append(el('p', draft.warnings.join(' '), 'fine'));
    memoryPreview.hidden = false; memoryConfirm.hidden = false;
    memoryStatus.textContent = 'Зніми позначки з полів, які не підтверджуєш. Підтвердження лише заповнить форму — збереження буде окремим кроком.';
  }
  async function readMemoryFile(file) {
    if (!file) return;
    if (file.size > MAX_MEMORY_IMPORT_BYTES) { memoryStatus.textContent = 'Файл завеликий. Потрібен короткий експорт профілю, а не повний архів акаунта.'; return; }
    const text = await file.text();
    if (text.length > MAX_MEMORY_IMPORT_CHARS) { memoryStatus.textContent = 'Експорт завеликий. Потрібен короткий JSON-профіль до 20 000 символів.'; return; }
    parseMemoryExport(text);
  }
  function confirmedMemoryBrief(checked) {
    const brief = { offer_tags: [], need_tags: [], languages: [], city_code: '', modes: [] };
    const roles = {}, components = [];
    for (const entry of checked) {
      const splitAt = entry.indexOf(':'), path = entry.slice(0, splitAt), value = entry.slice(splitAt + 1);
      if (path === 'offer_tags') brief.offer_tags.push(value);
      else if (path === 'need_tags') brief.need_tags.push(value);
      else if (path === 'languages') brief.languages.push(value);
      else if (path === 'city_code') brief.city_code = value;
      else if (path === 'modes') brief.modes.push(value);
      else if (path === 'paid_role') roles.paid = value;
      else if (path === 'referral_role') roles.referral = value;
      else if (path === 'hybrid_component') components.push(value);
    }
    if (roles.paid || roles.referral || components.length) brief.mode_details = { paid_service: { role: roles.paid || '' }, referral: { role: roles.referral || '', benefitTags: [], sourceDeclared: false, recipientScopeDeclared: false }, hybrid: { components } };
    return brief;
  }
  memoryForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!memoryDraft) { memoryStatus.textContent = 'Спочатку вибери або перетягни файл експорту.'; return; }
    const checked = [...memoryFields.querySelectorAll('input:checked')].map(node => node.value);
    if (!checked.length) { memoryStatus.textContent = 'Познач хоча б одне поле, яке підтверджуєш, або закри імпорт.'; return; }
    fillProfileForm({ ...readProfileForm(), brief: confirmedMemoryBrief(checked) });
    form.elements.namedItem('is_discoverable').checked = false;
    form.dataset.dirty = 'true';
    renderProfileProgress();
    memoryDialog.close();
    message('Підтверджені поля заповнено у формі, видимість вимкнена. Автозбереження немає: перевір дані та збережи профіль кнопкою «Зберегти профіль».');
  });
  memoryFile.addEventListener('change', () => { readMemoryFile(memoryFile.files?.[0]).catch(() => { memoryStatus.textContent = 'Не вдалося прочитати файл.'; }); });
  for (const type of ['dragover', 'dragenter']) memoryDrop.addEventListener(type, event => event.preventDefault());
  memoryDrop.addEventListener('drop', event => {
    event.preventDefault();
    readMemoryFile(event.dataTransfer?.files?.[0]).catch(() => { memoryStatus.textContent = 'Не вдалося прочитати файл.'; });
  });
  memoryButton.addEventListener('click', () => { resetMemoryImport(); memoryDialog.showModal(); });
}

const rememberLabel = el('label', undefined, 'check'); const rememberInput = el('input'); rememberInput.type = 'checkbox'; rememberInput.id = 'remember-session';
rememberLabel.append(rememberInput, el('span', 'Запам’ятати на цьому особистому пристрої')); $('#auth-fields').append(rememberLabel);
const forgotPassword = btn('Забув пароль', async () => {
  if (!$('#email').reportValidity() || !$('#email').value) return;
  await store.requestPasswordReset($('#email').value.trim()); message('Якщо адреса зареєстрована, перевір пошту для відновлення пароля.');
}, true); $('#auth-fields').append(forgotPassword);
const recoveryDialog = el('dialog'); recoveryDialog.id = 'recovery-dialog'; const recoveryForm = el('form');
const recoveryLabel = el('label', 'Новий пароль (12–128 символів)'); const recoveryInput = el('input'); recoveryInput.type = 'password'; recoveryInput.autocomplete = 'new-password'; recoveryInput.minLength = 12; recoveryInput.maxLength = 128; recoveryInput.required = true; recoveryLabel.append(recoveryInput);
const recoverySubmit = el('button', 'Зберегти новий пароль'); recoverySubmit.type = 'submit'; recoveryForm.append(el('h2', 'Відновити доступ'), recoveryLabel, recoverySubmit); recoveryDialog.append(recoveryForm); document.body.append(recoveryDialog);
recoveryForm.addEventListener('submit', event => { event.preventDefault(); run(async () => { try { await store.updatePassword(recoveryInput.value); } finally { recoveryInput.value = ''; } recoveryDialog.close(); await store.signOut(); showSignedOut(); message('Пароль змінено. Увійди з новим паролем.'); }); });
recoveryDialog.addEventListener('cancel', () => run(async () => { recoveryInput.value = ''; await store.signOut(); showSignedOut(); }));


try {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuration unavailable');
  config = await response.json();
  store = config.backend === 'neon' ? new NeonStore(config) : config.supabaseUrl ? new SupabaseStore(config) : null;
  if (config.backend === 'neon') {
    $('#password').required = false; $('#password').closest('label').hidden = true;
    $('#auth-submit').textContent = 'Надіслати код'; rememberLabel.hidden = true; forgotPassword.hidden = true;
    $('#session-hint').textContent = 'Вхід кодом із email. На спільному пристрої натискай «Вийти» після роботи.';
  }
  $('#registration-note').textContent = config.registrationEnabled ? 'Реєстрація відкрита. Для нового акаунта потрібні підтвердження email і пароль від 12 символів.' : 'Реєстрація закрита до завершення перевірки сервісу.';
  if (config.backend === 'neon') $('#registration-note').textContent = config.registrationEnabled ? 'Пароль не потрібен. Профіль прихований, доки ти сам не ввімкнеш його видимість.' : 'Готуємо вхід. Можна вже заповнити власну чернетку.';
  await run(async () => {
    await checkOnline();
    if (!onlineReady) return;
    if (emailCallback.hash) {
      await store.verifyEmailToken(emailCallback.hash, emailCallback.type); emailCallback.hash = null;
      if (emailCallback.type === 'recovery') recoveryDialog.showModal(); else await finishOnlineSignIn();
    } else {
      const storage = safeStorage();
      if ((storage || config.backend === 'neon') && await store.restore(storage)) await finishOnlineSignIn();
    }
  });
} catch { $('#mode').textContent = 'Немає з’єднання'; message('Налаштування входу недоступні. Можна підготувати профіль у вкладці й завантажити власний JSON.', true); }
applyAuthState();renderProfileProgress();

// SYN_CONSENT_PANEL_7: seven granular consents, all default OFF; revoke has an instant effect.
// In-memory only: no localStorage, URL or config may enable a consent. Recording stays locked OFF (StGB 179ter).
// Analytics sync: while OFF (default) zero telemetry writes happen — nothing calls the telemetry writer at all.
{
  const consentToggles = {
    visibility: document.getElementById('consent-visibility'),
    comparison: document.getElementById('consent-comparison'),
    introduction: document.getElementById('consent-introduction'),
    external_ai: document.getElementById('consent-external-ai'),
    recording: document.getElementById('consent-recording'),
    summary: document.getElementById('consent-summary'),
    analytics_sync: document.getElementById('consent-analytics-sync'),
  };
  // Toggles mirror consentState, which session restore may already have filled (visibility follows is_discoverable).
  for (const [key, toggle] of Object.entries(consentToggles)) if (toggle) toggle.checked = consentState[key] === true;
  if (consentToggles.recording) { consentToggles.recording.checked = false; consentToggles.recording.disabled = true; }
  // The profile form and the AI dialog own the same two consents and are also reset in code (import, AI dialog).
  // Re-read them on every change and whenever the panel's tab opens, so the panel never shows a stale state.
  const syncSharedConsents = () => {
    consentState.visibility = form.elements.namedItem('is_discoverable').checked;
    consentState.external_ai = $('#ai-consent').checked;
    if (consentToggles.visibility) consentToggles.visibility.checked = consentState.visibility;
    if (consentToggles.external_ai) consentToggles.external_ai.checked = consentState.external_ai;
  };
  form.elements.namedItem('is_discoverable').addEventListener('change', syncSharedConsents);
  $('#ai-consent').addEventListener('change', syncSharedConsents);
  document.querySelectorAll('[data-tab="settings"]').forEach(button => button.addEventListener('click', syncSharedConsents));
  consentToggles.visibility?.addEventListener('change', () => {
    consentState.visibility = consentToggles.visibility.checked;
    form.elements.namedItem('is_discoverable').checked = consentState.visibility;
    form.elements.namedItem('map_visible').checked = form.elements.namedItem('map_visible').checked && consentState.visibility;
    form.dataset.dirty = 'true';
    renderProfileProgress();
  });
  consentToggles.comparison?.addEventListener('change', () => { consentState.comparison = consentToggles.comparison.checked; renderPeople(); });
  consentToggles.introduction?.addEventListener('change', () => { consentState.introduction = consentToggles.introduction.checked; renderPeople(); });
  consentToggles.external_ai?.addEventListener('change', () => {
    consentState.external_ai = consentToggles.external_ai.checked;
    $('#ai-consent').checked = consentState.external_ai;
    if (!consentState.external_ai) resetAI();
    applyAuthState();
  });
  consentToggles.recording?.addEventListener('change', () => { consentState.recording = false; consentToggles.recording.checked = false; });
  consentToggles.summary?.addEventListener('change', () => { consentState.summary = consentToggles.summary.checked; });
  consentToggles.analytics_sync?.addEventListener('change', () => { consentState.analytics_sync = consentToggles.analytics_sync.checked; });
}
