import { SupabaseStore, ServiceError } from './online-store.mjs';
import { cleanProfileFields, createInvitationDraft, createShareCard, parseProfileCsv, profileCompletion, profileSafetyFindings } from './profile-portability.mjs';
import { completeProfileJson as createPortableProfileJson, importCompleteProfile as parseProfileImport } from './profile-package.mjs';
import { normalizeBrief, briefProblems, compareRealProfiles, collaborationDraft, CAPABILITIES, CITIES, LANGUAGES, MODES, profileAIPayload, profileAIPrompt, validateAIDraft } from './profile-brief.mjs';
import { createPeopleMap } from './map.mjs';
import { GPT_PROFILE_PROMPT, consentRecord } from './pilot-policy.mjs';
import { meetingCalendar } from './calendar.mjs';
const $ = selector => document.querySelector(selector);
const form = $('#profile-form');
const callbackUrl = new URL(location.href);
const emailCallback = { hash: callbackUrl.searchParams.get('token_hash'), type: callbackUrl.searchParams.get('type') };
if (emailCallback.hash || callbackUrl.hash || callbackUrl.searchParams.has('error')) history.replaceState(null, '', location.pathname);
let store, config, onlineReady = false, own, people = [], meetings = [], recipient, currentTab = 'profile', busy = false, draft, policyAction;
let importFormat = 'text', importedBrief, pageOffset = 0, morePeople = false, activeChat, safetyPerson, aiPayload, aiSource, aiDraft;
const labels = { pending: 'Очікує відповіді', accepted: 'Прийнято', declined: 'Відхилено', cancelled: 'Скасовано' };
const peopleMap = createPeopleMap($('#people-map'), person => {
  $('#map-selected').textContent = person.display_name + ' · ' + person.city + ' (центр міста)';
  document.getElementById('person-' + person.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
function message(text, error = false) { $('#notice').textContent = text; $('#notice').classList.toggle('error', error); }
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
  profile.brief = normalizeBrief({ ...Object.fromEntries(data), offer_tags: data.getAll('offer_tags'), need_tags: data.getAll('need_tags'), languages: data.getAll('languages'), modes: data.getAll('modes'), max_km: Number(data.get('max_km')), remote: data.has('remote'), confidentiality: data.has('confidentiality'), accepts_confidentiality: data.has('accepts_confidentiality') });
  return profile;
}
function fillProfileForm(profile) {
  const clean = cleanProfileFields(profile), brief = normalizeBrief(profile.brief);
  for (const key of ['display_name','city','offers','seeks']) form.elements.namedItem(key).value = clean[key];
  for (const key of ['goal','city_code','max_km','available_from','available_until']) form.elements.namedItem(key).value = brief[key];
  for (const key of ['remote','confidentiality','accepts_confidentiality']) form.elements.namedItem(key).checked = brief[key];
  for (const key of ['offer_tags','need_tags','languages','modes']) form.querySelectorAll('input[name="' + key + '"]').forEach(node => { node.checked = brief[key].includes(node.value); });
  form.elements.namedItem('is_discoverable').checked = clean.is_discoverable;
  form.elements.namedItem('map_visible').checked = profile.map_visible === true && clean.is_discoverable;
  renderProfileProgress();
}
function renderProfileProgress() {
  const p = readProfileForm(), missing = briefProblems(p.brief), completion = profileCompletion(p);
  $('#profile-progress').textContent = missing.length ? 'ДО ПУБЛІКАЦІЇ: ЩЕ ' + (missing.length + Number(!p.display_name)) + ' ПУНКТІВ' : 'УМОВИ СПІВПРАЦІ ЗАПОВНЕНО';
  $('#profile-progress').title = [...completion.missing, ...missing].join(' · ');
  form.elements.namedItem('map_visible').disabled = !p.is_discoverable;
  if (!p.is_discoverable) form.elements.namedItem('map_visible').checked = false;
}
for (const [key, title, choices] of [['offer_tags','Можу дати',CAPABILITIES],['need_tags','Потрібно мені',CAPABILITIES],['languages','Мови розмови',LANGUAGES],['modes','Формати співпраці',MODES]]) {
  const fieldset = el('fieldset', undefined, 'choice-set'); fieldset.append(el('legend', title));
  for (const [value, title] of Object.entries(choices)) { const label = el('label', undefined, 'check'); const input = el('input'); input.type = 'checkbox'; input.name = key; input.value = value; label.append(input, el('span', title)); fieldset.append(label); }
  $('#brief-fields').append(fieldset);
}
for (const [code, city] of Object.entries(CITIES)) { const option = el('option', city.label); option.value = code; $('#city-code').append(option); }
function importPreviewProfile() { return cleanProfileFields({ display_name: $('#import-display-name').value, city: $('#import-city').value, offers: $('#import-offers').value, seeks: $('#import-seeks').value }); }
function currentPublicUrl() { return config?.publicSiteUrl || (location.protocol === 'https:' ? location.href : ''); }
function applyAuthState() {
  $('#auth-fields').disabled = busy || !onlineReady;
  $('#signup').hidden = !config?.registrationEnabled;
  $('#run-ai').disabled = busy || !config?.localAI?.enabled || !$('#ai-consent').checked;
  $('#apply-ai').disabled = busy || !aiDraft || !$('#ai-consent').checked;
  $('#more-people').hidden = !morePeople;
}
async function run(action) {
  if (busy) return;
  busy = true; document.querySelectorAll('button').forEach(b => b.disabled = true);
  try { await action(); }
  catch (error) {
    message(error instanceof ServiceError ? error.message : (error?.userMessage || 'Не вдалося завершити дію. Перевір дані та з’єднання. Незбережені поля залишаються у формі.'), true);
    if (error?.status === 402) { onlineReady = false; $('#mode').textContent = 'Вхід тимчасово недоступний'; }
    if (!store?.user && own?.id) showSignedOut();
  } finally { busy = false; document.querySelectorAll('button').forEach(b => b.disabled = false); applyAuthState(); }
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
  for (const selector of ['#profile-import-text','#profile-share-output','#ai-json','#ai-gpt-prompt','#chat-body','#report-detail','#delete-confirmation']) $(selector).value = '';
  $('#import-preview').querySelectorAll('input,textarea').forEach(node => { node.value = ''; });
  for (const selector of ['#people','#meetings','#blocked-people','#chat-messages','#ai-result','#ai-payload','#map-selected']) $(selector).replaceChildren();
  peopleMap.clear(); own = null; people = []; meetings = []; draft = null; aiDraft = aiPayload = aiSource = null; activeChat = safetyPerson = null;
  currentTab = 'profile'; importedBrief = null; pageOffset = 0; morePeople = false;
  $('#map-panel').hidden = true; $('#toggle-map').textContent = 'Показати карту'; $('#toggle-map').setAttribute('aria-expanded','false'); $('#map-roads').textContent = 'Увімкнути OpenStreetMap';
  form.dataset.dirty = ''; renderProfileProgress();
}
async function checkOnline() {
  onlineReady = false; applyAuthState();
  if (!store) { $('#mode').textContent = 'Вхід ще не підключено'; $('#welcome-text').textContent = 'Можна підготувати та завантажити власний профіль. Онлайн-акаунти стануть доступні після налаштування сервісу.'; return; }
  try { await store.availability(); }
  catch (error) { $('#mode').textContent = 'Вхід тимчасово недоступний'; $('#welcome-text').textContent = 'База тимчасово не приймає вхід. Ти можеш підготувати власний профіль у вкладці й зберегти копію файлом.'; throw error instanceof ServiceError ? error : knownError('Онлайн-вхід зараз недоступний. Чернетка та імпорт власного профілю працюють у вкладці.'); }
  if (!config.realPilotEnabled || !config.pilotSafetyEnabled) { $('#mode').textContent = 'Готуємо відкриття пілоту'; $('#welcome-text').textContent = 'Онлайн-сервіс відповідає. Реєстрація відкриється після перевірки правил і захисту даних.'; return; }
  onlineReady = true; $('#mode').textContent = 'Пілот для реальних учасників'; $('#welcome-text').textContent = 'Увійди або створи акаунт. Новий профіль прихований, доки ти не дозволиш його показ.'; applyAuthState();
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
function renderPeople() {
  const target = $('#people'); target.replaceChildren(); if (!own) return;
  const query = $('#people-search').value.toLocaleLowerCase().trim();
  const priority = { review_candidate:0, insufficient_mutual_value:1, needs_information:2, incompatible:3, consent_required:4 };
  const ranked = people.map(person => ({ person, comparison: compareRealProfiles(own, person) }))
    .filter(({person,comparison}) => (!$('#reciprocal-only').checked || comparison.status === 'review_candidate') && (!query || [person.display_name,person.city,person.offers,person.seeks,person.brief?.goal].join(' ').toLocaleLowerCase().includes(query)))
    .sort((a,b) => priority[a.comparison.status] - priority[b.comparison.status] || a.person.id.localeCompare(b.person.id));
  $('#people-count').textContent = ranked.length + ' з ' + people.length + ' завантажених профілів' + (morePeople ? ' · є наступна сторінка' : '');
  peopleMap.setPeople(ranked.map(row => row.person).filter(p => p.map_visible === true));
  if (!ranked.length) {
    const empty = el('div', undefined, 'empty'); empty.append(el('h3', people.length ? 'Спробуй інші умови пошуку' : 'Перша співпраця починається з двох'));
    empty.append(el('p', people.length ? 'Зміни запит або вимкни фільтр сумісності. Немає збігу за умовами — ще не означає, що ви не знайдете спільної ідеї.' : 'Поки немає відкритих профілів інших людей. Запроси колегу створити власний профіль. Після його згоди з’являться причини для розмови.'));
    empty.append(btn('Запросити колегу своєю карткою', () => { tab('profile'); openShareDialog(); }, true)); target.append(empty); return;
  }
  for (const {person,comparison} of ranked) {
    const card = el('article', undefined, 'person'); card.id = 'person-' + person.id;
    card.append(el('div', person.display_name.slice(0,1), 'avatar'), el('h3', person.display_name), el('p', person.city || 'Онлайн', 'city'));
    for (const [title,value] of [['МОЖУ ДАТИ',person.offers],['ЗАРАЗ ШУКАЮ',person.seeks],['ПЕРШИЙ РЕЗУЛЬТАТ',person.brief?.goal]]) { const fact=el('div',undefined,'fact'); fact.append(el('small',title),el('span',value || 'Не вказано')); card.append(fact); }
    const fit=el('div',undefined,'fit');
    fit.append(el('strong', comparison.status === 'review_candidate' ? 'Є користь для обох' : 'Що варто уточнити'));
    for (const direction of comparison.directions) if (direction.matched.length) fit.append(el('p', (direction.receiver === own.id ? 'Тобі: ' : 'Іншій стороні: ') + direction.matched.map(m => CAPABILITIES[m.tag]).join(', '), 'fine'));
    for (const reason of comparison.reasons.slice(0,3)) fit.append(el('p',publicReason(reason,person),'fine'));
    if (comparison.logistics) fit.append(el('p', comparison.logistics.languages.map(v => LANGUAGES[v]).join(', ') + ' · ' + (comparison.logistics.remote ? 'Онлайн' : comparison.logistics.distanceKm + ' км між містами') + ' · до ' + comparison.logistics.until, 'fine'));
    card.append(fit,btn('Запропонувати перший крок ↗', () => openInvite(person,comparison)),btn('Межі спілкування / скарга',()=>openSafety(person),true));
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
async function finishOnlineSignIn() {
  if(!config.realPilotEnabled || !store.pilotSafetyEnabled) { await store.signOut();throw knownError('Пілот потребує перевірки серверного налаштування.'); }
  if(!await store.hasPolicy()) {requestPolicy(async accepted=>{await store.acceptPolicy(accepted);await load({profile:true});tab('profile');message('Правила підтверджено. Заповни власний профіль.');});return;}
  await load({profile:true}); if(!own.display_name)tab('profile');message('Ти увійшов. Зміни профілю зберігаються лише кнопкою «Зберегти».');
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
$('#prepare-profile').addEventListener('click',()=>{showWorkspace();fillProfileForm(draft || {});tab('profile');$('#mode').textContent='Твоя чернетка · у цій вкладці';message('Підготуй власний профіль або перенеси його з файлу. Завантаж JSON перед закриттям вкладки.');});
$('#back-login').addEventListener('click',()=>{draft=readProfileForm();$('#workspace').hidden=true;$('#welcome').hidden=false;$('#back-login').hidden=true;document.body.classList.remove('signed-in');message('Чернетка залишається у вкладці. Після входу перевір її та збережи.');});
$('#check-online').addEventListener('click',()=>run(checkOnline));
$('#policy-cancel').addEventListener('click',()=>{policyAction=null;$('#password').value='';$('#policy-dialog').close();});
$('#policy-dialog').addEventListener('cancel',()=>{policyAction=null;$('#password').value='';});
$('#policy-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{const accepted=consentRecord({terms:$('#accept-terms').checked,privacy:$('#accept-privacy').checked});const action=policyAction;policyAction=null;$('#policy-dialog').close();if(action)await action(accepted);});});
$('#auth-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{store.remember($('#remember-session').checked?safeStorage():null);try{await store.signIn($('#email').value.trim(),$('#password').value);}finally{$('#password').value='';}await finishOnlineSignIn();});});
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
    importedBrief = result.profile.brief;
    $('#import-display-name').value = result.profile.display_name;
    $('#import-city').value = result.profile.city;
    $('#import-offers').value = result.profile.offers;
    $('#import-seeks').value = result.profile.seeks;
  }
});
$('#apply-import').addEventListener('click', () => {
  if (!$('#profile-authorized').checked) { $('#import-status').textContent = 'Підтвердь право переносити цей профіль.'; return; }
  const profile = { ...importPreviewProfile(), brief: importedBrief }, findings = profileSafetyFindings(profile);
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
  store = config.supabaseUrl ? new SupabaseStore(config) : null;
  $('#registration-note').textContent = config.registrationEnabled ? 'Реєстрація відкрита. Для нового акаунта потрібні підтвердження email і пароль від 12 символів.' : 'Реєстрація закрита до завершення перевірки сервісу.';
  await run(async () => {
    await checkOnline();
    if (!onlineReady) return;
    if (emailCallback.hash) {
      await store.verifyEmailToken(emailCallback.hash, emailCallback.type); emailCallback.hash = null;
      if (emailCallback.type === 'recovery') recoveryDialog.showModal(); else await finishOnlineSignIn();
    } else {
      const storage = safeStorage();
      if (storage && await store.restore(storage)) await finishOnlineSignIn();
    }
  });
} catch { $('#mode').textContent = 'Немає з’єднання'; message('Налаштування входу недоступні. Можна підготувати профіль у вкладці й завантажити власний JSON.', true); }
applyAuthState();renderProfileProgress();
