import { DemoStore, SupabaseStore, ServiceError } from './data.mjs';
import { cleanProfileFields, createInvitationDraft, createPortableProfileJson, createShareCard, parseProfileImport, parseProfileCsv, profileCompletion, profileMatchHint, profileSafetyFindings } from './profile-portability.mjs';
import { demoCollaborations, hourSlot } from './simulation.mjs';
import { createPeopleMap } from './map.mjs';
import { GPT_PROFILE_PROMPT, consentRecord } from './pilot-policy.mjs';
const $ = selector => document.querySelector(selector);
const form = $('#profile-form');
const callbackUrl = new URL(location.href);
const emailCallback = { hash: callbackUrl.searchParams.get('token_hash'), type: callbackUrl.searchParams.get('type') };
if (emailCallback.hash || callbackUrl.hash || callbackUrl.searchParams.has('error')) history.replaceState(null, '', location.pathname);
let store, onlineStore, config, onlineReady = false, own, people = [], meetings = [], recipient = null, currentTab = 'people', busy = false;
let policyAction = null, importFormat = 'text', lastSimulationHour = null;
const peopleMap = createPeopleMap($('#people-map'), person => {
  $('#map-selected').textContent = `${person.display_name} · ${person.activity || person.place}`;
  document.getElementById(`person-${person.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
const labels = { pending: 'Очікує відповіді', accepted: 'Прийнято', declined: 'Відхилено' };
function message(text, error = false) { $('#notice').textContent = text; $('#notice').classList.toggle('error', error); }
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function btn(text, action, quiet = false) { const node = el('button', text, quiet ? 'quiet' : ''); node.type = 'button'; node.addEventListener('click', () => run(action)); return node; }
function closeDialog(selector) { const dialog = $(selector); if (dialog.open) dialog.close(); }
function readProfileForm() { const data = new FormData(form); return cleanProfileFields({ display_name: data.get('display_name'), city: data.get('city'), offers: data.get('offers'), seeks: data.get('seeks'), is_discoverable: data.has('is_discoverable') }); }
function fillProfileForm(profile) { const cleaned = cleanProfileFields(profile); for (const key of ['display_name', 'city', 'offers', 'seeks']) form.elements.namedItem(key).value = cleaned[key]; renderProfileProgress(); }
function renderProfileProgress() { const status = profileCompletion(readProfileForm()); $('#profile-progress').textContent = `ПРОФІЛЬ ${status.completed}/${status.total}`; $('#profile-progress').title = status.missing.length ? `Не вистачає: ${status.missing.join(', ')}` : 'Готово для знайомства'; }
function importPreviewProfile() { return cleanProfileFields({ display_name: $('#import-display-name').value, city: $('#import-city').value, offers: $('#import-offers').value, seeks: $('#import-seeks').value }); }
function currentPublicUrl() { return location.protocol === 'https:' ? location.href : ''; }
async function copyText(text, fallbackSelector) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const fallback = $(fallbackSelector);
    if (!fallback) return false;
    const previous = 'value' in fallback ? fallback.value : null;
    if (previous !== null) fallback.value = text;
    fallback.focus(); fallback.select();
    try { return document.execCommand('copy'); }
    catch { return false; }
    finally { if (previous !== null) fallback.value = previous; }
  }
}
async function run(action) {
  if (busy) return;
  busy = true; document.querySelectorAll('button').forEach(b => b.disabled = true); $('#demo-switch').disabled = true;
  try { await action(); }
  catch (error) {
    message(error instanceof ServiceError ? error.message : 'Не вдалося завершити дію. Перевір дані та з’єднання. Дані зберігаються лише після повідомлення про успіх.', true);
    if (error?.status === 402) { onlineReady = false; $('#mode').textContent = 'Онлайн недоступний'; }
    if (!store?.user) showSignedOut();
  }
  finally { busy = false; document.querySelectorAll('button').forEach(b => b.disabled = false); $('#demo-switch').disabled = false; applyAuthState(); }
}
function applyAuthState() {
  $('#auth-fields').disabled = busy || !onlineReady;
  $('#signup').hidden = !config?.registrationEnabled;
}
function tab(name) { currentTab = name; for (const value of ['people', 'profile', 'meetings']) $(`#${value}-view`).hidden = name !== value; document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === name); b.setAttribute('aria-current', b.dataset.tab === name ? 'page' : 'false'); }); }
function showSignedOut() { document.body.classList.remove('signed-in'); $('#workspace').hidden = true; $('#welcome').hidden = false; $('#logout').hidden = true; closeDialog('#invite-dialog'); closeDialog('#import-dialog'); closeDialog('#share-dialog'); closeDialog('#policy-dialog'); form.reset(); $('#password').value = ''; $('#invite-note').value = ''; $('#people-search').value = ''; $('#map-selected').textContent = ''; $('#profile-import-text').value = ''; $('#profile-share-output').value = ''; $('#import-preview').querySelectorAll('input,textarea').forEach(node => { node.value = ''; }); $('#people').replaceChildren(); $('#meetings').replaceChildren(); peopleMap.clear(); own = null; people = []; meetings = []; renderProfileProgress(); }
function setMode() {
  const demo = store.mode === 'demo';
  $('#mode').textContent = demo ? 'Демонстрація · вигадані дані' : 'Перевіряємо онлайн';
  $('#demo-controls').hidden = !demo; $('#demo-switch-label').hidden = !demo; $('#auth-form').hidden = demo;
  $('#try-demo').hidden = demo; $('#return-online').hidden = !demo || !onlineStore; $('#check-online').hidden = demo;
  $('#welcome-text').textContent = demo ? 'Твій тестовий профіль і 10 позначених демоботів. Перевір карту, взаємну користь і зустрічі.' : 'Увійди зі своїм профілем. Дані зберігаються у Synera.';
  $('#simulation-panel').hidden = !demo;
  $('#demo-collaborations').hidden = !demo;
  if (demo) {
    $('#demo-switch').replaceChildren(...store.profiles.map(profile => { const option = el('option', profile.display_name); option.value = profile.id; return option; }));
  }
  $('#registration-note').textContent = config?.registrationEnabled ? 'Новий учасник? Створи профіль і підтвердь email.' : 'Реєстрація поки закрита. Готуємо запуск для перших учасників.';
  applyAuthState();
}
async function checkOnline() {
  onlineReady = false; applyAuthState();
  try { await onlineStore.availability(); }
  catch (error) {
    $('#mode').textContent = 'Онлайн недоступний';
    $('#welcome-text').textContent = 'Онлайн-вхід тимчасово недоступний. Можна переглянути демонстрацію з вигаданими учасниками.';
    throw error instanceof ServiceError ? error : new ServiceError(503);
  }
  onlineReady = true;
  $('#mode').textContent = 'Онлайн · Supabase';
  $('#welcome-text').textContent = 'Увійди зі своїм профілем. Дані зберігаються у Synera.';
  message('Онлайн-сервіс доступний. Твій профіль прихований, доки ти не дозволиш його показ.');
  applyAuthState();
}
async function load() {
  if (store.mode === 'demo') await store.tick();
  [own, people, meetings] = await Promise.all([store.ownProfile(), store.discover(), store.meetings()]);
  $('#welcome').hidden = true; $('#workspace').hidden = false; $('#logout').hidden = false;
  document.body.classList.add('signed-in');
  for (const key of ['display_name', 'city', 'offers', 'seeks']) form.elements.namedItem(key).value = own[key];
  form.elements.namedItem('is_discoverable').checked = own.is_discoverable;
  renderProfileProgress();
  renderPeople(); renderMeetings(); renderSimulation(); tab(currentTab);
}
function renderSimulation() {
  if (store.mode !== 'demo') return;
  const at = store.simulationTime(); lastSimulationHour = hourSlot(at);
  $('#simulation-status').textContent = `${new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' }).format(at)} · Цюрих. Стан змінюється щогодини, коли демо відкрите. Вночі персонажі відпочивають. API-витрати: $0.`;
  const target = $('#collaboration-list'); target.replaceChildren();
  for (const pair of demoCollaborations(at)) {
    const card = el('article', undefined, 'meeting'); card.append(el('p', 'ДЕМО-СЦЕНАРІЙ', 'eyebrow'), el('h3', `${pair.left} + ${pair.right}`), el('p', pair.summary), el('p', pair.next_step, 'fine')); target.append(card);
  }
}
async function refreshSimulation() {
  await store.tick();
  [people, meetings] = await Promise.all([store.discover(), store.meetings()]);
  renderPeople(); renderMeetings(); renderSimulation();
}
function renderPeople() {
  const target = $('#people'); target.replaceChildren();
  const query = $('#people-search').value.toLocaleLowerCase().trim();
  const ranked = people.map(person => ({ person, hint: profileMatchHint(own, person) })).filter(({ person, hint }) =>
    (!$('#reciprocal-only').checked || hint.status === 'reciprocal') && (!query || [person.display_name, person.offers, person.seeks, person.city].join(' ').toLocaleLowerCase().includes(query)))
    .sort((a, b) => ({ reciprocal: 0, one_way: 1, no_signal: 2 }[a.hint.status] - { reciprocal: 0, one_way: 1, no_signal: 2 }[b.hint.status]));
  $('#people-count').textContent = `${ranked.length} профілів${store.mode === 'demo' ? ' · демонстрація' : ''}`;
  peopleMap.setPeople(ranked.map(row => row.person));
  if (!ranked.length) { target.append(el('p', people.length ? 'За цими фільтрами немає збігів. Зміни пошук або вимкни фільтр взаємності.' : 'Поки немає відкритих профілів. Другий учасник має створити профіль і дозволити його показ.', 'empty')); return; }
  for (const { person, hint } of ranked) {
    const card = el('article', undefined, 'person');
    card.id = `person-${person.id}`;
    if (person.is_bot) card.append(el('p', 'ДЕМОБОТ · ВИГАДАНИЙ ПЕРСОНАЖ', 'bot-label'));
    card.append(el('div', person.display_name.slice(0, 1), 'avatar'), el('h3', person.display_name), el('p', person.city || 'Місто не вказано', 'city'));
    if (person.is_bot) card.append(el('p', `${person.activity} · ${person.place}`, 'bot-activity'));
    for (const [title, value] of [['МОЖУ ДОПОМОГТИ', person.offers], ['ШУКАЮ', person.seeks]]) { const fact = el('div', undefined, 'fact'); fact.append(el('small', title), el('span', value || 'Ще не заповнено')); card.append(fact); }
    if (hint.status !== 'no_signal') {
      const fit = el('div', undefined, 'fit');
      fit.append(el('small', 'ПІДКАЗКА'), el('span', hint.summary));
      const tags = el('div', undefined, 'tags');
      for (const label of hint.label.split(', ').filter(Boolean)) tags.append(el('span', label));
      fit.append(tags); card.append(fit);
    }
    card.append(btn('Запропонувати зустріч ↗', () => { recipient = person.id; $('#invite-title').textContent = `Зустріч: ${person.display_name}`; $('#invite-note').value = createInvitationDraft(own, person); $('#invite-dialog').showModal(); }));
    target.append(card);
  }
}
function renderMeetings() {
  const target = $('#meetings'); target.replaceChildren(); $('#meeting-count').textContent = meetings.length;
  if (!meetings.length) { target.append(el('p', 'Тут з’явиться твій перший запит. Знайди людину зі спільним інтересом і запропонуй розмову.', 'empty')); return; }
  for (const meeting of meetings) {
    const incoming = meeting.recipient_id === store.user.id;
    const card = el('article', undefined, 'meeting');
    card.append(el('p', incoming ? 'Вхідний запит' : 'Твій запит', 'eyebrow'), el('h3', labels[meeting.status] ?? 'Оновлення'), el('p', meeting.note));
    if (meeting.response_note) card.append(el('p', meeting.response_note, 'bot-activity'));
    if (incoming && meeting.status === 'pending') { const actions = el('div', undefined, 'actions'); for (const [status, title] of [['accepted', 'Прийняти'], ['declined', 'Відхилити']]) actions.append(btn(title, async () => { await store.respond(meeting.id, status); await load(); message('Відповідь збережено.'); }, status === 'declined')); card.append(actions); }
    target.append(card);
  }
}

document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
function requestPolicy(action, demo) {
  policyAction = action; $('#policy-form').reset();
  $('#policy-context').textContent = demo ? 'Демо: дані й підтвердження залишаються у вкладці та скидаються після перезавантаження.' : 'Онлайн-пілот: версію правил буде збережено разом з акаунтом після підтвердження email.';
  $('#policy-dialog').showModal();
}
async function startDemo(consent) {
  store = new DemoStore({ bots: true }); setMode(); await store.signIn(); await store.acceptPolicy(consent); await load();
  message('Демо активне. Запропонуй зустріч Leo, потім натисни «Показати наступну годину»: бот відповість за взаємною користю. Усе введене залишається в цій вкладці.');
}
$('#demo-start').addEventListener('click', () => requestPolicy(startDemo, true));
$('#try-demo').addEventListener('click', () => requestPolicy(startDemo, true));
$('#policy-cancel').addEventListener('click', () => { policyAction = null; $('#policy-dialog').close(); $('#password').value = ''; });
$('#policy-dialog').addEventListener('cancel', () => { policyAction = null; $('#password').value = ''; });
$('#policy-form').addEventListener('submit', event => { event.preventDefault(); run(async () => {
  const accepted = consentRecord({ terms: $('#accept-terms').checked, privacy: $('#accept-privacy').checked });
  const action = policyAction; policyAction = null; $('#policy-dialog').close(); if (action) await action(accepted);
}); });
$('#return-online').addEventListener('click', () => run(async () => { await store.signOut(); showSignedOut(); store = onlineStore; setMode(); await checkOnline(); }));
$('#check-online').addEventListener('click', () => run(checkOnline));
$('#demo-switch').addEventListener('change', () => run(async () => { await store.signIn($('#demo-switch').value); await load(); message('Демо-учасника змінено. Дані цього сценарію залишаються лише у вкладці.'); }));
async function finishOnlineSignIn() {
  if (!store.pilotSafetyEnabled) { await store.signOut(); showSignedOut(); message('Онлайн-пілот ще потребує серверного налаштування правил і перевірки реєстрації.', true); return; }
  if (!await store.hasPolicy()) { requestPolicy(async accepted => { await store.acceptPolicy(accepted); await load(); tab('profile'); message('Правила підтверджено на сервері. Заповни профіль.'); }, false); return; }
  await load(); message('Ти увійшов. Профіль і зустрічі завантажено.'); if (!own.display_name) tab('profile');
}
$('#auth-form').addEventListener('submit', event => { event.preventDefault(); run(async () => {
  store.remember($('#remember-session').checked ? localStorage : null);
  try { await store.signIn($('#email').value.trim(), $('#password').value); } finally { $('#password').value = ''; }
  await finishOnlineSignIn();
}); });
$('#signup').addEventListener('click', () => {
  if (!$('#auth-form').reportValidity()) return;
  requestPolicy(async consent => { let ready; try { ready = await store.signUp($('#email').value.trim(), $('#password').value, consent); } finally { $('#password').value = ''; }
    if (ready) { await store.acceptPolicy(consent); await load(); tab('profile'); }
    message(ready ? 'Заповни свій профіль.' : 'Перевір пошту, підтвердь email, потім увійди. Після входу підтверди правила для збереження серверного запису.');
  }, false);
});
$('#logout').addEventListener('click', () => run(async () => { try { await store.signOut(); message('Ти вийшов.'); } finally { showSignedOut(); } }));
$('#refresh').addEventListener('click', () => run(load));
$('#advance-hour').addEventListener('click', () => run(async () => { await store.advanceHour(); await refreshSimulation(); message('Показано наступну годину симуляції. Перевір стан персонажів і відповіді в «Зустрічах».'); }));
$('#people-search').addEventListener('input', renderPeople);
$('#reciprocal-only').addEventListener('change', renderPeople);
$('#toggle-map').addEventListener('click', () => { $('#map-panel').hidden = !$('#map-panel').hidden; $('#toggle-map').setAttribute('aria-expanded', String(!$('#map-panel').hidden)); $('#toggle-map').textContent = $('#map-panel').hidden ? 'Показати карту' : 'Сховати карту'; renderPeople(); });
$('#map-zoom-in').addEventListener('click', () => peopleMap.zoom(1));
$('#map-zoom-out').addEventListener('click', () => peopleMap.zoom(-1));
$('#map-reset').addEventListener('click', () => peopleMap.reset());
$('#map-roads').addEventListener('click', () => { $('#map-roads').textContent = peopleMap.toggleRoads() ? 'Вимкнути OpenStreetMap' : 'Увімкнути OpenStreetMap'; });
setInterval(() => { if (!busy && !document.hidden && store?.user && store.mode === 'demo' && hourSlot(store.simulationTime()) !== lastSimulationHour) run(refreshSimulation); }, 60000);
form.addEventListener('input', renderProfileProgress);
form.addEventListener('submit', event => { event.preventDefault(); run(async () => { const profile = readProfileForm(); await store.saveProfile(profile); await load(); message(profile.is_discoverable ? 'Профіль збережено і видимий іншим учасникам.' : 'Профіль збережено. Видимість вимкнена.'); }); });
$('#invite-cancel').addEventListener('click', () => $('#invite-dialog').close());
$('#invite-form').addEventListener('submit', event => { event.preventDefault(); run(async () => { await store.invite(recipient, $('#invite-note').value); $('#invite-dialog').close(); await load(); tab('meetings'); message('Запит на зустріч створено.'); }); });
$('#import-profile').addEventListener('click', () => { $('#import-status').textContent = ''; $('#import-preview').hidden = true; $('#apply-import').hidden = true; $('#import-dialog').showModal(); });
$('#import-cancel').addEventListener('click', () => $('#import-dialog').close());
$('#parse-profile').addEventListener('click', () => {
  let result;
  try { result = (importFormat === 'csv' ? parseProfileCsv : parseProfileImport)($('#profile-import-text').value, { authorized: $('#profile-authorized').checked }); }
  catch (error) { $('#import-status').textContent = error.message; $('#import-preview').hidden = true; $('#apply-import').hidden = true; return; }
  $('#import-status').textContent = result.warnings.join(' ') || 'Профіль розібрано. Перевір поля перед застосуванням.';
  $('#import-preview').hidden = !['ready', 'needs_review'].includes(result.status);
  $('#apply-import').hidden = $('#import-preview').hidden;
  if (!$('#import-preview').hidden) {
    $('#import-display-name').value = result.profile.display_name;
    $('#import-city').value = result.profile.city;
    $('#import-offers').value = result.profile.offers;
    $('#import-seeks').value = result.profile.seeks;
  }
});
$('#apply-import').addEventListener('click', () => {
  if (!$('#profile-authorized').checked) { $('#import-status').textContent = 'Підтвердь право переносити цей профіль.'; return; }
  const profile = importPreviewProfile(), findings = profileSafetyFindings(profile);
  if (findings.length) { $('#import-status').textContent = 'Прибери email, телефон або ключі з полів перед застосуванням.'; return; }
  if (!profile.display_name || (!profile.offers && !profile.seeks)) { $('#import-status').textContent = 'Потрібне ім’я і хоча б одна конкретна пропозиція або потреба.'; return; }
  fillProfileForm(profile); form.elements.namedItem('is_discoverable').checked = false; $('#profile-import-text').value = ''; $('#profile-authorized').checked = false; $('#import-dialog').close(); message('Поля профілю заповнено з імпорту. Видимість вимкнена. Перевір і натисни «Зберегти профіль».');
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
const promptDetails = el('details'); promptDetails.append(el('summary', 'Перенести профіль із ChatGPT'));
const promptText = el('textarea'); promptText.id = 'gpt-profile-prompt'; promptText.readOnly = true; promptText.value = GPT_PROFILE_PROMPT; promptText.rows = 6; promptDetails.append(promptText);
promptDetails.append(btn('Скопіювати промпт для GPT', async () => { $('#import-status').textContent = await copyText(GPT_PROFILE_PROMPT, '#gpt-profile-prompt') ? 'Встав промпт у власний чат GPT, потім перенеси сюди лише отриманий JSON.' : 'Скопіюй промпт із поля вручну.'; }, true));
const importHint = el('p', 'LinkedIn: Settings & Privacy → Data privacy → Get a copy of your data. Вибери власний Profile.csv. Повний архів, контакти й посилання на чужі профілі не імпортуються.', 'fine');
importTools.append(fileLabel, importHint, promptDetails); $('#profile-source').closest('label').after(importTools);
importTools.before($('#profile-authorized').closest('label'));
const gptOption = el('option', 'ChatGPT → Synera JSON'); $('#profile-source').append(gptOption);
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]; if (!file) return;
  if (!$('#profile-authorized').checked) { $('#import-status').textContent = 'Спочатку підтвердь право на перенесення, потім вибери файл.'; fileInput.value = ''; return; }
  const csv = /\.csv$/i.test(file.name);
  if (!/\.(csv|json|txt)$/i.test(file.name) || file.size > (csv ? 50000 : 10000)) { $('#import-status').textContent = 'Вибери короткий профіль: CSV до 50 KB або JSON/TXT до 10 KB. Повний архів акаунта не підходить.'; fileInput.value = ''; return; }
  const text = await file.text(); if (!$('#profile-authorized').checked) return;
  importFormat = csv ? 'csv' : 'text'; $('#profile-import-text').maxLength = csv ? 50000 : 5000; $('#profile-import-text').value = text;
  $('#parse-profile').click(); fileInput.value = '';
});
$('#profile-import-text').addEventListener('input', () => { $('#import-preview').hidden = true; $('#apply-import').hidden = true; });
$('#profile-source').addEventListener('change', () => { importFormat = 'text'; $('#profile-import-text').maxLength = 5000; $('#import-preview').hidden = true; $('#apply-import').hidden = true; });
$('#profile-authorized').addEventListener('change', () => { if (!$('#profile-authorized').checked) { $('#import-preview').hidden = true; $('#apply-import').hidden = true; } });
$('#share-dialog .actions').append(btn('Завантажити JSON', () => {
  const blob = new Blob([createPortableProfileJson(readProfileForm())], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const link = el('a'); link.href = url; link.download = 'synera-profile.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}, true));
const rememberLabel = el('label', undefined, 'check'); const rememberInput = el('input'); rememberInput.type = 'checkbox'; rememberInput.id = 'remember-session';
rememberLabel.append(rememberInput, el('span', 'Запам’ятати на цьому особистому пристрої')); $('#auth-fields').append(rememberLabel);
$('#auth-fields').append(btn('Забув пароль', async () => {
  if (!$('#email').reportValidity() || !$('#email').value) return;
  await store.requestPasswordReset($('#email').value.trim()); message('Якщо адреса зареєстрована, перевір пошту для відновлення пароля.');
}, true));
const recoveryDialog = el('dialog'); recoveryDialog.id = 'recovery-dialog'; const recoveryForm = el('form');
const recoveryLabel = el('label', 'Новий пароль (12–128 символів)'); const recoveryInput = el('input'); recoveryInput.type = 'password'; recoveryInput.autocomplete = 'new-password'; recoveryInput.minLength = 12; recoveryInput.maxLength = 128; recoveryInput.required = true; recoveryLabel.append(recoveryInput);
const recoverySubmit = el('button', 'Зберегти новий пароль'); recoverySubmit.type = 'submit'; recoveryForm.append(el('h2', 'Відновити доступ'), recoveryLabel, recoverySubmit); recoveryDialog.append(recoveryForm); document.body.append(recoveryDialog);
recoveryForm.addEventListener('submit', event => { event.preventDefault(); run(async () => { try { await store.updatePassword(recoveryInput.value); } finally { recoveryInput.value = ''; } recoveryDialog.close(); await store.signOut(); showSignedOut(); message('Пароль змінено. Увійди з новим паролем.'); }); });
recoveryDialog.addEventListener('cancel', () => run(async () => { recoveryInput.value = ''; await store.signOut(); showSignedOut(); }));

try {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuration unavailable');
  config = await response.json();
  onlineStore = config.supabaseUrl ? new SupabaseStore(config) : null;
  store = onlineStore ?? new DemoStore({ bots: true });
  const demo = store.mode === 'demo';
  setMode();
  if (demo) message('Демонстрація без реєстрації. Тут лише вигадані учасники.');
  else await run(async () => {
    await checkOnline();
    if (emailCallback.hash) {
      await store.verifyEmailToken(emailCallback.hash, emailCallback.type); emailCallback.hash = null;
      if (emailCallback.type === 'recovery') recoveryDialog.showModal(); else await finishOnlineSignIn();
    } else {
      let storage; try { storage = localStorage; } catch {}
      if (storage && await store.restore(storage)) await finishOnlineSignIn();
    }
  });
} catch { $('#demo-start').disabled = true; $('#mode').textContent = 'Потрібне налаштування'; message('Не вдалося завантажити налаштування запуску.', true); }
