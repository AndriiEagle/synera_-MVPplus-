import { readOutcomeArchive } from './outcome-archive.mjs';

const $ = id => document.getElementById(id);
const ui = { file: $('archive-file'), clear: $('archive-clear'), status: $('archive-status'), result: $('archive-result'), summary: $('archive-summary'), cards: $('archive-cards'), events: $('archive-events'), exact: $('archive-exact') };
const node = (tag, text = '', className = '') => { const value = document.createElement(tag); value.textContent = text; if (className) value.className = className; return value; };
const phases = { pending: 'Очікує доказу', evidence_supplied: 'Доказ подано', checked_with_scope: 'Перевірено за критерієм', accepted: 'Прийнято одержувачем', declined_dispute_open: 'Є відкритий спір' };
const actions = { submit: 'Подано доказ', check: 'Записано перевірку', accept: 'Прийнято результат', decline: 'Відкрито спір' };
const reasons = { not_delivered: 'Результат не надано', outside_agreed_scope: 'Поза погодженим обсягом', below_acceptance_criteria: 'Критерій ще не виконано', other: 'Інша причина' };
let generation = 0;
function clearView() {
  generation++; ui.result.hidden = true;
  for (const host of [ui.summary, ui.cards, ui.events, ui.exact]) host.replaceChildren();
  for (const details of ui.result.querySelectorAll('details')) details.open = false;
}
function render(value) {
  const participant = id => `Учасник ${value.case.participants.indexOf(id) + 1}`;
  ui.summary.append(node('p', `Редакція ${value.case.version} · ${value.case.case_id}`),
    node('p', value.outcome.outcome_confirmed ? 'У цій копії обидва результати прийняті.' : 'У цій копії обмін ще не завершений.'));
  for (const row of value.outcome.deliverables) {
    const card = node('article', '', 'real-card real-review'); card.append(node('h3', `${participant(row.giver_id)} → ${participant(row.receiver_id)}`), node('p', phases[row.phase]));
    const fields = node('dl');
    for (const [label, text] of [['Результат', row.target], ['Критерій', row.acceptance_criteria], ['Доказ', row.evidence_uri], ['Перевірка', row.scope_notes], ['Причина спору', row.reason && reasons[row.reason]]]) {
      if (text !== null && text !== undefined) fields.append(node('dt', label), node('dd', text));
    }
    card.append(fields); ui.cards.append(card);
  }
  for (const event of value.outcome.events) {
    const line = node('li'); line.append(node('p', `${participant(event.actor_id)} · ${actions[event.kind]} · ${event.created_at}`));
    const text = event.payload.evidenceUri ?? event.payload.scopeNotes ?? (event.payload.reason && reasons[event.payload.reason]);
    if (text) { const quote = node('p', text); quote.style.whiteSpace = 'pre-wrap'; line.append(quote); }
    ui.events.append(line);
  }
  ui.exact.textContent = JSON.stringify(value, null, 2); ui.result.hidden = false;
}
ui.clear.addEventListener('click', () => { clearView(); ui.file.value = ''; ui.status.textContent = 'Перегляд очищено. Завантажений файл залишається на твоєму пристрої.'; });
ui.file.addEventListener('change', async () => {
  clearView(); const ticket = generation, file = ui.file.files?.[0];
  ui.file.value = ''; if (!file) { ui.status.textContent = 'Файл ще не вибрано.'; return; }
  ui.status.textContent = 'Читаю локальну копію…';
  try {
    if (file.size > 1.5 * 1024 * 1024) throw new Error('Файл більший за 1,5 MiB.');
    const value = await readOutcomeArchive(await file.text());
    if (ticket !== generation) return;
    render(value); ui.status.textContent = 'Копію відкрито локально. Серверні дані не змінені.';
  } catch (error) { if (ticket === generation) ui.status.textContent = error.message || 'Не вдалося прочитати копію.'; }
});
