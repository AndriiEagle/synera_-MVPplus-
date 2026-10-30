import { getDeliverableProofStates } from './simulation-session.mjs';
import './voice-ui.mjs';

// Private links and existing actor URLs retain the unchanged live LAB path.
const params = new URLSearchParams(location.search);
if (!location.hash.includes('key=') && !params.has('person') && !params.has('lab')) {
  try { await import('./simulation-living-ui.mjs'); }
  catch(error) { document.documentElement.dataset.simulationMode='lab'; throw error; }
} else {
if (location.hash.includes('key=') && !params.has('lab')) {
  params.set('lab', '1'); history.replaceState(null, '', location.pathname + '?' + params + location.hash);
}
const $ = id => document.getElementById(id);
const termsForm = $('sim-terms');
const fields = ['mode', 'target', 'criteria', 'returnTarget', 'returnCriteria', 'due', 'amount'];
const modes = { exchange: 'Обмін', paid_service: 'Оплачувана послуга', referral: 'Рекомендація', hybrid: 'Гібрид · обмін + рекомендація', joint_project: 'Спільний проєкт' };
const stages = { self_declared: 'Очікуємо текст результату', evidence_supplied: 'Текст передано · очікуємо перевірку отримувача', checked_with_scope: 'Отримувач перевірив · очікуємо рішення', outcome_confirmed: 'Отримувач прийняв синтетичний результат' };
const actions = { message: 'повідомлення', propose: 'пропозиція умов', approve: 'згода', decline: 'відмова', deliver: 'передавання результату', check: 'перевірка', accept: 'прийняття', reject: 'відхилення', stop: 'зупинка пари', resume: 'відновлення пари' };
let personId = new URL(location.href).searchParams.get('person') || 'bot-mira';
let snapshot = null, people = [], pending = false, reading = false, generation = 0;
let draft = {}, storageKey = '', storageFailed = false, pollTimer, installPrompt;
const panels = [];
const text = (node, value) => { const next = String(value ?? ''); if (node.textContent !== next) node.textContent = next; };
function node(tag, value, className) {
  const element = document.createElement(tag);
  if (value !== undefined) text(element, value);
  if (className) element.className = className;
  return element;
}
function status(message, error = false) {
  text($('sim-status'), message);
  $('sim-status').dataset.error = String(error);
}
function saveDraft() {
  if (!storageKey) return;
  try { localStorage.setItem(storageKey, JSON.stringify(draft)); }
  catch { storageFailed = true; text($('sim-draft-note'), 'Сховище браузера недоступне. Чернетка лишається на екрані, але може зникнути після перезавантаження.'); }
}
function modeFields() {
  const mode = termsForm.elements.mode.value;
  const reciprocal = !['paid_service', 'referral'].includes(mode);
  $('sim-reciprocal').hidden = !reciprocal;
  for (const name of ['returnTarget', 'returnCriteria']) {
    termsForm.elements[name].required = reciprocal;
    termsForm.elements[name].disabled = !snapshot || !reciprocal;
  }
  $('sim-amount-label').hidden = mode !== 'paid_service';
  termsForm.elements.amount.required = mode === 'paid_service';
  termsForm.elements.amount.disabled = !snapshot || mode !== 'paid_service';
}
function materialFields(state) {
  const material = state.case?.material;
  if (!material) return { mode: 'exchange' };
  const first = material.trial.deliverables.find(item => item.giver_id === state.personId);
  const second = material.trial.deliverables.find(item => item.giver_id === 'owner');
  return { mode: material.mode, target: first.target, criteria: first.acceptance_criteria,
    returnTarget: second?.target || '', returnCriteria: second?.acceptance_criteria || '',
    due: material.trial.due_on, amount: material.compensation.amount_minor == null ? '' : String(material.compensation.amount_minor / 100) };
}
function loadDraft() {
  storageKey = `synera.sim.draft.v1:${snapshot.actor}:${personId}`;
  draft = {};
  try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) draft = saved; }
  catch { storageFailed = true; }
  $('sim-message').value = typeof draft.message === 'string' ? draft.message : '';
  const values = draft.terms || materialFields(snapshot.state);
  for (const field of fields) termsForm.elements[field].value = typeof values[field] === 'string' ? values[field] : '';
  if (!Object.hasOwn(modes, termsForm.elements.mode.value)) termsForm.elements.mode.value = 'exchange';
  for (const [index, panel] of panels.entries()) {
    panel.output.value = typeof draft[`output${index}`] === 'string' ? draft[`output${index}`] : '';
    panel.notes.value = typeof draft[`checkNotes${index}`] === 'string' ? draft[`checkNotes${index}`] : '';
  }
  modeFields();
  if (storageFailed) text($('sim-draft-note'), 'Сховище браузера недоступне або пошкоджене. Збереження чернеток після перезавантаження не гарантоване.');
}
async function api(path, payload) {
  const response = await fetch('/api/sim/' + path, { credentials: 'same-origin', cache: 'no-store',
    ...(payload === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
    signal: AbortSignal.timeout(15000) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.message || `HTTP ${response.status}`);
  return value;
}
function name(id) { return id === 'owner' ? 'Власник' : people.find(p => p.id === id)?.name || id; }
function canAct() {
  return snapshot && !pending && !snapshot.state.stopped &&
    (snapshot.actor !== 'owner' ? !snapshot.runtime.stopped : snapshot.runtime.stopped || $('sim-consent').checked);
}
function renderControls() {
  const available = Boolean(canAct()), state = snapshot?.state, current = state?.case;
  const owner = snapshot?.actor === 'owner';
  // A pair's editors must not write into the previous pair's draft while its session loads.
  for (const editor of document.querySelectorAll('#sim-message, #sim-consent, #sim-terms input, #sim-terms textarea, #sim-terms select, #sim-deliverables textarea')) editor.disabled = !snapshot;
  modeFields();
  $('sim-person').disabled = pending;
  $('sim-refresh').disabled = reading || pending;
  $('sim-send').disabled = !available;
  $('sim-propose').disabled = !available;
  const open = current && !['revoked', 'abandoned'].includes(current.status) && Date.now() < Date.parse(current.expiresAt);
  const approved = current?.approvals[snapshot?.actor];
  $('sim-approve').disabled = !available || !open || (approved?.version === current.version && approved?.termsHash === current.termsHash);
  $('sim-decline').disabled = !available || !current || ['revoked', 'abandoned'].includes(current.status);
  $('sim-run').disabled = !owner || pending || !snapshot.runtime.enabled || snapshot.runtime.busy || state.stopped || !$('sim-consent').checked;
  $('sim-stop').disabled = !owner || !snapshot?.runtime.enabled;
  $('sim-pause-pair').disabled = !owner || pending;
  text($('sim-pause-pair'), state?.stopped ? 'Відновити пару' : 'Зупинити пару');
  for (const [index, panel] of panels.entries()) {
    const deliverable = current?.material.trial.deliverables[index];
    if (!deliverable) continue;
    const stage = panel.stage;
    const ready = available && open && current.status === 'approved_for_next_step';
    const giver = snapshot.actor === deliverable.giver_id, receiver = snapshot.actor === deliverable.receiver_id;
    panel.write.hidden = !giver;
    panel.review.hidden = !receiver;
    panel.buttons.deliver.disabled = !ready || !giver || stage !== 'self_declared';
    panel.buttons.check.disabled = !ready || !receiver || stage !== 'evidence_supplied';
    panel.buttons.accept.disabled = !ready || !receiver || stage !== 'checked_with_scope';
    panel.buttons.reject.disabled = !ready || !receiver || stage === 'outcome_confirmed';
  }
}
function createPanel(index) {
  const root = node('article', undefined, 'sim-deliverable'); root.dataset.deliverableIndex = index;
  const title = node('h3'), target = node('p'), criteria = node('p', '', 'sim-muted');
  const proof = node('p', '', 'sim-badge'), outputText = node('div', '', 'sim-output');
  const write = node('div'), review = node('div'), outputLabel = node('label', 'Текст результату · лише виконавець');
  const output = node('textarea'); output.name = 'output'; output.rows = 3; outputLabel.append(output); write.append(outputLabel);
  const checkLabel = node('label', 'Що перевірено за погодженими критеріями · лише отримувач');
  const notes = node('textarea'); notes.name = 'checkNotes'; notes.rows = 2; checkLabel.append(notes); review.append(checkLabel);
  const checkText = node('p', '', 'sim-check-notes sim-muted'), decision = node('p', '', 'sim-muted');
  const buttons = {};
  for (const [action, label] of Object.entries({ deliver: 'Передати результат', check: 'Записати перевірку', accept: 'Прийняти', reject: 'Відхилити' })) {
    const button = node('button', label); button.type = 'button'; button.dataset.action = action;
    if (action === 'reject') button.className = 'quiet';
    button.disabled = true; buttons[action] = button;
    button.addEventListener('click', () => {
      const input = action === 'deliver' ? output : action === 'check' ? notes : null;
      if (input && !input.value.trim()) { status('Додай повний текст; чернетку збережено.', true); input.focus(); return; }
      void act(action, { index, ...(input ? { text: input.value } : {}) });
    });
    (action === 'deliver' ? write : review).append(button);
  }
  for (const [input, key] of [[output, `output${index}`], [notes, `checkNotes${index}`]]) {
    input.addEventListener('input', () => { draft[key] = input.value; saveDraft(); });
  }
  root.append(title, target, criteria, proof, outputText, checkText, decision, write, review); root.hidden = true;
  $('sim-deliverables').append(root);
  return { root, title, target, criteria, proof, outputText, checkText, decision, write, review, output, notes, buttons };
}
function render() {
  const { state, actor, runtime } = snapshot, person = people.find(p => p.id === personId);
  const owner = actor === 'owner';
  $('sim-picker-label').hidden = !owner;
  $('sim-runtime-controls').hidden = !owner;
  $('sim-export').hidden = !owner;
  if (owner) $('sim-export').href = '/api/sim/export?person=' + encodeURIComponent(personId);
  text($('sim-actor'), owner ? 'Ти · власник' : `${name(actor)} · AI`);
  text($('sim-person-name'), `${person?.name || personId} · вигаданий AI`);
  text($('sim-person-role'), person?.role || '');
  text($('sim-scenario'), person?.scenario || ''); text($('sim-boundary'), person?.boundary || '');
  text($('sim-backend'), !runtime.enabled ? 'HOLD · AI backend не налаштований. Відповіді не підставляються.' : runtime.busy ? 'AI backend · виконується хід' : runtime.stopped ? 'AI backend · STOP / HOLD. Живий результат ще потребує перевірки.' : 'AI backend · дозволено наступний хід за твоєю згодою');
  text($('sim-runtime-message'), runtime.message);
  const messages = $('sim-messages');
  // Keep message nodes and every input mounted; polling never replaces a focused editor.
  while (messages.children.length > state.messages.length) messages.lastElementChild.remove();
  state.messages.forEach((message, index) => {
    let row = messages.children[index];
    if (!row) { row = node('li', undefined, 'sim-message'); row.append(node('small'), node('p')); messages.append(row); }
    row.dataset.own = String(message.actor === actor);
    text(row.firstElementChild, `${name(message.actor)} · синтетичне${message.source === 'fixture' ? ' · початковий сценарій' : ''} · ${message.at}`);
    text(row.lastElementChild, message.text);
  });
  const current = state.case;
  text($('sim-case-version'), current ? `Редакція ${current.version} · ${({ draft: 'чернетка', awaiting_approval: 'очікуємо другу згоду', approved_for_next_step: 'дві згоди', revoked: 'відхилено', abandoned: 'закрито' })[current.status] || current.status} · екран ${state.revision}` : 'Чинної редакції ще немає.');
  const terms = $('sim-current-terms');
  const termFingerprint = current ? `${current.caseId}:${current.version}:${current.termsHash}` : '';
  if (terms.dataset.fingerprint !== termFingerprint) {
    terms.replaceChildren(); terms.dataset.fingerprint = termFingerprint;
    if (current) {
      const values = materialFields(state), dl = node('dl');
      const entries = [['Формат', modes[values.mode]], ['AI → власник', values.target], ['Критерії', values.criteria]];
      if (!['paid_service', 'referral'].includes(values.mode)) entries.push(['Власник → AI', values.returnTarget], ['Зустрічні критерії', values.returnCriteria]);
      entries.push(['Строк', values.due], ['Компенсація', values.mode === 'paid_service' ? `${values.amount} CHF · лише погоджена сума, оплати не підтверджено` : ['exchange', 'hybrid'].includes(values.mode) ? 'Погоджений обмін' : 'Без грошової компенсації']);
      for (const [label, value] of entries) dl.append(node('dt', label), node('dd', value));
      terms.append(dl);
      if (!draft.terms && !termsForm.contains(document.activeElement)) {
        for (const field of fields) termsForm.elements[field].value = values[field] || '';
        modeFields();
      }
    }
  }
  const approvals = $('sim-approvals');
  while (approvals.children.length < 2) approvals.append(node('li'));
  ['owner', personId].forEach((id, index) => {
    const approval = current?.approvals[id];
    const valid = approval && approval.version === current.version && approval.termsHash === current.termsHash;
    text(approvals.children[index], `${name(id)} · ${valid ? `погоджено редакцію ${current.version}` : 'ще немає згоди на чинну редакцію'} · синтетично`);
  });
  const proofs = current ? getDeliverableProofStates(current) : [];
  $('sim-results-empty').hidden = Boolean(current);
  for (const [index, panel] of panels.entries()) {
    const deliverable = current?.material.trial.deliverables[index]; panel.root.hidden = !deliverable;
    if (!deliverable) continue;
    panel.stage = proofs[index].stage;
    text(panel.title, `${index + 1}. ${name(deliverable.giver_id)} → ${name(deliverable.receiver_id)}`);
    text(panel.target, deliverable.target); text(panel.criteria, 'Критерії: ' + deliverable.acceptance_criteria);
    text(panel.proof, stages[panel.stage]);
    text(panel.outputText, state.outputs[index] || 'Текст результату ще не передано.');
    text(panel.checkText, proofs[index].scope_notes ? 'Перевірка отримувача: ' + proofs[index].scope_notes : '');
    const lastDecision = current.events.filter(event => event.version === current.version && event.deliverableIndex === index && ['deliverable_rejected', 'deliverable_accepted'].includes(event.type)).at(-1);
    text(panel.decision, lastDecision ? `${lastDecision.type === 'deliverable_rejected' ? 'Відхилено: нижче погоджених критеріїв' : 'Прийнято отримувачем'} · синтетично` : '');
  }
  const events = $('sim-events');
  while (events.children.length > state.events.length) events.lastElementChild.remove();
  state.events.forEach((event, index) => {
    if (!events.children[index]) events.append(node('li'));
    text(events.children[index], `Синтетично · r${event.revision} · ${name(event.actor)} · ${actions[event.kind] || event.kind} · ${event.at}`);
  });
  renderControls();
  document.body.dataset.revision = String(state.revision);
}
async function refresh(manual = false) {
  if (reading || pending) return;
  reading = true; const requestGeneration = generation;
  renderControls();
  try {
    const next = await api('session?person=' + encodeURIComponent(personId));
    if (requestGeneration !== generation) return;
    const first = !snapshot;
    snapshot = next;
    if (first) loadDraft();
    render();
    if (manual || first) status('Сесію оновлено. Усі події синтетичні; чернетки збережені.');
  } catch (error) { if (requestGeneration === generation) status(`${error.message} Чернетки не змінено. AI офлайн не працює.`, true); }
  finally { reading = false; renderControls(); }
}
async function act(kind, extra = {}) {
  if (pending || !snapshot) return;
  if (kind !== 'resume' && kind !== 'stop' && !canAct()) { status('Дію заблоковано: STOP або немає згоди на AI-хід. Чернетку збережено.', true); return; }
  pending = true; generation++; renderControls();
  try {
    snapshot = await api('action', { personId, revision: snapshot.state.revision, kind, ...extra });
    render(); status('Синтетичну дію збережено. Чернетка лишається у браузері.');
  } catch (error) { status(`${error.message} Чернетку збережено. Онови стан перед повтором.`, true); }
  finally { pending = false; renderControls(); }
}
function schedulePoll() {
  clearTimeout(pollTimer);
  if (document.visibilityState !== 'visible') return;
  pollTimer = setTimeout(async () => { await refresh(); schedulePoll(); }, 3000);
}
for (let index = 0; index < 2; index++) panels.push(createPanel(index));
$('sim-message').addEventListener('input', () => { draft.message = $('sim-message').value; saveDraft(); });
termsForm.addEventListener('input', () => { draft.terms = Object.fromEntries(fields.map(field => [field, termsForm.elements[field].value])); saveDraft(); modeFields(); });
termsForm.elements.mode.addEventListener('change', modeFields);
$('sim-message-form').addEventListener('submit', event => { event.preventDefault(); void act('message', { text: $('sim-message').value }); });
termsForm.addEventListener('submit', event => { event.preventDefault(); void act('propose', { terms: Object.fromEntries(fields.map(field => [field, termsForm.elements[field].value])) }); });
for (const kind of ['approve', 'decline']) $('sim-' + kind).addEventListener('click', () => void act(kind));
$('sim-refresh').addEventListener('click', () => void refresh(true));
$('sim-consent').addEventListener('change', () => {
  renderControls();
  if (!$('sim-consent').checked && snapshot?.actor === 'owner' && !snapshot.runtime.stopped) void stopAI();
});
async function stopAI() {
  try {
    await api('stop', {}); $('sim-consent').checked = false;
    if (snapshot) snapshot.runtime.stopped = true;
    status('STOP AI надіслано. Запізнілі відповіді блокує сервер.');
    await refresh();
  } catch (error) { status(`STOP не підтверджено: ${error.message}`, true); }
  renderControls();
}
$('sim-stop').addEventListener('click', () => void stopAI());
$('sim-pause-pair').addEventListener('click', async () => {
  const resume = snapshot.state.stopped;
  if (!resume) { await stopAI(); if (!snapshot.runtime.stopped) return; }
  void act(resume ? 'resume' : 'stop');
});
$('sim-run').addEventListener('click', async () => {
  if (pending || !$('sim-consent').checked || !snapshot?.runtime.enabled) return;
  pending = true; renderControls();
  try { await api('run', { personId, consent: true }); status('AI-хід запитано. Фактичний стан — у повідомленні backend.'); }
  catch (error) { status(`${error.message} AI-результат не підтверджено.`, true); }
  finally { pending = false; await refresh(); }
});
$('sim-person').addEventListener('change', async () => {
  saveDraft(); personId = $('sim-person').value; generation++; snapshot = null; $('sim-consent').checked = false;
  const url = new URL(location.href); url.searchParams.set('person', personId); history.replaceState(null, '', url);
  delete document.body.dataset.revision;
  await refresh(true);
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void refresh(); schedulePoll(); });
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
$('sim-install').addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt; installPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; } catch (error) { status(error.message, true); }
  } else status('У меню браузера обери «Встановити» / «На початковий екран». На iPhone: «Поділитися» → «На початковий екран». Потрібен HTTPS або localhost; офлайн AI не працює.');
});
async function init() {
  const fragment = new URLSearchParams(location.hash.slice(1));
  let key = fragment.get('key');
  // Erase the connection key before any fetch, including login. Never persist it.
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  try {
    if (key) { await api('login', { key }); key = null; }
    const result = await api('people'); people = result.people;
    if (!people.some(person => person.id === personId) && people.length === 1) personId = people[0].id;
    for (const person of people) { const option = node('option', `${person.name} · ${person.role} · вигаданий AI`); option.value = person.id; $('sim-person').append(option); }
    $('sim-person').value = personId;
    await refresh();
  } catch (error) { status(`${error.message} Відкрий приватне посилання симулятора.`, true); }
  finally { key = null; schedulePoll(); }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/simulation-sw.mjs', { scope: '/simulation' }).catch(error => status('Встановлення оболонки недоступне: ' + error.message, true));
  }
}
void init();
}
