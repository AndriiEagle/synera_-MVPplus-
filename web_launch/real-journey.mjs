import { RealJourneyStore, assertRealJourneyGate, materialFromEditor } from './real-journey-client.mjs';
import { CAPABILITIES } from './profile-brief.mjs';
import { meetingDirectionsUrl } from './live-location.mjs';

const $ = id => document.getElementById(id);
const ui = Object.freeze({ status: $('real-status'), blocked: $('real-blocked'), auth: $('real-auth'), content: $('real-content-panel'), people: $('real-people'), cases: $('real-cases'), meetings: $('real-meetings'), peer: $('real-peer'), terms: $('real-terms'), termsForm: $('real-terms-form'), mode: $('real-mode'), hybrid: $('real-hybrid-components'), modeBoundary: $('real-mode-boundary'), money: $('real-money-terms'), paidBoundary: $('real-paid-boundary'), review: $('real-terms-review'), approveCheck: $('real-approve-check'), approve: $('real-approve'), withdraw: $('real-withdraw'), invite: $('real-invite'), inviteForm: $('real-invite-form'), conversation: $('real-conversation'), transcript: $('real-transcript'), messageForm: $('real-message-form'), message: $('real-message'), refresh: $('real-refresh'), logout: $('real-logout') });
const state = { store: null, dashboard: null, peerId: null, caseState: null, meetingId: null, busy: false, epoch: 0, termsDirty: false, messageDraftMeeting: null, reviewKey: null };
Object.assign(state, { outcomesEnabled: false, conversationPeer: null, outcomeContext: null, outcomeData: null });
const outcomeUI = { panel: $('real-outcomes'), refresh: $('real-outcome-refresh'), status: $('real-outcome-status'), cards: $('real-outcome-cards'), history: $('real-outcome-history'), events: $('real-outcome-events') };
Object.assign(outcomeUI, { exportControls: $('real-outcome-export-controls'), export: $('real-outcome-export'), compress: $('real-outcome-compress') });
Object.assign(outcomeUI, { socialControls: $('real-social-controls'), socialWording: $('real-social-wording'), socialConsent: $('real-social-consent'), socialCreate: $('real-social-create'), socialOutput: $('real-social-output'), socialText: $('real-social-text'), socialSelect: $('real-social-select') });
Object.assign(state, { addressEnabled: false, addressContext: null, addressData: null, addressGeneration: 0 });
const addressUI = { panel: $('real-address'), refresh: $('real-address-refresh'), status: $('real-address-status'), cards: $('real-address-cards'), history: $('real-address-history'), events: $('real-address-events') };
const el = (tag, text = '', attrs = {}) => { const node = document.createElement(tag); if (text) node.textContent = text; for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); return node; };
const setStatus = text => { ui.status.textContent = text; };
const clear = node => node.replaceChildren();
const nameFor = id => (id === state.dashboard?.own?.id ? state.dashboard.own.display_name : state.dashboard?.people?.find(person => person.id === id)?.display_name) || 'Учасник домовленості';
const caseFor = peerId => state.dashboard?.cases?.find(row => row.participants?.includes(peerId)) || null;
const asText = value => typeof value === 'string' ? value : '';
const errorText = error => error?.status === 401 ? 'Сеанс завершився. Увійди знову.' : error?.status === 403 ? 'Ця дія недоступна для поточного облікового запису.' : error?.status === 503 ? 'Реальний шлях тимчасово недоступний.' : (error?.message || 'Не вдалося завершити дію.');
const statusLabels = { draft: 'Чернетка', awaiting_approval: 'Очікує підтвердження', approved_for_next_step: 'Погоджено обома', pending: 'Чекає відповіді', accepted: 'Прийнято', declined: 'Відхилено', cancelled: 'Скасовано' };
const dateTime = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('uk', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Час не вказано';

function clearPrivate() {
  clearAddress(); addressUI.panel.hidden = true;
  clearOutcomes(); outcomeUI.panel.hidden = true; state.conversationPeer = null;
  state.dashboard = null; state.peerId = null; state.caseState = null; state.meetingId = null; state.epoch++;
  ui.content.hidden = true; ui.peer.hidden = true; ui.terms.hidden = true; ui.invite.hidden = true; ui.conversation.hidden = true;
  clear(ui.people); clear(ui.cases); clear(ui.meetings); clear(ui.peer); clear(ui.review); clear(ui.transcript);
  ui.termsForm.reset(); ui.inviteForm.reset(); ui.messageForm.reset(); ui.approveCheck.checked = false; state.termsDirty = false; state.messageDraftMeeting = null;
  state.reviewKey = null;
}
function unavailable() { clearPrivate(); ui.blocked.hidden = false; ui.auth.hidden = true; setStatus('Реальний шлях закритий.'); }
function requiresLogin() { clearPrivate(); ui.blocked.hidden = true; ui.auth.hidden = false; setStatus('Потрібен активний сеанс.'); }
async function run(action, { keepDraft = false } = {}) {
  if (state.busy) return;
  state.busy = true; document.body.dataset.realBusy = 'true';
  const epoch = state.epoch;
  try { return await action(); }
  catch (error) {
    if (epoch !== state.epoch && !state.dashboard) return;
    if (error?.status === 401 || error?.status === 403) { requiresLogin(); return; }
    if (error?.status === 503) { unavailable(); return; }
    if (!keepDraft) setStatus(errorText(error)); else setStatus(errorText(error) + ' Твій текст лишився у полі.');
  } finally { state.busy = false; delete document.body.dataset.realBusy; }
}
function makeButton(text, fn) { const button = el('button', text, { type: 'button' }); button.addEventListener('click', () => run(fn)); return button; }
function appendEmpty(host, text) { host.append(el('p', text, { class: 'real-empty' })); }
function populateTags() { for (const select of ui.termsForm.querySelectorAll('select[name="give_tag"],select[name="take_tag"]')) for (const [id, label] of Object.entries(CAPABILITIES)) select.append(el('option', label, { value: id })); }
function syncModeEditor() {
  const mode = ui.mode.value, money = ui.termsForm.elements.namedItem('compensation_status').value === 'agreed_money';
  ui.hybrid.hidden = mode !== 'hybrid'; ui.money.hidden = !money;
  ui.paidBoundary.hidden = mode !== 'paid_service';
  ui.modeBoundary.textContent = mode === 'joint_project' ? 'Це двосторонній пробний спільний проєкт: кожна людина вручну описує свій конкретний внесок, результат і критерій. Це не автоматичний набір команди.' : mode === 'referral' ? 'Рекомендація не створює контакту чи згоди третьої особи: підтвердь їх окремо перед дією.' : mode === 'hybrid' ? 'Поєднання зберігає лише явно вибрані компоненти; вони не замінюють окремих погоджень.' : '';
}
function renderPeople() {
  clear(ui.people); const people = state.dashboard?.people || [];
  if (!people.length) return appendEmpty(ui.people, 'Наразі немає доступних профілів.');
  const list = el('div', '', { class: 'real-list' });
  for (const person of people) {
    const card = el('article', '', { class: 'real-card' }); card.append(el('h3', asText(person.display_name) || 'Учасник'));
    card.append(el('small', asText(person.city) || 'Місто не вказано'));
    const comparison = person.comparison;
    const offered = (person.brief?.offer_tags || []).map(tag => CAPABILITIES[tag]).filter(Boolean);
    const needed = (person.brief?.need_tags || []).map(tag => CAPABILITIES[tag]).filter(Boolean);
    card.append(el('p', `Дає: ${offered.join(', ') || 'не вказано'}. Шукає: ${needed.join(', ') || 'не вказано'}.`));
    card.append(el('small', comparison?.status === 'review_candidate' ? 'Є заявлена взаємна користь. Потрібна розмова.' : 'Умови підбору ще не збігаються.'));
    card.append(makeButton('Відкрити умови', () => selectPeer(person.id)));
    list.append(card);
  } ui.people.append(list);
}
function renderCases() {
  clear(ui.cases); const cases = state.dashboard?.cases || [];
  if (!cases.length) return appendEmpty(ui.cases, 'Відкритих домовленостей немає.');
  const list = el('div', '', { class: 'real-list' });
  for (const item of cases) {
    const peer = item.participants?.find(id => id !== state.dashboard.own?.id); if (!peer) continue;
    const card = el('article', '', { class: 'real-card' });
    card.append(el('h3', nameFor(peer))); card.append(el('p', `Редакція ${item.version || 0} · ${statusLabels[item.status] || 'Недоступно'}`));
    card.append(makeButton('Переглянути умови', () => selectPeer(peer))); list.append(card);
  } ui.cases.append(list);
}
function renderMeetings() {
  clear(ui.meetings); const meetings = state.dashboard?.meetings || [];
  if (!meetings.length) return appendEmpty(ui.meetings, 'Запрошень або прийнятих розмов немає.');
  const list = el('div', '', { class: 'real-list' });
  for (const meeting of meetings) {
    const card = el('article', '', { class: 'real-card' });
    card.append(el('h3', `${asText(meeting.meeting_place) || 'Онлайн'} · ${statusLabels[meeting.status] || 'Недоступно'}`));
    card.append(el('small', dateTime(meeting.proposed_at)));
    if (meeting.note) card.append(el('p', meeting.note));
    if (meeting.status === 'pending' && meeting.recipient_id === state.dashboard.own?.id) {
      card.append(makeButton('Прийняти', () => respond(meeting.id, 'accepted')), makeButton('Відхилити', () => respond(meeting.id, 'declined')));
    }
    if (meeting.status === 'accepted') card.append(makeButton('Відкрити розмову', () => selectConversation(meeting.id)));
    list.append(card);
  } ui.meetings.append(list);
}
const termLabels = { exchange: 'Взаємний обмін', joint_project: 'Спільний проєкт', paid_service: 'Оплачувана послуга', referral: 'Рекомендація', hybrid: 'Поєднання способів співпраці', agreed_money: 'Грошова винагорода', agreed_none: 'Без винагороди', agreed_exchange: 'Взаємний обмін без грошової оплати', required: 'Потрібна', not_required: 'Не потрібна', giver: 'У того, хто надає', receiver: 'У того, хто отримує', shared: 'Спільна', mutual_written_notice: 'Взаємне письмове повідомлення', either_party_before_start: 'Будь-хто до початку' };
const outcomeLabels = { pending: 'Очікує доказу', evidence_supplied: 'Доказ подано', checked_with_scope: 'Перевірено за критерієм', accepted: 'Прийнято одержувачем', declined_dispute_open: 'Є відкритий спір' };
const reasonLabels = { not_delivered: 'Результат не надано', outside_agreed_scope: 'Поза погодженим обсягом', below_acceptance_criteria: 'Критерій ще не виконано', other: 'Інша причина' };
const caseKey = current => current && `${current.caseId}/${current.version}/${current.termsHash}`;
function clearAddress() {
  state.addressGeneration++; state.addressContext = null; state.addressData = null;
  clear(addressUI.cards); clear(addressUI.events); addressUI.status.textContent = ''; addressUI.history.hidden = true;
}
const meetingKey = m => m && JSON.stringify([Date.parse(m.proposed_at), m.duration_minutes, m.meeting_place, m.status]);
function syncAddressEntry() {
  const meeting = state.dashboard?.meetings?.find(m => m.id === state.meetingId), current = caseFor(state.conversationPeer);
  addressUI.panel.hidden = !state.addressEnabled || !state.conversationPeer || !meeting || meeting.status !== 'accepted' ||
    !meeting.meeting_place || ['online', 'онлайн'].includes(meeting.meeting_place.trim().toLowerCase());
  const context = state.addressContext;
  if (addressUI.panel.hidden || (context && (context.meetingId !== state.meetingId || context.peerId !== state.conversationPeer ||
      caseKey(current) !== caseKey(context.reviewed) || current?.status !== context.reviewed.status || meetingKey(meeting) !== meetingKey(context.selected.meeting)))) clearAddress();
}
async function openAddress() {
  const peerId = state.conversationPeer, meetingId = state.meetingId, epoch = state.epoch;
  if (!state.addressEnabled || !peerId || !meetingId) return;
  clearAddress(); const generation = state.addressGeneration;
  const active = () => epoch === state.epoch && generation === state.addressGeneration && meetingId === state.meetingId;
  try {
    const reviewed = await state.store.pairState(peerId); if (!active()) return;
    if (!reviewed) return setStatus('Для погодження адреси потрібна відкрита домовленість.');
    const result = await state.store.meetingAddressState(peerId, meetingId, reviewed); if (!active()) return;
    state.addressContext = { peerId, meetingId, reviewed, selected: result }; state.addressData = result; renderAddress();
    setStatus('Актуальний стан адреси прочитано з сервера.');
  } catch (error) {
    if (!active()) return;
    if (error.status === 409) { clearAddress(); setStatus('Умови або зустріч змінились. Перевір адресу знову.'); return; }
    if (error.status === 429 || error.status >= 500 || !error.status) { setStatus('Не вдалося прочитати адресу. Приватна розмова доступна; перевір адресу пізніше.'); return; }
    throw error;
  }
}
async function recordAddress(context, intent) {
  const epoch = state.epoch, generation = state.addressGeneration;
  try {
    const result = await state.store.recordMeetingAddress(context.peerId, context.meetingId, context.reviewed, context.selected, intent);
    if (epoch !== state.epoch || generation !== state.addressGeneration || state.addressContext !== context) return;
    state.addressContext = { ...context, selected: result }; state.addressData = result; renderAddress();
    setStatus(intent.action === 'propose' ? 'Адресу запропоновано. Чекаємо окремого вибору другої людини.' : 'Твій вибір адреси збережено на сервері.');
  } catch (error) {
    if (epoch !== state.epoch || generation !== state.addressGeneration) return;
    if (error.status === 409) { clearAddress(); setStatus('Пропозиція або умови змінилися. Перевір адресу й підтвердь новий вибір окремо.'); return; }
    if (error.status === 429 || error.status >= 500 || !error.status) { setStatus('Не вдалося зберегти адресу. Твій вибір лишився у картці; повтори цю дію пізніше.'); return; }
    throw error;
  }
}
async function navigateAddress(context) {
  const epoch = state.epoch, generation = state.addressGeneration;
  const active = () => epoch === state.epoch && generation === state.addressGeneration && state.addressContext === context;
  if (!active() || !context.selected.agreed) return;
  try {
    const result = await state.store.meetingAddressState(context.peerId, context.meetingId, context.reviewed);
    if (!active()) return;
    const same = result.agreed && context.reviewed.status === 'approved_for_next_step' && Date.parse(context.reviewed.expiresAt) > Date.now() &&
      result.proposal?.proposal_id === context.selected.proposal?.proposal_id &&
      result.meeting.meeting_address === context.selected.meeting.meeting_address && meetingKey(result.meeting) === meetingKey(context.selected.meeting);
    if (!same) {
      state.addressContext = { ...context, selected: result }; state.addressData = result; renderAddress();
      setStatus('Адреса або погодження змінились. Переглянь актуальний стан перед маршрутом.'); return;
    }
    const url = meetingDirectionsUrl(result.meeting.meeting_address);
    if (url) window.location.assign(url);
  } catch (error) {
    if (!active()) return;
    if (error.status === 409) { clearAddress(); setStatus('Умови або зустріч змінились. Перевір адресу знову.'); return; }
    if (error.status === 429 || error.status >= 500 || !error.status) { setStatus('Не вдалося перевірити маршрут. Повтори свій вибір пізніше.'); return; }
    throw error;
  }
}
function renderAddress() {
  const context = state.addressContext, result = state.addressData; if (!context || !result) return;
  clear(addressUI.cards); clear(addressUI.events);
  const p = result.proposal, me = state.dashboard.own.id;
  const writable = context.reviewed.status === 'approved_for_next_step' && Date.parse(context.reviewed.expiresAt) > Date.now() &&
    Date.parse(result.meeting.proposed_at) > Date.now() && result.meeting.duration_minutes !== null;
  addressUI.status.textContent = result.agreed ? 'Погоджено обома' : !p ? 'Адресу ще не погоджено' : !p.current ? 'Пропозиція застаріла' :
    p.decision === 'decline' ? 'Пропозицію відхилено' : p.decision === 'accept' ? 'Потрібне актуальне погодження умов' : 'Очікує вибору другої людини';
  addressUI.status.className = result.agreed ? 'real-approval-ok' : 'real-approval-pending';
  addressUI.cards.append(el('p', `${dateTime(result.meeting.proposed_at)} · ${result.meeting.duration_minutes || '—'} хв · ${result.meeting.meeting_place}`));
  if (result.meeting.meeting_address && !result.agreed) addressUI.cards.append(el('p', 'Попередня адреса: ' + result.meeting.meeting_address));
  if (p) {
    const card = el('article', '', { class: 'real-card' }); card.append(el('strong', p.address), el('small', 'Пропонує: ' + nameFor(p.proposer_id)));
    if (p.current && !p.decision && p.proposer_id !== me) {
      const check = el('input', '', { type: 'checkbox', name: 'accept-consent' }), label = el('label', '', { class: 'real-check' });
      label.append(check, document.createTextNode('Я погоджую саме цю адресу й час.'));
      const accept = el('button', 'Погодити адресу', { type: 'button' }), decline = el('button', 'Відхилити адресу', { type: 'button' });
      check.disabled = !writable; accept.disabled = true; decline.disabled = !writable;
      const acceptId = crypto.randomUUID(), declineId = crypto.randomUUID();
      check.addEventListener('change', () => { accept.disabled = !writable || !check.checked; });
      accept.addEventListener('click', () => { if (check.checked && writable) run(() => recordAddress(context, { action: 'accept', intentId: acceptId, consent: true })); });
      decline.addEventListener('click', () => run(() => recordAddress(context, { action: 'decline', intentId: declineId })));
      const actions = el('div', '', { class: 'real-actions' }); actions.append(accept, decline); card.append(label, actions);
    }
    addressUI.cards.append(card);
  }
  if (result.agreed && context.reviewed.status === 'approved_for_next_step' && Date.parse(context.reviewed.expiresAt) > Date.now() && meetingDirectionsUrl(result.meeting.meeting_address)) {
    const route = makeButton('Маршрут у Google Maps ↗', () => navigateAddress(context)); route.id = 'real-address-route';
    addressUI.cards.append(route, el('small', 'Відкриє Google Maps у цьому вікні й передасть адресу. Перевір точку на карті.'));
  }
  if (writable) {
    const host = p ? el('details', '', { id: 'real-address-editor' }) : el('div');
    if (p) host.append(el('summary', 'Запропонувати іншу адресу'));
    const form = el('form', '', { class: 'real-form' }), input = el('textarea', '', { name: 'address', required: '', maxlength: '200', rows: '2' });
    const label = el('label', 'Точна адреса або точка зустрічі'); label.append(input);
    const check = el('input', '', { type: 'checkbox', name: 'consent', required: '' }), consent = el('label', '', { class: 'real-check' });
    consent.append(check, document.createTextNode('Я пропоную це місце другій людині.'));
    const button = el('button', 'Запропонувати адресу', { type: 'submit' }); button.disabled = true;
    const changed = () => { button.disabled = !check.checked || !input.value.trim(); }; input.addEventListener('input', changed); check.addEventListener('change', changed);
    let pending = null;
    form.addEventListener('submit', event => { event.preventDefault(); if (!check.checked || !input.value.trim()) return;
      const address = input.value.trim(); if (!pending || pending.address !== address) pending = { action: 'propose', intentId: crypto.randomUUID(), address, consent: true };
      run(() => recordAddress(context, pending));
    });
    form.append(label, consent, button); host.append(form); addressUI.cards.append(host);
  } else addressUI.cards.append(el('p', 'Для нового вибору потрібні актуальні підтвердження обох і майбутній час зустрічі.', { class: 'real-note' }));
  const labels = { propose: 'запропоновано', accept: 'погоджено', decline: 'відхилено' };
  for (const event of result.events) addressUI.events.append(el('li', `${nameFor(event.actor_id)} · ${labels[event.kind]} · ${dateTime(event.created_at)}${event.address ? ' · ' + event.address : ''}`));
  addressUI.history.hidden = result.events.length === 0;
}
function clearSocialDraft() { state.socialGeneration = (state.socialGeneration || 0) + 1; state.socialDraft = null; outcomeUI.socialText.value = ''; outcomeUI.socialOutput.hidden = true; outcomeUI.socialConsent.checked = false; outcomeUI.socialCreate.disabled = true; }
function clearOutcomes() { state.outcomeContext = null; state.outcomeData = null; clear(outcomeUI.cards); clear(outcomeUI.events); outcomeUI.status.textContent = ''; outcomeUI.history.hidden = true; outcomeUI.exportControls.hidden = true; clearSocialDraft(); outcomeUI.socialControls.hidden = true; }
function syncOutcomesEntry() {
  const peerId = state.peerId || state.conversationPeer;
  outcomeUI.panel.hidden = !state.outcomesEnabled || !state.dashboard || !peerId;
  const current = state.peerId ? state.caseState : caseFor(peerId);
  if (outcomeUI.panel.hidden || (state.outcomeContext && (state.outcomeContext.peerId !== peerId || caseKey(current) !== caseKey(state.outcomeContext.reviewed)))) clearOutcomes();
  else if (state.outcomeContext && current.status !== state.outcomeContext.reviewed.status) { state.outcomeContext.reviewed = current; renderOutcomes(); }
}
async function openOutcomes() {
  const peerId = state.peerId || state.conversationPeer, epoch = state.epoch;
  if (!state.outcomesEnabled || !peerId) return;
  clearOutcomes();
  try {
    const reviewed = await state.store.pairState(peerId); if (epoch !== state.epoch) return;
    if (!reviewed) return setStatus('Відкритої домовленості для цієї пари немає.');
    const result = await state.store.outcomeState(peerId, reviewed); if (epoch !== state.epoch) return;
    state.outcomeContext = { peerId, reviewed }; state.outcomeData = result; renderOutcomes();
    setStatus('Результати домовленості прочитано з сервера.');
  } catch (error) {
    if (epoch !== state.epoch) return;
    if (error?.status === 409) { setStatus('Домовленість змінилася. Перевір результати знову.'); return; }
    if (error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus('Не вдалося прочитати результати. Чат доступний; повтори перевірку пізніше.'); return;
    }
    throw error;
  }
}
async function recordOutcome(context, intent) {
  const epoch = state.epoch;
  try {
    const result = await state.store.recordOutcome(context.peerId, context.reviewed, intent);
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    state.outcomeData = result; renderOutcomes(); setStatus('Твою дію збережено й прочитано з сервера.');
  } catch (error) {
    if (epoch === state.epoch && error.status === 503) { setStatus('Сервер результатів тимчасово недоступний. Твій текст лишився у полі; повтори цю дію пізніше.'); return; }
    if (epoch === state.epoch && error.status === 409) clearOutcomes();
    throw error;
  }
}
function outcomeForm(card, context, index, action, label, field, options = null) {
  const form = el('form', '', { class: 'real-form' }), caption = el('label', label);
  const input = options ? el('select', '', { required: '', name: field }) : el('textarea', '', { required: '', maxlength: '1000', name: field });
  if (options) { input.append(el('option', 'Обери причину', { value: '' })); for (const [value, text] of Object.entries(options)) input.append(el('option', text, { value })); }
  caption.append(input); form.append(caption);
  const button = el('button', action === 'submit' ? 'Подати доказ' : action === 'check' ? 'Зберегти перевірку' : 'Відкрити спір', { type: 'submit' });
  const writable = context.reviewed.status === 'approved_for_next_step' && Date.parse(context.reviewed.expiresAt) > Date.now();
  input.disabled = button.disabled = !writable; form.append(button); card.append(form);
  let retry = null;
  form.addEventListener('submit', event => {
    event.preventDefault(); const value = input.value;
    if (!retry || retry[field] !== value) retry = { action, index, intentId: crypto.randomUUID(), [field]: value };
    run(() => recordOutcome(context, retry), { keepDraft: true });
  });
}
function renderOutcomes() {
  const context = state.outcomeContext, result = state.outcomeData; if (!context || !result) return;
  clearSocialDraft();
  outcomeUI.socialControls.hidden = !result.outcome_confirmed || context.reviewed.status !== 'approved_for_next_step' || Date.parse(context.reviewed.expiresAt) <= Date.now();
  clear(outcomeUI.cards); clear(outcomeUI.events);
  const accepted = result.deliverables.filter(row => row.phase === 'accepted').length;
  outcomeUI.status.textContent = `Редакція ${result.version} · ${result.outcome_confirmed ? 'Усі результати прийняті одержувачами' : `Прийнято ${accepted} з ${result.deliverables.length} результатів`}`;
  outcomeUI.status.className = result.outcome_confirmed ? 'real-approval-ok' : 'real-approval-pending';
  for (const row of result.deliverables) {
    const card = el('article', '', { class: 'real-card', 'data-outcome-index': row.index });
    card.append(el('h3', row.giver_id === state.dashboard.own.id ? 'Ти даєш' : `${nameFor(row.giver_id)} дає тобі`),
      el('p', row.target), el('p', `Критерій: ${row.acceptance_criteria}`), el('strong', outcomeLabels[row.phase]));
    if (row.evidence_uri) card.append(el('p', `Доказ: ${row.evidence_uri}`));
    if (row.scope_notes) card.append(el('p', `Перевірка: ${row.scope_notes}`));
    if (row.reason) card.append(el('p', reasonLabels[row.reason]));
    if (row.phase !== 'accepted') {
      if (row.giver_id === state.dashboard.own.id && !row.evidence_uri) outcomeForm(card, context, row.index, 'submit', 'Посилання або опис доказу', 'evidenceUri');
      if (row.receiver_id === state.dashboard.own.id && row.evidence_uri) {
        if (!row.scope_notes) outcomeForm(card, context, row.index, 'check', 'Що перевірено за погодженим критерієм', 'scopeNotes');
        if (row.scope_notes) {
          const label = el('label', '', { class: 'real-check' }), check = el('input', '', { type: 'checkbox' });
          label.append(check, document.createTextNode('Я перевірила/перевірив результат за цим критерієм.'));
          const button = el('button', 'Прийняти результат', { type: 'button' }); button.disabled = true;
          check.disabled = context.reviewed.status !== 'approved_for_next_step' || Date.parse(context.reviewed.expiresAt) <= Date.now();
          check.addEventListener('change', () => { button.disabled = check.disabled || !check.checked; });
          let intent = null;
          button.addEventListener('click', () => { if (!check.checked) return; intent ||= { action: 'accept', index: row.index, intentId: crypto.randomUUID() }; run(() => recordOutcome(context, intent), { keepDraft: true }); });
          card.append(label, button);
        }
        if (row.phase !== 'declined_dispute_open') outcomeForm(card, context, row.index, 'decline', 'Нейтральна причина', 'reason', reasonLabels);
      }
    }
    outcomeUI.cards.append(card);
  }
  const names = { submit: 'подано доказ', check: 'перевірено критерій', accept: 'прийнято результат', decline: 'відкрито спір' };
  for (const event of result.events) outcomeUI.events.append(el('li', `${nameFor(event.actor_id)} · ${names[event.kind]} · ${dateTime(event.created_at)}${event.kind === 'decline' ? ' · ' + reasonLabels[event.payload.reason] : ''}`));
  outcomeUI.history.hidden = result.events.length === 0;
  outcomeUI.exportControls.hidden = false;
}
async function exportOutcome() {
  const context = state.outcomeContext, epoch = state.epoch;
  if (!context || !state.outcomeData) return;
  try {
    const packed = await state.store.exportOutcome(context.peerId, context.reviewed, { compress: outcomeUI.compress.checked });
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    const url = URL.createObjectURL(new Blob([packed.json], { type: 'application/json' }));
    try { const link = el('a', '', { href: url, download: packed.fileName }); link.click(); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    setStatus(`Приватну копію створено. Вихідний UTF-8: ${packed.originalBytes} байт; файл: ${packed.envelopeBytes} байт.`);
  } catch (error) {
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    if (error?.status === 409) { clearOutcomes(); setStatus('Домовленість змінилася. Перевір результати перед експортом.'); return; }
    if (error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus('Не вдалося створити приватний архів. Чат і твій текст збережені; повтори завантаження пізніше.'); return;
    }
    throw error;
  }
}
async function createOutcomeSocialDraft() {
  const context = state.outcomeContext, epoch = state.epoch;
  if (!context || !outcomeUI.socialConsent.checked) return;
  clearSocialDraft(); outcomeUI.socialConsent.checked = true; outcomeUI.socialCreate.disabled = false;
  const generation = state.socialGeneration;
  try {
    const draft = await state.store.socialDraft(context.peerId, context.reviewed, { wording: outcomeUI.socialWording.value });
    if (epoch !== state.epoch || state.outcomeContext !== context || generation !== state.socialGeneration || !outcomeUI.socialConsent.checked) return;
    state.socialDraft = draft; outcomeUI.socialText.value = draft.text; outcomeUI.socialOutput.hidden = false;
    setStatus('Приватну чернетку створено з прийнятого внеску. Перевір текст та дозволи перед зовнішнім поширенням.');
  } catch (error) {
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    if (error?.status === 401 || error?.status === 403) throw error;
    if (generation !== state.socialGeneration || !outcomeUI.socialConsent.checked) return;
    if (error?.status === 409) { clearSocialDraft(); outcomeUI.socialControls.hidden = true; setStatus('Домовленість змінилася. Перевір результати перед створенням чернетки.'); return; }
    if (error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus('Не вдалося створити приватну чернетку. Чат доступний; повтори створення пізніше.'); return;
    }
    throw error;
  }
}
function renderReview(current) {
  clear(ui.review);
  const key = current ? `${current.caseId}/${current.version}/${current.termsHash}` : null;
  if (key !== state.reviewKey) ui.approveCheck.checked = false;
  state.reviewKey = key;
  if (!current) return;
  const material = current.material || {}, trial = material.trial || {}, legs = trial.deliverables || [];
  ui.review.append(el('h3', `Редакція ${current.version} · ${statusLabels[current.status] || 'Недоступно'}`));
  ui.review.append(el('p', (material.components || []).map(mode => termLabels[mode] || mode).join(' + ')));
  const proof = el('details'); proof.append(el('summary', 'Перевірити версію'), el('p', `Контрольна сума: ${current.termsHash || 'відсутня'}`)); ui.review.append(proof);
  for (const leg of legs) {
    const box = el('dl'); box.append(el('dt', `${leg.giver_id === state.dashboard?.own?.id ? 'Ти даєш' : nameFor(leg.giver_id) + ' дає'}: ${CAPABILITIES[leg.capability_tag] || leg.capability_tag || 'не вказано'}`));
    box.append(el('dd', `Результат: ${asText(leg.target)}`), el('dd', `Критерій: ${asText(leg.acceptance_criteria)}`));
    if (leg.effort) box.append(el('dd', `Обсяг: ${leg.effort.amount} ${leg.effort.unit}`)); ui.review.append(box);
  }
  for (const outcome of material.outcomes || []) {
    if (!legs.some(leg => leg.receiver_id === outcome.receiver_id && leg.capability_tag === outcome.capability_tag && leg.target === outcome.target)) {
      ui.review.append(el('p', `Очікуваний підсумок для ${nameFor(outcome.receiver_id)}: ${outcome.target}`));
    }
  }
  if (material.compensation?.status === 'agreed_money') {
    ui.review.append(el('p', `Винагорода: ${(material.compensation.amount_minor / 100).toFixed(2)} ${material.compensation.currency}`));
    ui.review.append(el('p', `Рахунок: ${material.compensation.invoice_required === true ? 'так' : material.compensation.invoice_required === false ? 'ні' : 'потрібно узгодити'}`));
  }
  const details = el('dl'); details.append(el('dt', 'Строк і умови'));
  for (const [label, value] of [['Початок', trial.starts_on], ['Строк', trial.due_on], ['Компенсація', material.compensation?.status], ['Редакції', material.terms?.revision_limit], ['Конфіденційність', material.terms?.confidentiality], ['Інтелектуальна власність', material.terms?.intellectual_property], ['Скасування', material.terms?.cancellation]]) details.append(el('dd', `${label}: ${termLabels[value] || String(value ?? 'не вказано')}`));
  ui.review.append(details);
  const approvals = current.approvals || {}; for (const id of current.participants || []) ui.review.append(el('p', `${nameFor(id)}: ${approvals[id] ? 'підтвердив(ла) цю редакцію' : 'ще не підтвердив(ла)'}`, { class: approvals[id] ? 'real-approval-ok' : 'real-approval-pending' }));
}
function renderPeer() {
  if (!state.peerId) return;
  ui.peer.hidden = false; clear(ui.peer); ui.peer.append(el('h2', nameFor(state.peerId)), el('p', `Ідентифікатор профілю: ${state.peerId}`));
  ui.terms.hidden = false; renderReview(state.caseState);
  if (!state.termsDirty) $('real-editor').open = !state.caseState;
  updateApprovalControls();
  syncOutcomesEntry();
}
function updateApprovalControls() {
  const ownId = state.dashboard?.own?.id; const approved = state.caseState?.approvals || {};
  const expired = Boolean(state.caseState && Date.parse(state.caseState.expiresAt) <= Date.now());
  const both = state.caseState?.status === 'approved_for_next_step' && Date.parse(state.caseState.expiresAt) > Date.now();
  ui.invite.hidden = !both;
  ui.approve.disabled = expired || !state.caseState || !ui.approveCheck.checked || Boolean(approved[ownId]);
  ui.approveCheck.disabled = expired;
  ui.termsForm.querySelector('button[type=submit]').disabled = expired;
  $('real-close').hidden = !state.caseState;
  $('real-close').disabled = !state.caseState;
  ui.withdraw.disabled = !state.caseState || !approved[ownId];
}
function fillCurrentTerms(current) {
  ui.termsForm.reset();
  if (!current) { syncModeEditor(); return; }
  const values = { ...current.material.trial, mode: current.material.mode, compensation_status: current.material.compensation.status, ...current.material.terms };
  if (current.material.compensation.status === 'agreed_money') Object.assign(values, { amount: (current.material.compensation.amount_minor / 100).toFixed(2), currency: current.material.compensation.currency, invoice: current.material.compensation.invoice_required ? 'yes' : 'no' });
  for (const [prefix, giver] of [['give', state.dashboard.own.id], ['take', state.peerId]]) {
    const leg = current.material.trial.deliverables.find(row => row.giver_id === giver);
    if (!leg) continue;
    Object.assign(values, { [prefix + '_tag']: leg.capability_tag, [prefix + '_target']: leg.target, [prefix + '_criteria']: leg.acceptance_criteria, [prefix + '_amount']: leg.effort?.amount || '', [prefix + '_unit']: leg.effort?.unit || '' });
  }
  for (const [key, value] of Object.entries(values)) { const input = ui.termsForm.elements.namedItem(key); if (input) input.value = String(value); }
  for (const input of ui.termsForm.querySelectorAll('input[name="components"]')) input.checked = current.material.components.includes(input.value);
  syncModeEditor();
}
async function selectPeer(peerId) {
  clearAddress(); addressUI.panel.hidden = true; clearOutcomes(); state.conversationPeer = null;
  const peerChanged = state.peerId !== peerId;
  state.peerId = peerId; state.meetingId = null; state.epoch++; const epoch = state.epoch;
  if (peerChanged) { ui.termsForm.reset(); state.termsDirty = false; }
  for (const id of ['real-people-panel', 'real-cases-panel', 'real-meetings-panel']) $(id).open = false;
  ui.conversation.hidden = true; clear(ui.transcript); ui.messageForm.reset(); state.messageDraftMeeting = null; setStatus('Завантажуємо поточну редакцію умов…');
  const current = await state.store.pairState(peerId); if (epoch !== state.epoch) return;
  state.caseState = current; fillCurrentTerms(current); state.termsDirty = false; renderPeer(); setStatus(current ? 'Показано поточну редакцію. Прочитай її перед підтвердженням.' : 'Нові умови порожні: заповни їх вручну.');
}
function formFields(form) { const data = new FormData(form), fields = Object.fromEntries(data.entries()); fields.components = data.getAll('components'); return fields; }
async function saveTerms(event) { event.preventDefault(); if (!state.peerId) return; const epoch = state.epoch; const fields = formFields(ui.termsForm); const material = materialFromEditor(state.dashboard.own.id, state.peerId, fields); const saved = await state.store.saveTerms(state.peerId, material, state.caseState); if (epoch !== state.epoch) return; state.caseState = saved; state.termsDirty = false; renderPeer(); setStatus('Нову редакцію збережено. Обидва підтвердження потрібно зробити окремо.'); }
async function approve() { if (!state.peerId || !ui.approveCheck.checked || !state.caseState) return setStatus('Постав позначку лише після читання поточної редакції.'); const epoch = state.epoch; const saved = await state.store.approveTerms(state.peerId, state.caseState); if (epoch !== state.epoch) return; state.caseState = saved; renderPeer(); setStatus('Твоє підтвердження збережено.'); }
async function withdraw() { if (!state.peerId || !state.caseState) return; const epoch = state.epoch; const saved = await state.store.withdrawTerms(state.peerId, state.caseState); if (epoch !== state.epoch) return; state.caseState = saved; renderPeer(); setStatus('Твоє підтвердження відкликано.'); }
async function closeTerms() { if (!state.peerId || !state.caseState) return; const epoch = state.epoch; const dashboard = await state.store.closeTerms(state.peerId, state.caseState); if (epoch !== state.epoch) return; state.dashboard = dashboard; state.caseState = null; state.termsDirty = false; fillCurrentTerms(null); ui.inviteForm.reset(); renderAll(); setStatus('Умови закрито, історію збережено. Новий обмін потребує нових підтверджень.'); }
async function invite(event) { event.preventDefault(); if (!state.peerId) return; const epoch = state.epoch; const fields = formFields(ui.inviteForm); const proposedAt = new Date(fields.proposed_at); if (!Number.isFinite(proposedAt.valueOf())) throw new Error('Вкажи коректний час.'); const dash = await state.store.sendInvitation(state.peerId, fields.note, { proposed_at: proposedAt.toISOString(), duration_minutes: Number(fields.duration_minutes), meeting_place: fields.meeting_place }); if (epoch !== state.epoch) return; state.dashboard = dash; renderAll(); setStatus('Запрошення надіслано. Воно ще не є прийнятою зустріччю.'); }
async function respond(id, status) { const epoch = state.epoch; const dashboard = await state.store.respondInvitation(id, status); if (epoch !== state.epoch) return; state.dashboard = dashboard; renderAll(); setStatus(status === 'accepted' ? 'Запрошення прийнято. Розмова доступна обом.' : 'Запрошення відхилено.'); }
function renderTranscript(conversation) { clear(ui.transcript); for (const message of conversation.messages || []) { const card = el('article', '', { class: 'real-message' }); card.append(el('small', `${nameFor(message.sender_id)} · ${dateTime(message.created_at)}`), el('p', asText(message.body || message.text))); ui.transcript.append(card); } if (!ui.transcript.childElementCount) appendEmpty(ui.transcript, 'Повідомлень ще немає.'); }
async function selectConversation(id) { clearAddress(); addressUI.panel.hidden = true; clearOutcomes(); state.conversationPeer = null; const changed = state.meetingId !== id; state.meetingId = id; state.epoch++; const epoch = state.epoch; const request = ++conversationRequest; if (changed) { clear(ui.transcript); clear(ui.review); clear(ui.peer); ui.termsForm.reset(); ui.inviteForm.reset(); ui.approveCheck.checked = false; state.peerId = null; state.caseState = null; state.termsDirty = false; state.reviewKey = null; ui.messageForm.reset(); state.messageDraftMeeting = id; } const result = await state.store.conversation(id); if (epoch !== state.epoch || request !== conversationRequest) return; for (const panel of ['real-people-panel', 'real-cases-panel', 'real-meetings-panel']) $(panel).open = false; ui.peer.hidden = true; ui.terms.hidden = true; ui.invite.hidden = true; ui.conversation.hidden = false; renderTranscript(result); state.conversationPeer = [result.meeting.sender_id, result.meeting.recipient_id].find(id => id !== state.dashboard.own.id); syncOutcomesEntry(); syncAddressEntry(); setStatus('Показано приватну розмову після прийнятого запрошення.'); }
async function sendMessage(event) { event.preventDefault(); if (!state.meetingId) return; const epoch = state.epoch; const request = ++conversationRequest; const text = ui.message.value.trim(); if (!text) return; const result = await state.store.sendConversation(state.meetingId, text); if (epoch !== state.epoch || request !== conversationRequest) return; ui.messageForm.reset(); renderTranscript(result); setStatus('Повідомлення надіслано й прочитано з сервера.'); }
function renderAll() { renderPeople(); renderCases(); renderMeetings(); if (state.peerId && !state.meetingId && !state.termsDirty) { state.caseState = caseFor(state.peerId); renderPeer(); } syncOutcomesEntry(); syncAddressEntry(); }
async function refresh({ quiet = false } = {}) {
  const epoch = state.epoch, dashboard = await state.store.dashboard(); if (epoch !== state.epoch) return;
  state.dashboard = dashboard; ui.blocked.hidden = true; ui.auth.hidden = true; ui.content.hidden = false; renderAll();
  if (state.meetingId) { const request = ++conversationRequest; const result = await state.store.conversation(state.meetingId); if (epoch !== state.epoch || request !== conversationRequest) return; renderTranscript(result); }
  if (!quiet) setStatus('Дані оновлено з сервера.');
}
function consumeMeetingHint() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has('meeting')) return null;
  // A disposable hint, never consent or permission. Clear before any API read.
  history.replaceState(history.state, '', location.pathname + location.search);
  const id = params.get('meeting');
  return [...params].length === 1 && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id) ? id.toLowerCase() : '';
}
async function openMeetingHint(id) {
  const meeting = state.dashboard?.meetings.find(row => row.id === id);
  if (!meeting || meeting.status !== 'accepted' || ![meeting.sender_id, meeting.recipient_id].includes(state.dashboard.own.id)) {
    setStatus('Ця розмова недоступна. Вибери прийняту зустріч зі свого списку.'); return;
  }
  const selection = selectConversation(id), epoch = state.epoch;
  await selection;
  if (epoch !== state.epoch || state.meetingId !== id || !state.dashboard) return;
  if (!addressUI.panel.hidden) { addressUI.panel.open = true; await openAddress(); }
}
async function boot() {
  const meetingHint = consumeMeetingHint();
  populateTags();
  try { const response = await fetch('/config.json', { cache: 'no-store' }); if (!response.ok) throw new Error('config'); const config = await response.json(); assertRealJourneyGate(config); state.outcomesEnabled = config.caseOutcomesEnabled === true; state.addressEnabled = config.meetingAddressEnabled === true; state.store = new RealJourneyStore(config); await refresh(); if (meetingHint !== null) await run(() => openMeetingHint(meetingHint)); }
  catch (error) { if (error?.status === 401) requiresLogin(); else unavailable(); }
}
ui.termsForm.addEventListener('input', () => { state.termsDirty = true; syncModeEditor(); }); ui.termsForm.addEventListener('change', syncModeEditor); ui.termsForm.addEventListener('submit', event => { event.preventDefault(); run(() => saveTerms(event)); });
ui.approveCheck.addEventListener('change', updateApprovalControls); ui.approve.addEventListener('click', () => run(approve)); ui.withdraw.addEventListener('click', () => run(withdraw)); ui.inviteForm.addEventListener('submit', event => { event.preventDefault(); run(() => invite(event)); }); ui.messageForm.addEventListener('submit', event => { event.preventDefault(); run(() => sendMessage(event), { keepDraft: true }); });
ui.refresh.addEventListener('click', () => run(() => refresh()));
addressUI.refresh.addEventListener('click', () => run(openAddress));
outcomeUI.refresh.addEventListener('click', () => run(openOutcomes));
outcomeUI.export.addEventListener('click', () => run(exportOutcome));
outcomeUI.socialConsent.addEventListener('change', () => { outcomeUI.socialCreate.disabled = !outcomeUI.socialConsent.checked; if (!outcomeUI.socialConsent.checked) clearSocialDraft(); });
outcomeUI.socialWording.addEventListener('change', clearSocialDraft);
outcomeUI.socialCreate.addEventListener('click', () => run(createOutcomeSocialDraft));
outcomeUI.socialSelect.addEventListener('click', () => { outcomeUI.socialText.focus(); outcomeUI.socialText.select(); setStatus('Текст виділено. Скопіюй його вручну після перевірки; Synera нічого не публікує.'); });
if (typeof CompressionStream !== 'function') { outcomeUI.compress.checked = false; outcomeUI.compress.disabled = true; }
$('real-close').addEventListener('click', () => run(closeTerms));
ui.logout.addEventListener('click', async () => { const store = state.store; requiresLogin(); try { await store.signOut(); setStatus('Ти вийшов/вийшла з Synera.'); } catch { setStatus('Локальні дані прибрано. Серверний вихід потребує повторної спроби.'); } });
let conversationRequest = 0, polling = false;
async function pollConversation() {
  if (document.visibilityState !== 'visible' || !state.meetingId || !state.dashboard || state.busy || polling) return;
  polling = true; const epoch = state.epoch, id = state.meetingId, request = ++conversationRequest;
  try { const result = await state.store.conversation(id); if (epoch === state.epoch && id === state.meetingId && request === conversationRequest) renderTranscript(result); }
  catch (error) { if (epoch === state.epoch && (error.status === 401 || error.status === 403)) requiresLogin(); }
  finally { polling = false; }
}
document.addEventListener('visibilitychange', pollConversation);
setInterval(pollConversation, 5000);
boot();
