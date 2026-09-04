import { DemoStore, SupabaseStore, ServiceError } from './data.mjs';
const $ = selector => document.querySelector(selector);
const form = $('#profile-form');
let store, onlineStore, config, onlineReady = false, own, people = [], meetings = [], recipient = null, currentTab = 'people', busy = false;
const labels = { pending: 'Очікує відповіді', accepted: 'Прийнято', declined: 'Відхилено' };
function message(text, error = false) { $('#notice').textContent = text; $('#notice').classList.toggle('error', error); }
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function btn(text, action, quiet = false) { const node = el('button', text, quiet ? 'quiet' : ''); node.type = 'button'; node.addEventListener('click', () => run(action)); return node; }
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
function showSignedOut() { document.body.classList.remove('signed-in'); $('#workspace').hidden = true; $('#welcome').hidden = false; $('#logout').hidden = true; $('#invite-dialog').close(); form.reset(); $('#password').value = ''; $('#people').replaceChildren(); $('#meetings').replaceChildren(); own = null; people = []; meetings = []; }
function setMode() {
  const demo = store.mode === 'demo';
  $('#mode').textContent = demo ? 'Демонстрація · вигадані дані' : 'Перевіряємо онлайн';
  $('#demo-controls').hidden = !demo; $('#demo-switch-label').hidden = !demo; $('#auth-form').hidden = demo;
  $('#try-demo').hidden = demo; $('#return-online').hidden = !demo || !onlineStore; $('#check-online').hidden = demo;
  $('#welcome-text').textContent = demo ? 'Три вигадані профілі. Подивись, як працює знайомство.' : 'Увійди зі своїм профілем. Дані зберігаються у Synera.';
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
  [own, people, meetings] = await Promise.all([store.ownProfile(), store.discover(), store.meetings()]);
  $('#welcome').hidden = true; $('#workspace').hidden = false; $('#logout').hidden = false;
  document.body.classList.add('signed-in');
  for (const key of ['display_name', 'city', 'offers', 'seeks']) form.elements.namedItem(key).value = own[key];
  form.elements.namedItem('is_discoverable').checked = own.is_discoverable;
  renderPeople(); renderMeetings(); tab(currentTab);
}
function renderPeople() {
  const target = $('#people'); target.replaceChildren();
  if (!people.length) { target.append(el('p', 'Поки немає відкритих профілів. Запроси другого учасника створити профіль і дозволити його показ.', 'empty')); return; }
  for (const person of people) {
    const card = el('article', undefined, 'person');
    card.append(el('div', person.display_name.slice(0, 1), 'avatar'), el('h3', person.display_name), el('p', person.city || 'Місто не вказано', 'city'));
    for (const [title, value] of [['МОЖУ ДОПОМОГТИ', person.offers], ['ШУКАЮ', person.seeks]]) { const fact = el('div', undefined, 'fact'); fact.append(el('small', title), el('span', value || 'Ще не заповнено')); card.append(fact); }
    card.append(btn('Запропонувати зустріч ↗', () => { recipient = person.id; $('#invite-title').textContent = `Зустріч: ${person.display_name}`; $('#invite-note').value = ''; $('#invite-dialog').showModal(); }));
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
    if (incoming && meeting.status === 'pending') { const actions = el('div', undefined, 'actions'); for (const [status, title] of [['accepted', 'Прийняти'], ['declined', 'Відхилити']]) actions.append(btn(title, async () => { await store.respond(meeting.id, status); await load(); message('Відповідь збережено.'); }, status === 'declined')); card.append(actions); }
    target.append(card);
  }
}

document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
$('#demo-start').addEventListener('click', () => run(async () => { await store.signIn(); await load(); message('Локальне демо: усі профілі вигадані. Надішли запит учаснику Б, потім перемкни демо-учасника й прийми його.'); }));
$('#try-demo').addEventListener('click', () => run(async () => { store = new DemoStore(); setMode(); $('#demo-switch').value = 'demo-a'; await store.signIn(); await load(); message('Демонстрація з вигаданими людьми. Зміни скидаються після перезавантаження й не потрапляють до онлайн-бази.'); }));
$('#return-online').addEventListener('click', () => run(async () => { await store.signOut(); showSignedOut(); store = onlineStore; setMode(); await checkOnline(); }));
$('#check-online').addEventListener('click', () => run(checkOnline));
$('#demo-switch').addEventListener('change', () => run(async () => { await store.signIn($('#demo-switch').value); await load(); message('Демо-учасника змінено. Дані цього сценарію залишаються лише у вкладці.'); }));
$('#auth-form').addEventListener('submit', event => { event.preventDefault(); run(async () => { try { await store.signIn($('#email').value.trim(), $('#password').value); } finally { $('#password').value = ''; } await load(); message('Ти увійшов. Заповни профіль, щоб почати знайомство.'); if (!own.display_name) tab('profile'); }); });
$('#signup').addEventListener('click', () => run(async () => { if (!$('#auth-form').reportValidity()) return; let ready; try { ready = await store.signUp($('#email').value.trim(), $('#password').value); } finally { $('#password').value = ''; } if (ready) { await load(); tab('profile'); } message(ready ? 'Заповни свій профіль.' : 'Якщо реєстрація доступна для цієї адреси, перевір пошту й підтвердь email, потім увійди.'); }));
$('#logout').addEventListener('click', () => run(async () => { try { await store.signOut(); message('Ти вийшов.'); } finally { showSignedOut(); } }));
$('#refresh').addEventListener('click', () => run(load));
form.addEventListener('submit', event => { event.preventDefault(); run(async () => { const data = new FormData(form); await store.saveProfile({ display_name: data.get('display_name').trim(), city: data.get('city').trim(), offers: data.get('offers').trim(), seeks: data.get('seeks').trim(), is_discoverable: data.has('is_discoverable') }); await load(); message('Профіль збережено.'); }); });
$('#invite-cancel').addEventListener('click', () => $('#invite-dialog').close());
$('#invite-form').addEventListener('submit', event => { event.preventDefault(); run(async () => { await store.invite(recipient, $('#invite-note').value); $('#invite-dialog').close(); await load(); tab('meetings'); message('Запит на зустріч створено.'); }); });

try {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuration unavailable');
  config = await response.json();
  onlineStore = config.supabaseUrl ? new SupabaseStore(config) : null;
  store = onlineStore ?? new DemoStore();
  const demo = store.mode === 'demo';
  setMode();
  if (demo) message('Демонстрація без реєстрації. Тут лише вигадані учасники.');
  else await run(checkOnline);
} catch { $('#demo-start').disabled = true; $('#mode').textContent = 'Потрібне налаштування'; message('Не вдалося завантажити налаштування запуску.', true); }
