import { RealJourneyStore, assertRealJourneyGate, materialFromEditor } from './real-journey-client.mjs';
import { CAPABILITIES } from './profile-brief.mjs';
import { meetingDirectionsUrl } from './live-location.mjs';
import { createResultCard } from './result-card.mjs';
import { draftActionScope, draftIntroOffer } from './action-scoper.mjs';
import { tr, t, known, dateLocale, getLanguage, setLanguage, initLanguage, collectStatic, mirrorText } from './real-journey-i18n.mjs';

const $ = id => document.getElementById(id);
const ui = Object.freeze({ status: $('real-status'), blocked: $('real-blocked'), auth: $('real-auth'), content: $('real-content-panel'), people: $('real-people'), cases: $('real-cases'), meetings: $('real-meetings'), peer: $('real-peer'), terms: $('real-terms'), termsForm: $('real-terms-form'), mode: $('real-mode'), hybrid: $('real-hybrid-components'), modeBoundary: $('real-mode-boundary'), money: $('real-money-terms'), paidBoundary: $('real-paid-boundary'), review: $('real-terms-review'), approveCheck: $('real-approve-check'), approve: $('real-approve'), withdraw: $('real-withdraw'), invite: $('real-invite'), inviteForm: $('real-invite-form'), conversation: $('real-conversation'), transcript: $('real-transcript'), messageForm: $('real-message-form'), message: $('real-message'), refresh: $('real-refresh'), logout: $('real-logout') });
const state = { store: null, dashboard: null, peerId: null, caseState: null, meetingId: null, busy: false, epoch: 0, termsDirty: false, termsBase: null, messageDraftMeeting: null, reviewKey: null };
Object.assign(state, { outcomesEnabled: false, conversationPeer: null, outcomeContext: null, outcomeData: null });
const outcomeUI = { panel: $('real-outcomes'), refresh: $('real-outcome-refresh'), status: $('real-outcome-status'), cards: $('real-outcome-cards'), history: $('real-outcome-history'), events: $('real-outcome-events') };
Object.assign(outcomeUI, { exportControls: $('real-outcome-export-controls'), export: $('real-outcome-export'), compress: $('real-outcome-compress') });
Object.assign(outcomeUI, { socialControls: $('real-social-controls'), socialWording: $('real-social-wording'), socialConsent: $('real-social-consent'), socialCreate: $('real-social-create'), socialOutput: $('real-social-output'), socialText: $('real-social-text'), socialSelect: $('real-social-select') });
Object.assign(state, { addressEnabled: false, addressContext: null, addressData: null, addressGeneration: 0 });
const addressUI = { panel: $('real-address'), refresh: $('real-address-refresh'), status: $('real-address-status'), cards: $('real-address-cards'), history: $('real-address-history'), events: $('real-address-events') };
// Text that depends on the display language is passed as a function and evaluated again when the language
// changes. Switching language therefore never re-renders a card: a draft, a ticked box and a retry key stay.
const bound = new WeakMap();
function bind(node, fn) { const text = document.createTextNode(fn()); node.append(text); node.setAttribute('data-tr', ''); bound.set(node, { fn, text }); }
const el = (tag, text = '', attrs = {}) => { const node = document.createElement(tag); if (typeof text === 'function') bind(node, text); else if (text) node.textContent = text; for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); return node; };
const setText = (node, text) => { node.replaceChildren(); bound.delete(node); node.removeAttribute('data-tr'); if (typeof text === 'function') bind(node, text); else node.textContent = text; };
const setStatus = text => setText(ui.status, text);
const clear = node => node.replaceChildren();
const nameFor = id => (id === state.dashboard?.own?.id ? state.dashboard.own.display_name : state.dashboard?.people?.find(person => person.id === id)?.display_name) || tr('Учасник домовленості');
const caseFor = peerId => state.dashboard?.cases?.find(row => row.participants?.includes(peerId)) || null;
const asText = value => typeof value === 'string' ? value : '';
// A message raised by our own modules is shown in the chosen language. Any other Ukrainian text gets a
// plain next step in that language instead of a sentence the person cannot read.
const say = message => known(message) ? tr(message) : getLanguage() === 'uk' || !/[\u0400-\u04FF]/.test(message) ? message : tr('Форма або сервер не прийняли ці дані. Перевір поля й спробуй ще раз.');
const errorText = error => error?.status === 401 ? tr('Сеанс завершився. Увійди знову.') : error?.status === 403 ? tr('Ця дія недоступна для поточного облікового запису.') : error?.status === 503 ? tr('Реальний шлях тимчасово недоступний.') : error?.status === 400 ? tr('Сервер не прийняв цю дію: можливий денний ліміт дій або застарілі дані. Натисни «Оновити» й перевір поля; якщо повториться, спробуй пізніше.') : error?.message ? say(error.message) : tr('Не вдалося завершити дію.');
const statusLabels = { draft: 'Чернетка', awaiting_approval: 'Очікує підтвердження', approved_for_next_step: 'Погоджено обома', pending: 'Чекає відповіді', accepted: 'Прийнято', declined: 'Відхилено', cancelled: 'Скасовано' };
const dateTime = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : tr('Час не вказано');
// «Онлайн» is the stored value of the place list; every other place is text a person chose and stays as written.
const place = value => { const text = asText(value) || 'Онлайн'; return text === 'Онлайн' ? tr(text) : text; };

function clearPrivate() {
  clearAddress(); addressUI.panel.hidden = true;
  clearOutcomes(); outcomeUI.panel.hidden = true; state.conversationPeer = null;
  state.dashboard = null; state.peerId = null; state.caseState = null; state.meetingId = null; state.epoch++;
  ui.content.hidden = true; ui.peer.hidden = true; ui.terms.hidden = true; ui.invite.hidden = true; ui.conversation.hidden = true;
  clear(ui.people); clear(ui.cases); clear(ui.meetings); clear(ui.peer); clear(ui.review); clear(ui.transcript);
  ui.termsForm.reset(); ui.inviteForm.reset(); ui.messageForm.reset(); ui.approveCheck.checked = false; state.termsDirty = false; state.messageDraftMeeting = null;
  state.reviewKey = null; state.termsBase = null; composer(true); inviteWait.remove(); syncSteps();
}
const closedNote = el('p', t('Розмову закрито: зустріч скасовано або її стан змінився. Текст у полі лишився тобі, але надіслати його сюди вже не можна.'), { class: 'real-note', id: 'real-conversation-closed' });
// The reason sits next to the disabled control, not only in the status line at the top of the page.
const composer = open => { ui.message.readOnly = !open; ui.messageForm.querySelector('button').disabled = !open; if (open) closedNote.remove(); else ui.messageForm.before(closedNote); };
const inviteWait = el('p', t('Запрошення для цієї пари вже надіслано й чекає відповіді. Його видно в розділі «Зустрічі».'), { class: 'real-note', id: 'real-invite-wait' });
// Where am I: people → shared terms → invitation → conversation. Derived from the same state the page renders.
function syncSteps() {
  const both = state.caseState?.status === 'approved_for_next_step' && Date.parse(state.caseState.expiresAt) > Date.now();
  const step = !state.dashboard ? -1 : !ui.conversation.hidden ? 3 : state.peerId ? (both ? 2 : 1) : 0;
  document.querySelectorAll('.real-steps li').forEach((item, index) => { if (index === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
}
// A cancelled meeting or an answered invitation is not a lost session: the person stays signed in,
// the transcript and any unsent text stay on screen, and only writing into the closed conversation stops.
async function resourceGone(error) {
  const conversation = error.code === 'CONVERSATION_UNAVAILABLE';
  if (conversation) { state.meetingId = null; state.epoch++; conversationRequest++; composer(false); }
  try { await refresh({ quiet: true }); }
  catch (failure) {
    if (failure?.status === 401 || failure?.status === 403) { requiresLogin(); return; }
    if (failure?.status === 503) { unavailable(); return; }
  }
  $('real-meetings-panel').open = true; syncSteps(); // the list now shows the real state of that meeting
  const tail = !conversation ? 'Список зустрічей оновлено.' : ui.message.value.trim() ? 'Твій ненадісланий текст лишився у полі: скопіюй його, якщо він потрібен.' : '';
  setStatus(() => say(error.message) + (tail ? ' ' + tr(tail) : ''));
}
function unavailable() { clearPrivate(); ui.blocked.hidden = false; ui.auth.hidden = true; setStatus(t('Реальний шлях закритий.')); }
function requiresLogin() { clearPrivate(); ui.blocked.hidden = true; ui.auth.hidden = false; setStatus(t('Потрібен активний сеанс.')); }
async function run(action, { keepDraft = false } = {}) {
  if (state.busy) return;
  partnerRequest++; // A manual action invalidates any older background partner read.
  state.busy = true; document.body.dataset.realBusy = 'true';
  const epoch = state.epoch;
  try { return await action(); }
  catch (error) {
    if (epoch !== state.epoch && !state.dashboard) return;
    if (error?.name === 'ResourceUnavailable') { await resourceGone(error); return; }
    if (error?.status === 401 || error?.status === 403) { requiresLogin(); return; }
    if (error?.status === 503) { unavailable(); return; }
    setStatus(() => errorText(error) + (keepDraft ? ' ' + tr('Твій текст лишився у полі.') : ''));
  } finally { state.busy = false; delete document.body.dataset.realBusy; }
}
function makeButton(text, fn) { const button = el('button', text, { type: 'button' }); button.addEventListener('click', () => run(fn)); return button; }
function appendEmpty(host, text) { host.append(el('p', text, { class: 'real-empty' })); }
function populateTags() { for (const select of ui.termsForm.querySelectorAll('select[name="give_tag"],select[name="take_tag"]')) for (const [id, label] of Object.entries(CAPABILITIES)) select.append(el('option', t(label), { value: id })); }
function syncModeEditor() {
  const mode = ui.mode.value, money = ui.termsForm.elements.namedItem('compensation_status').value === 'agreed_money';
  ui.hybrid.hidden = mode !== 'hybrid'; ui.money.hidden = !money;
  ui.paidBoundary.hidden = mode !== 'paid_service';
  const boundary = mode === 'joint_project' ? 'Це двосторонній пробний спільний проєкт: кожна людина вручну описує свій конкретний внесок, результат і критерій. Це не автоматичний набір команди.' : mode === 'referral' ? 'Рекомендація не створює контакту чи згоди третьої особи: підтвердь їх окремо перед дією.' : mode === 'hybrid' ? 'Поєднання зберігає лише явно вибрані компоненти; вони не замінюють окремих погоджень.' : '';
  ui.modeBoundary.textContent = boundary && tr(boundary);
}
function renderPeople() {
  clear(ui.people); const people = state.dashboard?.people || [];
  if (!people.length) return appendEmpty(ui.people, t('Наразі немає доступних профілів.'));
  const list = el('div', '', { class: 'real-list' });
  for (const person of people) {
    const card = el('article', '', { class: 'real-card' }); card.append(el('h3', asText(person.display_name) || t('Учасник')));
    card.append(el('small', asText(person.city) || t('Місто не вказано')));
    const comparison = person.comparison;
    const offered = (person.brief?.offer_tags || []).map(tag => CAPABILITIES[tag]).filter(Boolean);
    const needed = (person.brief?.need_tags || []).map(tag => CAPABILITIES[tag]).filter(Boolean);
    const listed = labels => labels.map(label => tr(label)).join(', ') || tr('не вказано');
    card.append(el('p', t('Дає: {offered}. Шукає: {needed}.', { offered: () => listed(offered), needed: () => listed(needed) })));
    card.append(el('small', t(comparison?.status === 'review_candidate' ? 'Є заявлена взаємна користь. Потрібна розмова.' : 'Умови підбору ще не збігаються.')));
    card.append(makeButton(t('Відкрити умови'), () => selectPeer(person.id)));
    list.append(card);
  } ui.people.append(list);
}
function renderCases() {
  clear(ui.cases); const cases = state.dashboard?.cases || [];
  if (!cases.length) return appendEmpty(ui.cases, t('Відкритих домовленостей немає.'));
  const list = el('div', '', { class: 'real-list' });
  for (const item of cases) {
    const peer = item.participants?.find(id => id !== state.dashboard.own?.id); if (!peer) continue;
    const card = el('article', '', { class: 'real-card' });
    card.append(el('h3', () => nameFor(peer))); card.append(el('p', t('Редакція {version} · {status}', { version: item.version || 0, status: () => tr(statusLabels[item.status] || 'Недоступно') })));
    card.append(makeButton(t('Переглянути умови'), () => selectPeer(peer))); list.append(card);
  } ui.cases.append(list);
}
function renderMeetings() {
  clear(ui.meetings); const meetings = state.dashboard?.meetings || [];
  if (!meetings.length) return appendEmpty(ui.meetings, t('Запрошень або прийнятих розмов немає.'));
  const list = el('div', '', { class: 'real-list' });
  for (const meeting of meetings) {
    const card = el('article', '', { class: 'real-card' });
    card.append(el('h3', () => `${place(meeting.meeting_place)} · ${tr(statusLabels[meeting.status] || 'Недоступно')}`));
    card.append(el('small', () => dateTime(meeting.proposed_at)));
    if (meeting.note) card.append(el('p', meeting.note));
    if (meeting.status === 'pending') {
      // Accepting needs the same live agreement that sending needed; the server refuses it otherwise.
      const mine = meeting.recipient_id === state.dashboard.own?.id, peer = mine ? meeting.sender_id : meeting.recipient_id;
      const current = caseFor(peer), agreed = current?.status === 'approved_for_next_step' && Date.parse(current.expiresAt) > Date.now();
      if (!agreed) card.append(el('p', t(mine ? 'Умови змінилися після цього запрошення. Прийняти його можна, коли обидва підтвердять поточну редакцію.' : 'Запрошення чекає: спершу обидва мають підтвердити поточну редакцію умов.'), { class: 'real-note' }), makeButton(t('Переглянути умови'), () => selectPeer(peer)));
      if (mine && agreed) card.append(makeButton(t('Прийняти'), () => respond(meeting.id, 'accepted')));
      if (mine) card.append(makeButton(t('Відхилити'), () => respond(meeting.id, 'declined')));
    }
    if (meeting.status === 'accepted') card.append(makeButton(t('Відкрити розмову'), () => selectConversation(meeting.id)));
    list.append(card);
  } ui.meetings.append(list);
}
const termLabels = { exchange: 'Взаємний обмін', joint_project: 'Спільний проєкт', paid_service: 'Оплачувана послуга', referral: 'Рекомендація', hybrid: 'Поєднання способів співпраці', agreed_money: 'Грошова винагорода', agreed_none: 'Без винагороди', agreed_exchange: 'Взаємний обмін без грошової оплати', required: 'Потрібна', not_required: 'Не потрібна', giver: 'У того, хто надає', receiver: 'У того, хто отримує', shared: 'Спільна', mutual_written_notice: 'Взаємне письмове повідомлення', either_party_before_start: 'Будь-хто до початку' };
const outcomeLabels = { pending: 'Очікує доказу', evidence_supplied: 'Доказ подано', checked_with_scope: 'Перевірено за критерієм', accepted: 'Прийнято одержувачем', declined_dispute_open: 'Є відкритий спір' };
const reasonLabels = { not_delivered: 'Результат не надано', outside_agreed_scope: 'Поза погодженим обсягом', below_acceptance_criteria: 'Критерій ще не виконано', other: 'Інша причина' };
const caseKey = current => current && `${current.caseId}/${current.version}/${current.termsHash}`;
function clearAddress() {
  state.addressGeneration++; state.addressContext = null; state.addressData = null;
  clear(addressUI.cards); clear(addressUI.events); setText(addressUI.status, ''); addressUI.history.hidden = true;
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
    if (!reviewed) return setStatus(t('Для погодження адреси потрібна відкрита домовленість.'));
    const result = await state.store.meetingAddressState(peerId, meetingId, reviewed); if (!active()) return;
    state.addressContext = { peerId, meetingId, reviewed, selected: result }; state.addressData = result; renderAddress();
    setStatus(t('Актуальний стан адреси прочитано з сервера.'));
  } catch (error) {
    if (!active()) return;
    if (error.status === 409) { clearAddress(); setStatus(t('Умови або зустріч змінились. Перевір адресу знову.')); return; }
    if (error.status === 429 || error.status >= 500 || !error.status) { setStatus(t('Не вдалося прочитати адресу. Приватна розмова доступна; перевір адресу пізніше.')); return; }
    throw error;
  }
}
async function recordAddress(context, intent) {
  const epoch = state.epoch, generation = state.addressGeneration;
  try {
    const result = await state.store.recordMeetingAddress(context.peerId, context.meetingId, context.reviewed, context.selected, intent);
    if (epoch !== state.epoch || generation !== state.addressGeneration || state.addressContext !== context) return;
    state.addressContext = { ...context, selected: result }; state.addressData = result; renderAddress();
    setStatus(t(intent.action === 'propose' ? 'Адресу запропоновано. Чекаємо окремого вибору другої людини.' : 'Твій вибір адреси збережено на сервері.'));
  } catch (error) {
    if (epoch !== state.epoch || generation !== state.addressGeneration) return;
    if (error.status === 409) { clearAddress(); setStatus(t('Пропозиція або умови змінилися. Перевір адресу й підтвердь новий вибір окремо.')); return; }
    if (error.status === 429 || error.status >= 500 || !error.status) { setStatus(t('Не вдалося зберегти адресу. Твій вибір лишився у картці; повтори цю дію пізніше.')); return; }
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
      setStatus(t('Адреса або погодження змінились. Переглянь актуальний стан перед маршрутом.')); return;
    }
    const url = meetingDirectionsUrl(result.meeting.meeting_address);
    if (url) window.location.assign(url);
  } catch (error) {
    if (!active()) return;
    if (error.status === 409) { clearAddress(); setStatus(t('Умови або зустріч змінились. Перевір адресу знову.')); return; }
    if (error.status === 429 || error.status >= 500 || !error.status) { setStatus(t('Не вдалося перевірити маршрут. Повтори свій вибір пізніше.')); return; }
    throw error;
  }
}
function renderAddress() {
  const context = state.addressContext, result = state.addressData; if (!context || !result) return;
  clear(addressUI.cards); clear(addressUI.events);
  const p = result.proposal, me = state.dashboard.own.id;
  const writable = context.reviewed.status === 'approved_for_next_step' && Date.parse(context.reviewed.expiresAt) > Date.now() &&
    Date.parse(result.meeting.proposed_at) > Date.now() && result.meeting.duration_minutes !== null;
  setText(addressUI.status, t(result.agreed ? 'Погоджено обома' : !p ? 'Адресу ще не погоджено' : !p.current ? 'Пропозиція застаріла' :
    p.decision === 'decline' ? 'Пропозицію відхилено' : p.decision === 'accept' ? 'Потрібне актуальне погодження умов' : 'Очікує вибору другої людини'));
  addressUI.status.className = result.agreed ? 'real-approval-ok' : 'real-approval-pending';
  addressUI.cards.append(el('p', t('{when} · {minutes} хв · {place}', { when: () => dateTime(result.meeting.proposed_at), minutes: result.meeting.duration_minutes || '—', place: () => place(result.meeting.meeting_place) })));
  if (result.meeting.meeting_address && !result.agreed) addressUI.cards.append(el('p', t('Попередня адреса: {address}', { address: result.meeting.meeting_address })));
  if (p) {
    const card = el('article', '', { class: 'real-card' }); card.append(el('strong', p.address), el('small', t('Пропонує: {name}', { name: () => nameFor(p.proposer_id) })));
    if (p.current && !p.decision && p.proposer_id !== me) {
      const check = el('input', '', { type: 'checkbox', name: 'accept-consent' }), label = el('label', '', { class: 'real-check' });
      label.append(check, el('span', t('Я погоджую саме цю адресу й час.')));
      const accept = el('button', t('Погодити адресу'), { type: 'button' }), decline = el('button', t('Відхилити адресу'), { type: 'button' });
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
    const route = makeButton(t('Маршрут у Google Maps ↗'), () => navigateAddress(context)); route.id = 'real-address-route';
    addressUI.cards.append(route, el('small', t('Відкриє Google Maps у цьому вікні й передасть адресу. Перевір точку на карті.')));
  }
  if (writable) {
    const host = p ? el('details', '', { id: 'real-address-editor' }) : el('div');
    if (p) host.append(el('summary', t('Запропонувати іншу адресу')));
    const form = el('form', '', { class: 'real-form' }), input = el('textarea', '', { name: 'address', required: '', maxlength: '200', rows: '2' });
    const label = el('label', t('Точна адреса або точка зустрічі')); label.append(input);
    const check = el('input', '', { type: 'checkbox', name: 'consent', required: '' }), consent = el('label', '', { class: 'real-check' });
    consent.append(check, el('span', t('Я пропоную це місце другій людині.')));
    const button = el('button', t('Запропонувати адресу'), { type: 'submit' }); button.disabled = true;
    const changed = () => { button.disabled = !check.checked || !input.value.trim(); }; input.addEventListener('input', changed); check.addEventListener('change', changed);
    let pending = null;
    form.addEventListener('submit', event => { event.preventDefault(); if (!check.checked || !input.value.trim()) return;
      const address = input.value.trim(); if (!pending || pending.address !== address) pending = { action: 'propose', intentId: crypto.randomUUID(), address, consent: true };
      run(() => recordAddress(context, pending));
    });
    form.append(label, consent, button); host.append(form); addressUI.cards.append(host);
  } else addressUI.cards.append(el('p', t('Для нового вибору потрібні актуальні підтвердження обох і майбутній час зустрічі.'), { class: 'real-note' }));
  const labels = { propose: 'запропоновано', accept: 'погоджено', decline: 'відхилено' };
  for (const event of result.events) addressUI.events.append(el('li', () => `${nameFor(event.actor_id)} · ${tr(labels[event.kind])} · ${dateTime(event.created_at)}${event.address ? ' · ' + event.address : ''}`));
  addressUI.history.hidden = result.events.length === 0;
}
function clearSocialDraft() { state.socialGeneration = (state.socialGeneration || 0) + 1; state.socialDraft = null; outcomeUI.socialText.value = ''; outcomeUI.socialOutput.hidden = true; outcomeUI.socialConsent.checked = false; outcomeUI.socialCreate.disabled = true; }
function clearOutcomes() { state.outcomeContext = null; state.outcomeData = null; clear(outcomeUI.cards); clear(outcomeUI.events); setText(outcomeUI.status, ''); outcomeUI.history.hidden = true; outcomeUI.exportControls.hidden = true; clearSocialDraft(); outcomeUI.socialControls.hidden = true; }
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
    if (!reviewed) return setStatus(t('Відкритої домовленості для цієї пари немає.'));
    const result = await state.store.outcomeState(peerId, reviewed); if (epoch !== state.epoch) return;
    state.outcomeContext = { peerId, reviewed }; state.outcomeData = result; renderOutcomes();
    setStatus(t('Результати домовленості прочитано з сервера.'));
  } catch (error) {
    if (epoch !== state.epoch) return;
    if (error?.status === 409) { setStatus(t('Домовленість змінилася. Перевір результати знову.')); return; }
    if (error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus(t('Не вдалося прочитати результати. Чат доступний; повтори перевірку пізніше.')); return;
    }
    throw error;
  }
}
async function recordOutcome(context, intent) {
  const epoch = state.epoch;
  try {
    const result = await state.store.recordOutcome(context.peerId, context.reviewed, intent);
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    state.outcomeData = result; renderOutcomes(); setStatus(t('Твою дію збережено й прочитано з сервера.'));
  } catch (error) {
    if (epoch === state.epoch && error.status === 503) { setStatus(t('Сервер результатів тимчасово недоступний. Твій текст лишився у полі; повтори цю дію пізніше.')); return; }
    if (epoch === state.epoch && error.status === 409) clearOutcomes();
    throw error;
  }
}
function outcomeForm(card, context, index, action, label, field, options = null) {
  const form = el('form', '', { class: 'real-form' }), caption = el('label', label);
  const input = options ? el('select', '', { required: '', name: field }) : el('textarea', '', { required: '', maxlength: '1000', name: field });
  if (options) { input.append(el('option', t('Обери причину'), { value: '' })); for (const [value, text] of Object.entries(options)) input.append(el('option', t(text), { value })); }
  caption.append(input); form.append(caption);
  const button = el('button', t(action === 'submit' ? 'Подати доказ' : action === 'check' ? 'Зберегти перевірку' : 'Відкрити спір'), { type: 'submit' });
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
  setText(outcomeUI.status, t('Редакція {version} · {status}', { version: result.version, status: () => result.outcome_confirmed ? tr('Усі результати прийняті одержувачами') : tr('Прийнято {accepted} з {total} результатів', { accepted, total: result.deliverables.length }) }));
  outcomeUI.status.className = result.outcome_confirmed ? 'real-approval-ok' : 'real-approval-pending';
  for (const row of result.deliverables) {
    const card = el('article', '', { class: 'real-card', 'data-outcome-index': row.index });
    card.append(el('h3', row.giver_id === state.dashboard.own.id ? t('Ти даєш') : t('{name} дає тобі', { name: () => nameFor(row.giver_id) })),
      el('p', row.target), el('p', t('Критерій: {text}', { text: row.acceptance_criteria })), el('strong', t(outcomeLabels[row.phase])));
    if (row.evidence_uri) card.append(el('p', t('Доказ: {text}', { text: row.evidence_uri })));
    if (row.scope_notes) card.append(el('p', t('Перевірка: {text}', { text: row.scope_notes })));
    if (row.reason) card.append(el('p', t(reasonLabels[row.reason])));
    if (row.phase === 'declined_dispute_open') card.append(el('p', t(row.giver_id === state.dashboard.own.id
      ? 'Одержувач відкрив спір. У цій редакції новий доказ подати не можна: обговоріть у розмові й збережіть нову редакцію умов, яку окремо підтвердять обоє, або одержувач може прийняти результат після перевірки.'
      : 'Спір відкрито тобою. Ти можеш прийняти результат пізніше; для нового доказу потрібна нова редакція умов, яку окремо підтвердять обоє.'), { class: 'real-note' }));
    if (row.phase !== 'accepted') {
      if (row.giver_id === state.dashboard.own.id && !row.evidence_uri) outcomeForm(card, context, row.index, 'submit', t('Посилання або опис доказу'), 'evidenceUri');
      if (row.receiver_id === state.dashboard.own.id && row.evidence_uri) {
        if (!row.scope_notes) outcomeForm(card, context, row.index, 'check', t('Що перевірено за погодженим критерієм'), 'scopeNotes');
        if (row.scope_notes) {
          const label = el('label', '', { class: 'real-check' }), check = el('input', '', { type: 'checkbox' });
          label.append(check, el('span', t('Я перевірила/перевірив результат за цим критерієм.')));
          const button = el('button', t('Прийняти результат'), { type: 'button' }); button.disabled = true;
          check.disabled = context.reviewed.status !== 'approved_for_next_step' || Date.parse(context.reviewed.expiresAt) <= Date.now();
          check.addEventListener('change', () => { button.disabled = check.disabled || !check.checked; });
          let intent = null;
          button.addEventListener('click', () => { if (!check.checked) return; intent ||= { action: 'accept', index: row.index, intentId: crypto.randomUUID() }; run(() => recordOutcome(context, intent), { keepDraft: true }); });
          card.append(label, button);
        }
        if (row.phase !== 'declined_dispute_open') outcomeForm(card, context, row.index, 'decline', t('Нейтральна причина'), 'reason', reasonLabels);
      }
    }
    outcomeUI.cards.append(card);
  }
  const names = { submit: 'подано доказ', check: 'перевірено критерій', accept: 'прийнято результат', decline: 'відкрито спір' };
  for (const event of result.events) outcomeUI.events.append(el('li', () => `${nameFor(event.actor_id)} · ${tr(names[event.kind])} · ${dateTime(event.created_at)}${event.kind === 'decline' ? ' · ' + tr(reasonLabels[event.payload.reason]) : ''}`));
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
    setStatus(t('Приватну копію створено. Вихідний UTF-8: {original} байт; файл: {file} байт.', { original: packed.originalBytes, file: packed.envelopeBytes }));
  } catch (error) {
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    if (error?.status === 409) { clearOutcomes(); setStatus(t('Домовленість змінилася. Перевір результати перед експортом.')); return; }
    if (error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus(t('Не вдалося створити приватний архів. Чат і твій текст збережені; повтори завантаження пізніше.')); return;
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
    state.socialDraft = draft; outcomeUI.socialText.value = draft.text.split('\n').map(line => known(line) ? tr(line) : line).join('\n'); outcomeUI.socialOutput.hidden = false;
    setStatus(t('Приватну чернетку створено з прийнятого внеску. Перевір текст та дозволи перед зовнішнім поширенням.'));
  } catch (error) {
    if (epoch !== state.epoch || state.outcomeContext !== context) return;
    if (error?.status === 401 || error?.status === 403) throw error;
    if (generation !== state.socialGeneration || !outcomeUI.socialConsent.checked) return;
    if (error?.status === 409) { clearSocialDraft(); outcomeUI.socialControls.hidden = true; setStatus(t('Домовленість змінилася. Перевір результати перед створенням чернетки.')); return; }
    if (error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus(t('Не вдалося створити приватну чернетку. Чат доступний; повтори створення пізніше.')); return;
    }
    throw error;
  }
}
async function downloadResultCard() {
  const context = state.outcomeContext, epoch = state.epoch, generation = state.socialGeneration;
  if (!context || !state.socialDraft || !outcomeUI.socialConsent.checked) return;
  const text = outcomeUI.socialText.value;
  try {
    const fresh = await state.store.socialDraft(context.peerId, context.reviewed, { wording: outcomeUI.socialWording.value });
    if (epoch !== state.epoch || state.outcomeContext !== context || generation !== state.socialGeneration ||
        !outcomeUI.socialConsent.checked || outcomeUI.socialText.value !== text) return;
    const card = createResultCard(fresh, { language: getLanguage(), text });
    const url = URL.createObjectURL(new Blob([card.html], { type: card.mimeType }));
    try { const link = el('a', '', { href: url, download: card.fileName }); link.click(); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    setStatus(t('Приватну картку завантажено. Перед поширенням перевір текст і дозволи інших людей.'));
  } catch (error) {
    if (epoch !== state.epoch || state.outcomeContext !== context || generation !== state.socialGeneration) return;
    if (error?.code === 'result_card_text_invalid') { setStatus(t('Картку не створено. Додай непорожній текст або скороти надто великий текст; твої зміни збережені.')); return; }
    if (error?.code === 'result_card_draft_invalid') { clearSocialDraft(); setStatus(t('Домовленість змінилася. Перевір результати перед створенням чернетки.')); return; }
    if (error?.status === 409) { clearSocialDraft(); setStatus(t('Домовленість змінилася. Перевір результати перед створенням чернетки.')); return; }
    if (error?.status === 401 || error?.status === 403) throw error;
    setStatus(t('Картку не завантажено. Твій текст збережений; перевір підключення й повтори.'));
  }
}
function draftTerms(kind) {
  if (state.busy || !state.dashboard || !state.peerId) return;
  const fields = Object.fromEntries(new FormData(ui.termsForm));
  const ownTags = state.dashboard.own.brief?.offer_tags || [];
  const peerTags = state.dashboard.people.find(person => person.id === state.peerId)?.brief?.offer_tags || [];
  const common = { language: getLanguage(), mode: fields.mode, subject: $('real-help-subject').value,
    dueOn: fields.due_on };
  let proposal;
  if (kind === 'intro') {
    const result = draftIntroOffer({ ...common, giveTag: fields.give_tag, takeTag: fields.take_tag,
      ownOfferTags: ownTags, peerOfferTags: peerTags, currentFields: fields });
    proposal = result.fields;
  } else {
    const scopes = [['give', ownTags], ['take', peerTags]].map(([prefix, tags]) => draftActionScope({ ...common,
      evidenceType: $('real-help-evidence').value, capabilityTag: fields[prefix + '_tag'], declaredTags: tags,
      target: fields[prefix + '_target'], acceptanceCriteria: fields[prefix + '_criteria'] }));
    if (scopes.every(scope => scope.proposal)) proposal = { give_target: scopes[0].proposal.target,
      give_criteria: scopes[0].proposal.acceptance_criteria, take_target: scopes[1].proposal.target,
      take_criteria: scopes[1].proposal.acceptance_criteria };
  }
  if (!proposal) { setStatus(t('Вкажи тему, строк і навички, які учасники заявили у своїх профілях.')); return; }
  let changed = false;
  for (const [key, value] of Object.entries(proposal)) {
    const input = ui.termsForm.elements.namedItem(key);
    if (input && !input.value.trim() && value !== input.value) { input.value = value; changed = true; }
  }
  if (changed) {
    if (!state.termsDirty) state.termsBase = state.caseState;
    state.termsDirty = true; ui.approveCheck.checked = false; updateApprovalControls();
  }
  setStatus(t('Порожні поля доповнено; твій текст збережений. Перевір і збережи нову редакцію. Згода та запрошення — окремі дії.'));
}
function renderReview(current) {
  clear(ui.review);
  const key = current ? `${current.caseId}/${current.version}/${current.termsHash}` : null;
  if (key !== state.reviewKey) ui.approveCheck.checked = false;
  state.reviewKey = key;
  if (!current) return;
  const material = current.material || {}, trial = material.trial || {}, legs = trial.deliverables || [];
  ui.review.append(el('h3', t('Редакція {version} · {status}', { version: current.version, status: () => tr(statusLabels[current.status] || 'Недоступно') })));
  ui.review.append(el('p', () => (material.components || []).map(mode => termLabels[mode] ? tr(termLabels[mode]) : mode).join(' + ')));
  const proof = el('details'); proof.append(el('summary', t('Перевірити версію')), el('p', t('Контрольна сума: {hash}', { hash: () => current.termsHash || tr('відсутня') }))); ui.review.append(proof);
  for (const leg of legs) {
    const mine = leg.giver_id === state.dashboard?.own?.id, skill = CAPABILITIES[leg.capability_tag];
    const box = el('dl'); box.append(el('dt', () => `${mine ? tr('Ти даєш') : tr('{name} дає', { name: nameFor(leg.giver_id) })}: ${skill ? tr(skill) : leg.capability_tag || tr('не вказано')}`));
    box.append(el('dd', t('Результат: {text}', { text: asText(leg.target) })), el('dd', t('Критерій: {text}', { text: asText(leg.acceptance_criteria) })));
    if (leg.effort) box.append(el('dd', t('Обсяг: {amount} {unit}', { amount: leg.effort.amount, unit: () => tr(leg.effort.unit) }))); ui.review.append(box);
  }
  for (const outcome of material.outcomes || []) {
    if (!legs.some(leg => leg.receiver_id === outcome.receiver_id && leg.capability_tag === outcome.capability_tag && leg.target === outcome.target)) {
      ui.review.append(el('p', t('Очікуваний підсумок для {name}: {target}', { name: () => nameFor(outcome.receiver_id), target: outcome.target })));
    }
  }
  if (material.compensation?.status === 'agreed_money') {
    ui.review.append(el('p', t('Винагорода: {amount} {currency}', { amount: (material.compensation.amount_minor / 100).toFixed(2), currency: material.compensation.currency })));
    ui.review.append(el('p', t('Рахунок: {value}', { value: t(material.compensation.invoice_required === true ? 'так' : material.compensation.invoice_required === false ? 'ні' : 'потрібно узгодити') })));
  }
  const details = el('dl'); details.append(el('dt', t('Строк і умови')));
  for (const [label, value] of [['Початок', trial.starts_on], ['Строк', trial.due_on], ['Компенсація', material.compensation?.status], ['Редакції', material.terms?.revision_limit], ['Конфіденційність', material.terms?.confidentiality], ['Інтелектуальна власність', material.terms?.intellectual_property], ['Скасування', material.terms?.cancellation]]) details.append(el('dd', () => `${tr(label)}: ${termLabels[value] ? tr(termLabels[value]) : value == null ? tr('не вказано') : String(value)}`));
  ui.review.append(details);
  const approvals = current.approvals || {}; for (const id of current.participants || []) ui.review.append(el('p', () => `${nameFor(id)}: ${tr(approvals[id] ? 'підтвердив(ла) цю редакцію' : 'ще не підтвердив(ла)')}`, { class: approvals[id] ? 'real-approval-ok' : 'real-approval-pending' }));
}
function renderPeer() {
  if (!state.peerId) return;
  const peerId = state.peerId;
  ui.peer.hidden = false; clear(ui.peer); ui.peer.append(el('h2', () => nameFor(peerId)), el('p', t('Ідентифікатор профілю: {id}', { id: peerId })));
  ui.terms.hidden = false; renderReview(state.caseState);
  if (!state.termsDirty) $('real-editor').open = !state.caseState;
  updateApprovalControls();
  syncOutcomesEntry();
}
function updateApprovalControls() {
  const ownId = state.dashboard?.own?.id; const approved = state.caseState?.approvals || {};
  const expired = Boolean(state.caseState && Date.parse(state.caseState.expiresAt) <= Date.now());
  const both = state.caseState?.status === 'approved_for_next_step' && Date.parse(state.caseState.expiresAt) > Date.now();
  const waiting = Boolean(state.peerId && state.dashboard?.meetings?.some(meeting => meeting.status === 'pending' && [meeting.sender_id, meeting.recipient_id].includes(state.peerId)));
  ui.invite.hidden = !both || waiting;
  if (both && waiting) ui.invite.before(inviteWait); else inviteWait.remove();
  ui.approve.disabled = expired || !state.caseState || !ui.approveCheck.checked || Boolean(approved[ownId]);
  ui.approveCheck.disabled = expired;
  ui.termsForm.querySelector('button[type=submit]').disabled = expired;
  $('real-close').hidden = !state.caseState;
  $('real-close').disabled = !state.caseState;
  ui.withdraw.disabled = !state.caseState || !approved[ownId];
  syncSteps();
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
  ui.conversation.hidden = true; clear(ui.transcript); ui.messageForm.reset(); state.messageDraftMeeting = null; syncSteps(); setStatus(t('Завантажуємо поточну редакцію умов…'));
  const current = await state.store.pairState(peerId); if (epoch !== state.epoch) return;
  state.caseState = current; fillCurrentTerms(current); state.termsDirty = false; state.termsBase = null; renderPeer(); setStatus(t(current ? 'Показано поточну редакцію. Прочитай її перед підтвердженням.' : 'Нові умови порожні: заповни їх вручну.'));
}
function formFields(form) { const data = new FormData(form), fields = Object.fromEntries(data.entries()); fields.components = data.getAll('components'); return fields; }
async function saveTerms(event) {
  event.preventDefault(); if (!state.peerId) return;
  const epoch = state.epoch, actor = state.dashboard.own.id;
  const fields = formFields(ui.termsForm), material = materialFromEditor(actor, state.peerId, fields);
  let saved;
  try { saved = await state.store.saveTerms(state.peerId, material, state.termsDirty ? state.termsBase : state.caseState); }
  catch (error) {
    if (epoch !== state.epoch) return;
    // A transient write failure does not prove logout, or even that the write failed.
    // Keep only this actor's in-memory draft and its original CAS base; never auto-retry or approve.
    if (error?.status === 503 && error?.code === 'data_unavailable' && state.dashboard?.own?.id === actor && state.store.user?.id === actor) {
      setStatus(t('Збереження умов не підтверджено. Текст лишився у формі. Натисни «Оновити» й перевір домовленість перед повтором: зміни могли вже зберегтися.'));
      return;
    }
    throw error;
  }
  if (epoch !== state.epoch) return;
  state.caseState = saved; state.termsDirty = false; state.termsBase = null; renderPeer();
  setStatus(t('Нову редакцію збережено. Обидва підтвердження потрібно зробити окремо.'));
}
async function approve() { if (!state.peerId || !ui.approveCheck.checked || !state.caseState) return setStatus(t('Постав позначку лише після читання поточної редакції.')); const epoch = state.epoch; const saved = await state.store.approveTerms(state.peerId, state.caseState); if (epoch !== state.epoch) return; state.caseState = saved; renderPeer(); setStatus(t('Твоє підтвердження збережено.')); }
async function withdraw() { if (!state.peerId || !state.caseState) return; const epoch = state.epoch; const saved = await state.store.withdrawTerms(state.peerId, state.caseState); if (epoch !== state.epoch) return; state.caseState = saved; renderPeer(); setStatus(t('Твоє підтвердження відкликано.')); }
async function closeTerms() { if (!state.peerId || !state.caseState) return; const epoch = state.epoch; const dashboard = await state.store.closeTerms(state.peerId, state.caseState); if (epoch !== state.epoch) return; state.dashboard = dashboard; state.caseState = null; state.termsDirty = false; fillCurrentTerms(null); ui.inviteForm.reset(); renderAll(); setStatus(t('Умови закрито, історію збережено. Новий обмін потребує нових підтверджень.')); }
async function invite(event) { event.preventDefault(); if (!state.peerId) return; const epoch = state.epoch; const fields = formFields(ui.inviteForm); const proposedAt = new Date(fields.proposed_at); if (!Number.isFinite(proposedAt.valueOf())) throw new Error('Вкажи коректний час.'); const dash = await state.store.sendInvitation(state.peerId, fields.note, { proposed_at: proposedAt.toISOString(), duration_minutes: Number(fields.duration_minutes), meeting_place: fields.meeting_place }); if (epoch !== state.epoch) return; state.dashboard = dash; ui.inviteForm.reset(); renderAll(); setStatus(t('Запрошення надіслано. Воно ще не є прийнятою зустріччю.')); }
async function respond(id, status) {
  const epoch = state.epoch; let dashboard;
  try { dashboard = await state.store.respondInvitation(id, status); }
  catch (error) {
    if (error?.code !== 'INVITATION_NEEDS_CURRENT_APPROVALS') throw error;
    // Show the server's current agreement so the card offers the real next action, then explain.
    await refresh({ quiet: true }); if (epoch === state.epoch) setStatus(() => say(error.message)); return;
  }
  if (epoch !== state.epoch) return; state.dashboard = dashboard; renderAll(); setStatus(t(status === 'accepted' ? 'Запрошення прийнято. Розмова доступна обом.' : 'Запрошення відхилено.'));
}
function renderTranscript(conversation) {
  const messages = conversation.messages || [], cards = Array.from(ui.transcript.children);
  const stamp = message => `${nameFor(message.sender_id)} · ${dateTime(message.created_at)}`;
  // An unchanged read must not disturb the text the person is reading/selecting.
  const unchanged = messages.length > 0 && cards.length === messages.length && messages.every((message, index) => {
    const card = cards[index];
    return card.classList.contains('real-message') && card.querySelector('small')?.textContent === stamp(message) && card.querySelector('p')?.textContent === asText(message.body || message.text);
  });
  if (unchanged) return;
  clear(ui.transcript); for (const message of messages) { const card = el('article', '', { class: 'real-message' }); card.append(el('small', () => stamp(message)), el('p', asText(message.body || message.text))); ui.transcript.append(card); } if (!ui.transcript.childElementCount) appendEmpty(ui.transcript, t('Повідомлень ще немає.'));
}
async function selectConversation(id) { composer(true); clearAddress(); addressUI.panel.hidden = true; clearOutcomes(); state.conversationPeer = null; const changed = state.meetingId !== id; state.meetingId = id; state.epoch++; const epoch = state.epoch; const request = ++conversationRequest; if (changed) { clear(ui.transcript); clear(ui.review); clear(ui.peer); ui.termsForm.reset(); ui.inviteForm.reset(); ui.approveCheck.checked = false; state.peerId = null; state.caseState = null; state.termsDirty = false; state.reviewKey = null; ui.messageForm.reset(); state.messageDraftMeeting = id; } const result = await state.store.conversation(id); if (epoch !== state.epoch || request !== conversationRequest) return; for (const panel of ['real-people-panel', 'real-cases-panel', 'real-meetings-panel']) $(panel).open = false; ui.peer.hidden = true; ui.terms.hidden = true; ui.invite.hidden = true; inviteWait.remove(); ui.conversation.hidden = false; syncSteps(); renderTranscript(result); state.conversationPeer = [result.meeting.sender_id, result.meeting.recipient_id].find(id => id !== state.dashboard.own.id); syncOutcomesEntry(); syncAddressEntry(); setStatus(t('Показано приватну розмову після прийнятого запрошення.')); }
async function sendMessage(event) {
  event.preventDefault(); if (!state.meetingId) return;
  const epoch = state.epoch, request = ++conversationRequest, draft = ui.message.value, text = draft.trim(); if (!text) return;
  try {
    const result = await state.store.sendConversation(state.meetingId, text);
    if (epoch !== state.epoch || request !== conversationRequest) return;
    const draftChanged = ui.message.value !== draft;
    if (!draftChanged) ui.messageForm.reset();
    renderTranscript(result); setStatus(() => tr('Повідомлення надіслано й прочитано з сервера.') + (draftChanged ? ' ' + tr('Новий текст лишився чернеткою.') : ''));
  } catch (error) {
    if (epoch !== state.epoch || request !== conversationRequest) return;
    if (error?.status === 401 || error?.status === 403) throw error;
    if (error?.status === 409 || error?.status === 429 || error?.status >= 500 || !error?.status) {
      setStatus(t('Доставку не підтверджено. Текст збережено; онови чат перед повторним надсиланням — повідомлення могло вже дійти.')); return;
    }
    throw error;
  }
}
function renderAll() { renderPeople(); renderCases(); renderMeetings(); if (state.peerId && !state.meetingId && !state.termsDirty) { state.caseState = caseFor(state.peerId); renderPeer(); } syncOutcomesEntry(); syncAddressEntry(); syncSteps(); }
async function refresh({ quiet = false } = {}) {
  const epoch = state.epoch, actor = state.dashboard?.own?.id;
  try {
    const dashboard = await state.store.dashboard(); if (epoch !== state.epoch) return;
    state.dashboard = dashboard; ui.blocked.hidden = true; ui.auth.hidden = true; ui.content.hidden = false; renderAll();
    if (state.meetingId) { const request = ++conversationRequest; const result = await state.store.conversation(state.meetingId); if (epoch !== state.epoch || request !== conversationRequest) return; renderTranscript(result); }
    if (!quiet) setStatus(t('Дані оновлено з сервера.'));
  } catch (error) {
    if (epoch !== state.epoch) return;
    const temporary = error?.status >= 500 || ['TypeError', 'TimeoutError', 'AbortError'].includes(error?.name);
    // A failed read is not logout. Keep only this still-current actor's in-memory
    // work; authorization failures and cold start retain their existing gates.
    if (temporary && actor && state.dashboard?.own?.id === actor && state.store.user?.id === actor) {
      setStatus(t('Дані не вдалося оновити. Показані попередні дані; твій незбережений текст лишився тут. Спробуй «Оновити» ще раз.'));
      return;
    }
    throw error;
  }
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
    setStatus(t('Ця розмова недоступна. Вибери прийняту зустріч зі свого списку.')); return;
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
ui.termsForm.addEventListener('input', () => { if (!state.termsDirty) state.termsBase = state.caseState; state.termsDirty = true; syncModeEditor(); }); ui.termsForm.addEventListener('change', syncModeEditor); ui.termsForm.addEventListener('submit', event => { event.preventDefault(); run(() => saveTerms(event)); });
ui.approveCheck.addEventListener('change', updateApprovalControls); ui.approve.addEventListener('click', () => run(approve)); ui.withdraw.addEventListener('click', () => run(withdraw)); ui.inviteForm.addEventListener('submit', event => { event.preventDefault(); run(() => invite(event)); }); ui.messageForm.addEventListener('submit', event => { event.preventDefault(); run(() => sendMessage(event), { keepDraft: true }); });
ui.refresh.addEventListener('click', () => run(() => refresh()));
addressUI.refresh.addEventListener('click', () => run(openAddress));
outcomeUI.refresh.addEventListener('click', () => run(openOutcomes));
outcomeUI.export.addEventListener('click', () => run(exportOutcome));
outcomeUI.socialConsent.addEventListener('change', () => { outcomeUI.socialCreate.disabled = !outcomeUI.socialConsent.checked; if (!outcomeUI.socialConsent.checked) clearSocialDraft(); });
outcomeUI.socialWording.addEventListener('change', clearSocialDraft);
outcomeUI.socialCreate.addEventListener('click', () => run(createOutcomeSocialDraft));
$('real-social-card').addEventListener('click', () => run(downloadResultCard));
$('real-help-intro').addEventListener('click', () => draftTerms('intro'));
$('real-help-scope').addEventListener('click', () => draftTerms('scope'));
outcomeUI.socialSelect.addEventListener('click', () => { outcomeUI.socialText.focus(); outcomeUI.socialText.select(); setStatus(t('Текст виділено. Скопіюй його вручну після перевірки; Synera нічого не публікує.')); });
if (typeof CompressionStream !== 'function') { outcomeUI.compress.checked = false; outcomeUI.compress.disabled = true; }
$('real-close').addEventListener('click', () => run(closeTerms));
ui.logout.addEventListener('click', async () => { const store = state.store; requiresLogin(); try { await store.signOut(); setStatus(t('Ти вийшов/вийшла з Synera.')); } catch { setStatus(t('Локальні дані прибрано. Серверний вихід потребує повторної спроби.')); } });
let conversationRequest = 0, partnerRequest = 0, polling = false;
function renderPartnerRead(current, meetings) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const revised = caseKey(current) !== caseKey(state.caseState);
  const changed = !same(current, state.caseState);
  const previous = state.dashboard;
  const cases = previous.cases.filter(row => !row.participants.includes(state.peerId));
  if (current) cases.push(current);
  state.dashboard = { ...previous, cases, meetings };
  state.caseState = current;
  // Read state is separate from the base of an unfinished edit. Saving an old
  // draft still hits the existing compare-and-swap conflict, never a silent rebase.
  if (revised && !state.termsDirty) fillCurrentTerms(current);
  if (changed) renderReview(current);
  if (!same(previous.cases, cases)) renderCases();
  if (!same(previous.meetings, meetings) || !same(previous.cases, cases)) renderMeetings();
  updateApprovalControls(); syncOutcomesEntry(); syncAddressEntry();
  const reply = meetings.find(meeting => [meeting.sender_id, meeting.recipient_id].includes(state.peerId) &&
    previous.meetings.find(row => row.id === meeting.id)?.status !== meeting.status);
  if (revised) setStatus(t(state.termsDirty ? 'Умови партнера змінилися. Твою чернетку збережено; звір нову редакцію перед збереженням.' : 'Умови партнера оновлено. Прочитай нову редакцію перед окремим підтвердженням.'));
  else if (reply) { const next = reply.status === 'accepted' ? 'Можеш відкрити приватну розмову.' : reply.status === 'pending' ? 'Відповідь потребує окремого вибору.' : 'Переглянь список зустрічей.';
    setStatus(() => tr('Запрошення: {status}.', { status: tr(statusLabels[reply.status] || 'Недоступно') }) + ' ' + tr(next)); }
  else if (changed) setStatus(t(current?.status === 'approved_for_next_step' ? 'Умови погоджено обома. Можеш надіслати запрошення.' : 'Погодження умов оновлено. Переглянь стан кожного учасника.'));
}
async function pollConversation() {
  if (document.visibilityState !== 'visible' || (!state.meetingId && !state.peerId) || !state.dashboard || state.busy || polling) return;
  polling = true; const epoch = state.epoch, id = state.meetingId, peerId = state.peerId, request = id ? ++conversationRequest : ++partnerRequest;
  const active = () => epoch === state.epoch && (id ? id === state.meetingId && request === conversationRequest : peerId === state.peerId && !state.meetingId && request === partnerRequest && !state.busy);
  try {
    if (!state.meetingId) {
      const [current, meetings] = await Promise.all([state.store.pairState(peerId), state.store.meetings()]);
      if (active()) renderPartnerRead(current, meetings);
    } else {
      const result = await state.store.conversation(id); if (active()) renderTranscript(result);
    }
  }
  catch (error) {
    if (!active()) return;
    // run() skips while another action is busy; the next poll then reports the closure again.
    if (error?.name === 'ResourceUnavailable') await run(() => resourceGone(error));
    else if (error.status === 401 || error.status === 403) requiresLogin();
  }
  finally { polling = false; }
}
document.addEventListener('visibilitychange', pollConversation);
setInterval(pollConversation, 5000);
// The pinned status line is one line or six, depending on the message, the language and the text size.
// Reserve exactly its height above anything scrolled into view, so it never lies over the focused control.
if (typeof ResizeObserver === 'function') new ResizeObserver(() => document.documentElement.style.setProperty('--real-status-space', Math.ceil(ui.status.getBoundingClientRect().height) + 24 + 'px')).observe(ui.status);
// Display language. Collected before any data is shown, so only the page's own wording is ever translated.
const languageSelect = $('real-language'), staticText = collectStatic(document);
const viewStatus = mirrorText(document.querySelector('[data-atelier-controls] [role="status"]'));
function applyLanguage() {
  document.documentElement.lang = getLanguage(); languageSelect.value = getLanguage(); staticText.apply(); viewStatus.apply();
  for (const node of [...document.querySelectorAll('[data-tr]'), closedNote, inviteWait]) {
    const entry = bound.get(node); if (!entry) continue;
    try { entry.text.nodeValue = entry.fn(); } catch { /* Its data is gone; the next render replaces the node. */ }
  }
  syncModeEditor();
}
let languageStore = null; try { languageStore = window.localStorage; } catch { /* The choice then lasts for this page only. */ }
initLanguage({ search: location.search, storage: languageStore }); applyLanguage();
languageSelect.addEventListener('change', () => { setLanguage(languageSelect.value, languageStore); applyLanguage(); });
boot();
