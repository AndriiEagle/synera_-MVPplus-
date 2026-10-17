import {
  DEMO_PEOPLE, appendAIReply, appendUserMessage, completeDemo, createJourneyArchive,
  createJourneySocial, proposeMeeting, rankDemoPeople, replyScenario, respondToProposal,
  startJourney,
} from './journey-core.mjs';
import { packArchive } from './archive-codec.mjs';
import { readJourneyAICapability, requestJourneyReply } from './journey-ai-client.mjs';
import { stageJourneyHandoff } from './journey-handoff.mjs';

const $ = selector => document.querySelector(selector);
const now = () => Date.now();
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const safePersonId = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('person');

let journey = null;
let selectedPersonId = null;
let capability = { enabled: false, mode: 'unavailable', model: null, provider: null, reason: 'AI is not available.' };
let pending = false;
let dirty = false;
let view = 'discover';
const isQuiet = () => document.documentElement.dataset.syneraFocus === 'on';
const portraitFor = personId => `/portrait-${personId}.webp`;
const iconFor = role => ({ automation: '/icon-code-xml.svg', design: '/icon-pen-tool.svg', sales: '/icon-megaphone.svg' }[role] || '/icon-handshake.svg');
const quietLabel = value => ({ automation: 'Код / автоматизація', design: 'Дизайн', sales: 'Продажі' }[value] || value);
const quietTags = tags => tags.length ? tags.map(quietLabel).join(', ') : 'не уточнено';

function mineProfile() {
  return {
    id: 'you', fitConsent: $('#journey-fit-consent').checked, publicVisibility: $('#journey-visibility').checked,
    gives: [$('#journey-give').value], needs: [$('#journey-need').value], languages: [$('#journey-language').value],
    modes: ['joint_project'], timePreferences: ['weekday_afternoon'],
    preferences: { communication: { enabled: true, values: [$('#journey-communication').value] }, work: { enabled: true, values: ['collaborative'] } },
  };
}

function setStatus(text = '') { $('#journey-status').textContent = text; }
function setPending(value) {
  pending = value;
  for (const control of ['#journey-send', '#journey-open-proposal', '#journey-change-person']) $(control).disabled = value;
}
function focusPhase(phase) {
  const heading = { discover: '#discover-title', chat: '#conversation-title', proposal: '#terms-title', completed: '#result-title' }[phase];
  $(heading)?.focus();
}
function phase() {
  if (!journey) return 'discover';
  if (journey.phase === 'completed') return 'completed';
  if (journey.phase === 'proposal' || journey.phase === 'agreed') return 'proposal';
  return view === 'proposal' ? 'proposal' : 'chat';
}
function renderProgress() {
  const current = phase();
  for (const item of document.querySelectorAll('.journey-progress [data-phase]')) {
    if (item.dataset.phase === current) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
}
function showSection(selector, visible) { $(selector).hidden = !visible; }
function renderTranscript() {
  const target = $('#journey-transcript'); target.replaceChildren();
  for (const message of journey.messages) {
    const article = node('article', undefined, 'journey-message'); article.dataset.author = message.author;
    const author = message.author === 'you' ? 'Ти' : message.author === 'L' ? 'AI-порада' : DEMO_PEOPLE.find(person => person.id === journey.personId).name;
    const source = message.source === 'scenario' ? 'сценарій' : message.source === 'ai' ? 'AI advisory' : 'твоє повідомлення';
    article.append(node('small', `${author} · ${source}`), node('p', message.text)); target.append(article);
  }
  target.scrollTop = target.scrollHeight;
}
function quietImage(src, className) {
  const image = node('img', undefined, className); image.src = src; image.alt = '';
  return image;
}
function quietButton(button, icon) {
  if (isQuiet()) button.prepend(quietImage(icon, 'journey-action-icon'));
  return button;
}
function renderQuietControlIcons() {
  const controls = [
    ['#journey-send', '/icon-message-circle.svg'], ['#journey-open-proposal', '/icon-handshake.svg'],
    ['#journey-export', '/icon-archive.svg'],
  ];
  for (const [selector, icon] of controls) {
    const control = $(selector); control.querySelector('.journey-action-icon')?.remove();
    if (isQuiet()) control.prepend(quietImage(icon, 'journey-action-icon'));
  }
}
function renderProposal() {
  const target = $('#journey-proposal'); target.replaceChildren();
  const proposal = journey?.proposal;
  if (!proposal) { target.hidden = true; $('#journey-complete').hidden = true; return; }
  target.hidden = false;
  target.append(node('h3', `Версія ${proposal.revision}`));
  target.append(node('p', `${proposal.place} · ${proposal.when} · ${proposal.durationMinutes} хвилин`));
  target.append(node('p', proposal.scope));
  const approvals = proposal.approvals || {};
  target.append(node('p', `Твоє підтвердження: ${approvals.you?.revision === proposal.revision ? 'так, поточна версія' : 'ще немає'}. ${DEMO_PEOPLE.find(person => person.id === journey.personId).name}: ${approvals.profile?.revision === proposal.revision ? 'так, поточна версія' : 'ще немає'}.`));
  if (proposal.status) target.append(node('p', `Стан: ${proposal.status === 'withdrawn' ? 'відкликано' : 'відмовлено'}; попередні підтвердження скасовані.`));
  if (!pending && journey.phase !== 'completed') {
    const controls = node('div', undefined, 'button-row');
    const userYes = node('button', 'Я підтверджую цю версію'); userYes.type = 'button'; userYes.disabled = approvals.you?.revision === proposal.revision;
    userYes.addEventListener('click', () => answerProposal('you', 'yes'));
    const userWithdraw = node('button', 'Відкликати моє підтвердження'); userWithdraw.type = 'button'; userWithdraw.disabled = !approvals.you;
    userWithdraw.addEventListener('click', () => answerProposal('you', 'withdraw'));
    const profileYes = node('button', `${DEMO_PEOPLE.find(person => person.id === journey.personId).name}: сценарне «так»`); profileYes.type = 'button'; profileYes.disabled = approvals.profile?.revision === proposal.revision;
    profileYes.addEventListener('click', () => answerProposal('profile', 'yes'));
    const profileNo = node('button', 'Сценарна відмова'); profileNo.type = 'button'; profileNo.addEventListener('click', () => answerProposal('profile', 'no'));
    controls.append(userYes, userWithdraw, profileYes, profileNo); target.append(controls);
  }
  $('#journey-complete').hidden = journey.phase !== 'agreed';
}
function renderResult() {
  if (!journey?.session) return;
  const facts = $('#journey-facts'); facts.replaceChildren();
  facts.append(node('h3', 'Локальний демонстраційний результат'));
  for (const fact of journey.session.outcome.facts) facts.append(node('p', fact.text));
  $('#journey-social').textContent = createJourneySocial(journey).text;
}
function render() {
  const current = phase(); renderProgress();
  showSection('#journey-discover', current === 'discover');
  showSection('#journey-conversation', current === 'chat');
  showSection('#journey-terms', current === 'proposal');
  showSection('#journey-result', current === 'completed');
  renderQuietControlIcons();
  if (journey) {
    const person = DEMO_PEOPLE.find(candidate => candidate.id === journey.personId);
    $('#conversation-title').textContent = `Розмова з ${person.name}.`;
    $('#journey-person-context').textContent = isQuiet()
      ? `${person.name} · вигаданий профіль (${quietLabel(person.role)}). Умови й згода нижче діють лише в синтетичному сценарії.`
      : `${person.name} — вигаданий ${person.role}-профіль. Відповіді та згода нижче є лише частиною цього синтетичного сценарію.`;
    renderTranscript(); renderProposal(); renderResult();
  }
}
function activatePhase(nextPhase, status) { view = nextPhase; render(); setStatus(status); focusPhase(nextPhase); }
function formatReasons(entry) {
  const status={matched:'збігається',mismatch:'потребує уточнення',unknown:'ще невідомо'};
  const preferences=[['language','Мова'],['communication','Спілкування'],['work','Стиль роботи']].map(([key,label])=>`${label}: ${status[entry.explanation.preferences[key].status]||'ще невідомо'}.`);
  return [...(entry.reasons.length?entry.reasons:['Заявлені дані не дали повної взаємності; це не оцінка людини.']),...preferences].join(' ');
}
function quietMatchDetail(entry) {
  const preferences = entry.explanation.preferences;
  const status = { matched: 'збігається', mismatch: 'потребує уточнення', unknown: 'ще невідомо' };
  return `Заявлені напрями: ти можеш дати ${quietTags(entry.explanation.complementarity.toB.tags)}, а співрозмовник — ${quietTags(entry.explanation.complementarity.toA.tags)}. Мова: ${status[preferences.language.status]}. Спілкування: ${status[preferences.communication.status]}.`;
}
function choosePerson(personId) {
  if (pending) return;
  const matches = rankDemoPeople(mineProfile());
  if (!matches.some(match => match.person.id === personId)) { setStatus('Спершу явно дозволь локальне порівняння та видимість свого демонстраційного профілю.'); return; }
  selectedPersonId = personId;
  journey = startJourney({ personId, mine: mineProfile(), at: now(), sessionId: `journey-${now()}` });
  dirty = true;
  activatePhase('chat', `Обрано ${DEMO_PEOPLE.find(person => person.id === personId).name}. Це локальний синтетичний сценарій.`);
}
function renderMatches() {
  const target = $('#journey-matches'); const markers = $('#journey-markers'); target.replaceChildren(); markers.replaceChildren();
  const matches = rankDemoPeople(mineProfile());
  for (const entry of matches) {
    const marker = node('button', entry.person.name, 'atlas-marker'); marker.type = 'button'; marker.style.left = `${entry.person.x}%`; marker.style.top = `${entry.person.y}%`;
    marker.setAttribute('aria-label', `${entry.person.name} · вигаданий профіль`); if (isQuiet()) marker.prepend(quietImage('/icon-map-pin.svg', 'journey-action-icon')); marker.addEventListener('click', () => choosePerson(entry.person.id)); markers.append(marker);
    const card = node('article', undefined, 'studio-card');
    if (isQuiet()) {
      card.classList.add('journey-match'); card.append(quietImage(portraitFor(entry.person.id), 'journey-match-photo'), node('h3', `${entry.person.name} · ${quietLabel(entry.person.role)}`));
      card.append(node('p', entry.reciprocal ? `Взаємно: ти даєш ${quietTags(entry.explanation.complementarity.toB.tags)}, ${entry.person.name} дає ${quietTags(entry.explanation.complementarity.toA.tags)}.` : 'Заявлена взаємність потребує уточнення.'));
      const details = node('details'); details.append(node('summary', 'Чому це може підійти'), node('p', quietMatchDetail(entry))); card.append(details);
    } else card.append(node('h3', `${entry.person.name} · ${entry.person.role}`), node('p', formatReasons(entry)), node('p', entry.reciprocal ? 'Є заявлена взаємність у двох напрямках.' : 'Потрібно уточнити заявлені внески.'));
    const button = quietButton(node('button', `Почати сценарій з ${entry.person.name}`), iconFor(entry.person.role)); button.type = 'button'; button.addEventListener('click', () => choosePerson(entry.person.id)); card.append(button); target.append(card);
  }
  $('#journey-discovery').hidden = matches.length === 0;
  if (!matches.length) setStatus('Постав обидві явні позначки згоди, щоб переглянути лише вигадані профілі з взаємними заявленими даними.');
  const queryAllowed = safePersonId && matches.some(match => match.person.id === safePersonId);
  if (queryAllowed && !selectedPersonId) setStatus(`Профіль ${safePersonId} доступний для явного вибору нижче.`);
}
function answerProposal(actor, choice) {
  try {
    journey = respondToProposal(journey, { actor, choice, revision: journey.proposal.revision, at: now() }); dirty = true;
    const person = DEMO_PEOPLE.find(candidate => candidate.id === journey.personId);
    if (choice === 'yes') activatePhase(journey.phase === 'agreed' ? 'proposal' : 'proposal', journey.phase === 'agreed' ? 'Обидва явні підтвердження стосуються поточної версії.' : 'Твоє явне підтвердження записано лише для цієї версії.');
    else activatePhase('chat', choice === 'withdraw' ? 'Підтвердження відкликано; повернулися до розмови.' : `${person.name} відмовився в синтетичному сценарії; умов не погоджено.`);
  } catch (error) { setStatus(error.message); }
}
async function sendMessage(event) {
  event.preventDefault();
  if (pending || !journey) return;
  const input = $('#journey-message'); const text = input.value;
  if (!text.trim()) { setStatus('Напиши повідомлення перед надсиланням.'); return; }
  const previous = journey;
  try {
    setPending(true); journey = appendUserMessage(previous, { text, at: now() }); renderTranscript();
    const useAI = capability.enabled && $('#journey-ai-consent').checked;
    if (useAI) {
      setStatus('Локальна модель готує відповідь. Умови ще не погоджені.');
      const controller = new AbortController();
      const reply = await requestJourneyReply({ state: journey, text, consent: true, signal: controller.signal });
      journey = await appendAIReply(journey, { text: reply.text, at: now(), receipt: reply.receipt });
      $('#journey-receipt').textContent = `Локальний AI: ${reply.receipt.actualModel} · завершення: ${reply.receipt.finishReason} · зовнішні API: 0 · $0. Це порада, а не згода на умови.`;
    } else {
      journey = replyScenario(journey, { at: now() });
      $('#journey-receipt').textContent = 'Сценарна відповідь офлайн; мовна модель не викликалась.';
    }
    input.value = ''; dirty = true; renderTranscript(); setStatus('Повідомлення додано до локального демонстраційного транскрипту.');
  } catch (error) {
    journey = previous; renderTranscript();
    setStatus(`Повідомлення не надіслано: ${error.message}`);
  } finally { setPending(false); }
}
function startProposal() {
  if (!journey || pending) return;
  activatePhase('proposal', 'Заповни конкретні умови. Нова версія очистить усі попередні підтвердження.');
}
function submitProposal(event) {
  event.preventDefault();
  try {
    journey = proposeMeeting(journey, { place: $('#journey-place').value, when: $('#journey-when').value, durationMinutes: Number($('#journey-duration').value), scope: $('#journey-scope').value, at: now() });
    dirty = true; activatePhase('proposal', `Створена версія ${journey.proposal.revision}. Немає бронювання, платежу або запрошення реальній людині.`);
  } catch (error) { setStatus(error.message); }
}
function finishDemo() {
  try { journey = completeDemo(journey, { at: now() }); dirty = true; activatePhase('completed', 'Демонстраційний цикл завершений локально. Реальна зустріч не відбулася.'); }
  catch (error) { setStatus(error.message); }
}
async function exportArchive() {
  try {
    const archive = createJourneyArchive(journey, { at: now() }); const packed = await packArchive(archive, true);
    const url = URL.createObjectURL(new Blob([packed.json], { type: 'application/json' })); const link = node('a'); link.href = url; link.download = `synera-demo-${journey.session.sessionId}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirty = false; setStatus(`Архів підготовлено локально (${packed.envelopeBytes} байт). Стискання не є шифруванням.`);
  } catch (error) { setStatus(error.message); }
}
async function copySocial() {
  try { await navigator.clipboard.writeText($('#journey-social').textContent); setStatus('Приватну чернетку скопійовано. Вона не опублікована.'); }
  catch { $('#journey-social').focus(); setStatus('Автоматичне копіювання недоступне: виділи текст чернетки вручну.'); }
}
function openStudio() {
  try { const archive = createJourneyArchive(journey, { at: now() }); location.assign(stageJourneyHandoff(archive)); dirty = false; }
  catch (error) { setStatus(error.message); }
}
function restart() {
  if (pending) return;
  if (journey && dirty && !confirm('Новий цикл не збереже незавантажений локальний прогрес. Продовжити?')) return;
  journey = null; selectedPersonId = null; dirty = false; view = 'discover'; $('#journey-fit').reset(); $('#journey-discovery').hidden = true; $('#journey-receipt').textContent = ''; setStatus('Новий цикл ще не почався.'); activatePhase('discover', 'Обери заявлений внесок і потребу для нового локального сценарію.');
}
async function initializeCapability() {
  try { capability = await readJourneyAICapability(); }
  catch (error) { capability = { enabled: false, mode: 'unavailable', reason: error.message }; }
  const available = capability.enabled === true && ['local', 'hosted'].includes(capability.mode);
  $('#journey-ai-consent').disabled = !available;
  $('#journey-ai-availability').textContent = available ? `AI доступний: ${capability.mode}${capability.model ? ` · ${capability.model}` : ''}. Потрібна окрема позначка згоди.` : `AI недоступний: ${capability.reason || 'сервер не готовий'}. Доступний лише сценарний режим.`;
}
function setQuietMode(on) {
  const root = document.documentElement; const toggle = $('#journey-quiet-toggle');
  if (on) root.dataset.syneraFocus = 'on'; else delete root.dataset.syneraFocus;
  toggle.setAttribute('aria-pressed', String(on));
  $('#journey-preferences').open = !on;
  render();
  setStatus(on ? 'Спокійний режим увімкнено. Дані, згода й поточні умови не змінені.' : 'Спокійний режим вимкнено. Дані, згода й поточні умови не змінені.');
}
function install() {
  $('#journey-fit').addEventListener('submit', event => { event.preventDefault(); renderMatches(); });
  $('#journey-chat').addEventListener('submit', sendMessage);
  $('#journey-open-proposal').addEventListener('click', startProposal);
  $('#journey-back-chat').addEventListener('click', () => {
    if (journey?.proposal) { setStatus('Поточна пропозиція вже відкрита: змінюй її новою версією або явно відклич, щоб повернутися до розмови.'); return; }
    activatePhase('chat', 'Повернулися до розмови; умови ще не були запропоновані.');
  });
  $('#journey-proposal-form').addEventListener('submit', submitProposal);
  $('#journey-complete').addEventListener('click', finishDemo);
  $('#journey-copy').addEventListener('click', copySocial);
  $('#journey-export').addEventListener('click', exportArchive);
  $('#journey-open-studio').addEventListener('click', openStudio);
  $('#journey-restart').addEventListener('click', restart);
  $('#journey-change-person').addEventListener('click', restart);
  $('#journey-quiet-toggle').addEventListener('click', () => setQuietMode(!isQuiet()));
  addEventListener('beforeunload', event => { if (journey && dirty) { event.preventDefault(); event.returnValue = ''; } });
  initializeCapability(); render();
}

if (typeof document !== 'undefined') install();
