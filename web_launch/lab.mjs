import { CAPABILITIES, CITIES, compareProfiles, nearbyProfiles, caseWithoutIdentity, reviewIntroduction } from './matching.mjs';
import { LAB_PROFILES } from './lab-fixtures.mjs';
import { economics } from './economics.mjs';
const $ = selector => document.querySelector(selector);
const node = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
const money = value => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(value);
let profiles = structuredClone(LAB_PROFILES.slice(0, 2));
const labels = { consent_required: 'Спочатку потрібна згода обох', needs_information: 'Потрібно уточнити дані', incompatible: 'Є несумісні умови', insufficient_mutual_value: 'Взаємної користі поки не видно', review_candidate: 'Є що обговорити' };
function invalidate() { $('#comparison-result').hidden = true; $('#comparison-result').replaceChildren(); $('#lab-notice').textContent = 'Дані змінено. Порівняй профілі знову; попередній висновок і симуляція згоди скинуті.'; }
function optionSelect(title, value, choices, onChange, optional = false) {
  const label = node('label', title), input = node('select');
  if (optional) input.append(new Option('Не вказано', ''));
  for (const [id, name] of Object.entries(choices)) input.append(new Option(name, id));
  input.value = value; input.addEventListener('change', () => { onChange(input.value); invalidate(); }); label.append(input); return label;
}
function field(title, type, value, onChange) { const label = node('label', title), input = node('input'); input.type = type; input.value = value; if (type === 'text') input.maxLength = 60; input.addEventListener('input', () => { onChange(input.value); invalidate(); }); label.append(input); return label; }
function checks(title, values, choices, onChange) { const box = node('div'); box.append(node('small', title)); const group = node('div', undefined, 'choices'); for (const [id, label] of Object.entries(choices)) { const wrapper = node('label'), input = node('input'); input.type = 'checkbox'; input.checked = values.includes(id); input.addEventListener('change', () => { onChange([...group.querySelectorAll('input:checked')].map(n => n.value)); invalidate(); }); input.value = id; wrapper.append(input, node('span', label)); group.append(wrapper); } box.append(group); return box; }
function boolean(title, value, onChange) { const label = node('label', undefined, 'check'), input = node('input'); input.type = 'checkbox'; input.checked = value; input.addEventListener('change', () => { onChange(input.checked); invalidate(); }); label.append(input, node('span', title)); return label; }
function renderEditors() {
  const target = $('#profile-editors'); target.replaceChildren();
  profiles.forEach((p, index) => {
    const form = node('section', undefined, 'panel profile-editor'); form.setAttribute('aria-label', `Профіль ${index + 1}`);
    form.append(node('p', `СТОРОНА ${index + 1}`, 'eyebrow'), node('h3', p.label));
    form.append(optionSelect('Завантажити приклад', p.id, Object.fromEntries(LAB_PROFILES.map(p => [p.id, p.label])), id => { profiles[index] = structuredClone(LAB_PROFILES.find(p => p.id === id)); renderEditors(); }));
    form.append(checks('МОЖУ ДОПОМОГТИ', p.offers, CAPABILITIES, values => p.offers = values));
    const primary = () => p.needs.find(n => n.priority === 3)?.tag || '', secondary = () => p.needs.find(n => n.priority === 1)?.tag || '';
    form.append(optionSelect('Головна потреба · вага 3', primary(), CAPABILITIES, tag => p.needs = [{ tag, priority: 3 }, ...p.needs.filter(n => n.priority !== 3)], true));
    form.append(optionSelect('Друга потреба · вага 1', secondary(), CAPABILITIES, tag => p.needs = [...p.needs.filter(n => n.priority !== 1), { tag, priority: 1 }], true));
    form.append(checks('МОВИ', p.languages, { de: 'DE', en: 'EN', uk: 'UK', fr: 'FR' }, values => p.languages = values));
    const details = node('details'); details.append(node('summary', 'Місто, терміни та правила співпраці'));
    details.append(optionSelect('Місто', p.city, Object.fromEntries(Object.entries(CITIES).map(([id, c]) => [id, c.label])), v => p.city = v));
    details.append(optionSelect('Допустима відстань', String(p.maxKm), { 0: 'Те саме місто', 25: '25 км', 50: '50 км', 100: '100 км', 300: '300 км' }, v => p.maxKm = Number(v)));
    details.append(boolean('Мені підходить дистанційна співпраця', p.remote, v => p.remote = v));
    details.append(checks('ФОРМАТ', p.modes, { exchange: 'Обмін допомогою', joint_project: 'Спільний проєкт' }, v => p.modes = v));
    details.append(field('Доступність від', 'date', p.availableFrom, v => p.availableFrom = v), field('Доступність до', 'date', p.availableUntil, v => p.availableUntil = v), field('Профіль підтверджено', 'date', p.updatedAt, v => p.updatedAt = v));
    details.append(boolean('Мені потрібна конфіденційність', p.requiresConfidentiality, v => p.requiresConfidentiality = v), boolean('Я готовий узгодити конфіденційність', p.acceptsConfidentiality, v => p.acceptsConfidentiality = v));
    form.append(details, boolean('Дозволяю порівняння цього профілю', p.consent, v => p.consent = v)); target.append(form);
  });
}
function analyze() {
  const result = compareProfiles(...profiles), target = $('#comparison-result'); target.replaceChildren(); target.hidden = false;
  target.append(node('p', 'ВИСНОВОК ЗА ЗАЯВЛЕНИМИ ДАНИМИ', 'eyebrow'), node('h2', labels[result.status]));
  for (const reason of result.reasons) target.append(node('p', reason));
  if (result.score !== null) { target.append(node('div', `${result.score}%`, 'score'), node('p', 'Покриття потреб слабшого напрямку. Це не ймовірність успіху й не рейтинг людей.', 'fine')); }
  const name = id => profiles.find(p => p.id === id)?.label || id;
  if (result.directions.length) {
    const grid = node('div', undefined, 'result-grid');
    for (const d of result.directions) { const part = node('div', undefined, 'result-side'); part.append(node('h3', `Користь для: ${name(d.receiver)}`), node('strong', `${d.percent}% заявлених потреб`)); const list = node('ul'); for (const m of d.matched) list.append(node('li', CAPABILITIES[m.tag])); part.append(list); if (d.unmet.length) part.append(node('p', `Залишається відкритим: ${d.unmet.map(t => CAPABILITIES[t]).join(', ')}.`)); part.append(node('p', 'Підстава: потреба однієї сторони й заявлена компетенція іншої. Незалежної перевірки немає.', 'fine')); grid.append(part); } target.append(grid);
  }
  if (result.logistics) target.append(node('p', `Спільний період: ${result.logistics.from} — ${result.logistics.until}. Мови: ${result.logistics.languages.join(', ').toUpperCase()}. Між центрами міст ≈ ${result.logistics.distanceKm} км. ${result.logistics.remote ? 'Обидва погоджуються на дистанційну роботу.' : 'Потрібно погодити місце зустрічі.'}`));
  if (result.plan.length) {
    target.append(node('h3', 'Чернетка першої розмови · 20 хвилин'));
    const list = node('ol'); list.append(node('li', 'Кожному по 3 хвилини: мета, приклад роботи й межі.'));
    for (const step of result.plan) list.append(node('li', `${name(step.giver)} → ${name(step.receiver)}: ${step.action}`));
    list.append(node('li', 'Разом: обсяг, компенсація або обмін, відповідальність і критерій завершення. Невирішені питання записати окремо.'));
    target.append(list, node('p', 'Після розмови кожен окремо підтверджує або відхиляє пробний крок. Дозволено не погодитися.', 'fine'));
    const approvals = {}, status = node('p', 'Симуляція: очікуємо обох.');
    target.append(node('h3', 'Симуляція згоди'));
    for (const p of profiles) { const label = node('label', undefined, 'check'), input = node('input'); input.type = 'checkbox'; input.addEventListener('change', () => { approvals[p.id] = input.checked; status.textContent = reviewIntroduction(result, approvals).allowed ? 'Симуляція: обидві сторони погодили чернетку. Повідомлення не надсилається.' : 'Симуляція: очікуємо обох.'; }); label.append(input, node('span', `${p.label}: погоджую чернетку`)); target.append(label); }
    target.append(status, node('p', 'Ці прапорці в одній вкладці не підтверджують особу й не є юридичною згодою. Реальні запрошення проходять через окремі облікові записи.', 'fine'));
  }
  const comparisonAgain = compareProfiles(profiles[1], profiles[0]);
  target.append(node('p', JSON.stringify(result) === JSON.stringify(comparisonAgain) ? 'Перевірка порядку: перестановка цих профілів не змінює висновок.' : 'Потрібна перевірка: порядок вплинув на висновок.', 'fine'));
  if (profiles.every(p => p.consent)) { const details = node('details'); details.append(node('summary', 'Локальний звіт без імен і контактів')); const report = node('textarea', undefined, 'report'); report.readOnly = true; report.setAttribute('aria-label', 'Звіт порівняння без імен'); report.value = JSON.stringify(caseWithoutIdentity(...profiles), null, 2); details.append(node('p', 'Місто та компетенції все ще можуть ідентифікувати людину. Перед передаванням зовнішньому AI потрібні перевірка даних і окрема згода.', 'fine'), report); target.append(details); }
  $('#lab-notice').textContent = 'Висновок оновлено. Зміна будь-якого поля скине його та симуляцію згоди.';
}
function renderNearby() { const target = $('#near-results'); target.replaceChildren(); const found = nearbyProfiles(LAB_PROFILES, $('#near-city').value, Number($('#near-radius').value)); for (const p of found) { const card = node('article', undefined, 'near-card'); card.append(node('h3', LAB_PROFILES.find(f => f.id === p.id).label), node('p', `${CITIES[p.city].label} · ≈ ${Math.round(p.distanceKm)} км`)); target.append(card); } if (!found.length) target.append(node('p', 'У цьому радіусі немає відкритих прикладів.')); }
function renderEconomics() {
  const form = $('#economics-form'), target = $('#economics-result'); target.replaceChildren();
  if (!form.checkValidity()) { target.append(node('p', 'Введи коректні невід’ємні значення. Кількість учасників має бути цілим числом.')); return; }
  const data = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, Number(v)])), r = economics(data);
  for (const [label, value, negative] of [['Оплати за місяць', money(r.grossRevenue)], ['Залишок до оцінки твого часу', money(r.beforeOwnerTime), r.beforeOwnerTime < 0], ['Залишок з урахуванням твого часу', money(r.afterOwnerTime), r.afterOwnerTime < 0], ['Учасників до беззбитковості в цьому сценарії', r.breakEvenMembers === null ? 'Не досягається' : String(r.breakEvenMembers)], ['Твій час на місяць, включно зі спільною роботою', `${r.hoursPerMonth.toFixed(1)} год`]]) { const div = node('div', undefined, 'metric'); div.append(node('strong', value, negative ? 'negative' : ''), node('span', label)); target.append(div); }
  target.append(node('p', `На учасника: комісії ${money(r.feesPerMember)}, змінний час ${money(r.timePerMember)}, внесок після змінних витрат ${money(r.contribution)}.`, 'fine'));
  const timeLimit = !r.sixtyPercentFeasible ? '60% внеску не досягаються навіть без ручної роботи.' : r.minutesFor60Percent === null ? 'Вартість години дорівнює нулю, тому часовий ліміт у цьому розрахунку не визначений.' : `Для 60% внеску до постійних витрат: до ${r.minutesFor60Percent.toFixed(1)} хв обслуговування на учасника.`;
  target.append(node('p', `${timeLimit} Вартість розробки, податок на дохід, страхування та непередбачені витрати не враховані.`, 'fine'));
}
$('#compare').addEventListener('click', analyze);
$('#swap').addEventListener('click', () => { profiles.reverse(); renderEditors(); invalidate(); analyze(); });
$('#reset-examples').addEventListener('click', () => { profiles = structuredClone(LAB_PROFILES.slice(0, 2)); renderEditors(); invalidate(); });
for (const [id, c] of Object.entries(CITIES)) $('#near-city').append(new Option(c.label, id));
$('#near-city').addEventListener('change', renderNearby); $('#near-radius').addEventListener('change', renderNearby);
$('#economics-form').addEventListener('input', renderEconomics); $('#economics-form').addEventListener('submit', e => e.preventDefault());
renderEditors(); renderNearby(); renderEconomics();
