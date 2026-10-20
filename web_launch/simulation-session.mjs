import { BOT_PROFILES } from './simulation-personas.mjs';
import {
  createCaseState, reviseCase, approveCase, revokeCase, supplyDeliverableEvidence,
  recordDeliverableScopeCheck, acceptDeliverable, rejectDeliverable, getDeliverableProofStates,
} from './business-case.mjs';

const extraPeople = [
  ['ada', 'Ada', 'Локальний магазин', 'sales', 'design', 'Перевірити сторінку одного товару'],
  ['ben', 'Ben', 'Реміснича майстерня', 'design', 'sales', 'Сформулювати пропозицію для першого замовника'],
  ['clara', 'Clara', 'Освітній проєкт', 'research', 'video', 'Підготувати план короткого навчального відео'],
  ['dario', 'Dario', 'Розробник', 'automation', 'research', 'Перевірити вимоги до маленького прототипу'],
  ['eva', 'Eva', 'Власниця кав’ярні', 'events', 'design', 'Зробити план камерної події'],
  ['finn', 'Finn', 'Фотограф', 'video', 'sales', 'Скласти зрозумілий пакет послуг'],
  ['gia', 'Gia', 'Перекладачка', 'research', 'automation', 'Зменшити ручну роботу із заявками'],
  ['hugo', 'Hugo', 'Початківець', 'design', 'research', 'Отримати конкретний відгук на першу ідею'],
  ['iris', 'Iris', 'Зайнята замовниця', 'finance', 'automation', 'Замовити невелике виправлення з чіткою ціною'],
  ['jan', 'Jan', 'Організатор спільноти', 'events', 'video', 'Підготувати запрошення без нав’язливих обіцянок'],
];
const tags = ['design', 'sales', 'automation', 'finance', 'video', 'events', 'research', 'automation', 'design', 'sales'];
const boundaries = [
  'Перед згодою уточни один вимірюваний критерій; не погоджуй невідомий обсяг.',
  'Маєш небагато часу. Запропонуй менший обсяг, якщо завдання надто велике.',
  'Не приймай результат без прикладу. Відмова допустима, поясни конкретну причину.',
  'Не погоджуй оплату без суми й умов. Жодних тверджень про проведений платіж.',
];
export const SIMULATION_PEOPLE = Object.freeze([
  ...BOT_PROFILES.map((p, i) => ({ ...p, name: p.display_name.split(' · ')[0], tag: tags[i],
    needTag: tags[(i + 1) % tags.length], scenario: `Маленька перевірка: ${p.role.toLowerCase()}` })),
  ...extraPeople.map(([key, name, role, tag, needTag, scenario]) => ({ id: `bot-${key}`, name,
    display_name: `${name} · AI`, role, tag, needTag, scenario, is_bot: true, city: 'Zürich' })),
].map((p, i) => Object.freeze({ ...p, boundary: boundaries[i % boundaries.length], label: 'Вигаданий AI-учасник' })));

export function createSimulation(personId, at = new Date().toISOString()) {
  const person = SIMULATION_PEOPLE.find(p => p.id === personId);
  if (!person) throw new Error('Невідомий AI-учасник');
  return { format: 'synera.ai-simulation.v1', simulation: true, paymentVerified: false, personId,
    revision: 0, stopped: false, case: null, outputs: {}, events: [], messages: [{
      actor: personId, text: `${person.name} · вигаданий AI-учасник. ${person.scenario}. Який конкретний результат тобі потрібен?`,
      source: 'fixture', at,
    }] };
}
const checkedText = (value, max = 6000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`Потрібен текст до ${max} символів; чернетку не скорочено.`);
  return value;
};
function materialFor(state, fields, now) {
  const person = SIMULATION_PEOPLE.find(p => p.id === state.personId);
  const target = checkedText(fields.target, 500), criteria = checkedText(fields.criteria, 500);
  const oneWay = ['paid_service', 'referral'].includes(fields.mode);
  const deliverables = [{ giver_id: person.id, receiver_id: 'owner', capability_tag: person.tag,
    target, acceptance_criteria: criteria }];
  if (!oneWay) deliverables.push({ giver_id: 'owner', receiver_id: person.id, capability_tag: person.needTag,
    target: checkedText(fields.returnTarget, 500), acceptance_criteria: checkedText(fields.returnCriteria, 500) });
  let amount = null;
  if (fields.mode === 'paid_service') {
    if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(fields.amount || '')) throw new Error('Вкажи погоджену суму, наприклад 120.50 CHF.');
    amount = Math.round(Number(fields.amount) * 100);
    if (amount <= 0) throw new Error('Оплачуваний сценарій потребує додатної суми.');
  }
  return { mode: fields.mode, components: fields.mode === 'hybrid' ? ['exchange', 'referral'] : [fields.mode],
    outcomes: deliverables.map(d => ({ receiver_id: d.receiver_id, capability_tag: d.capability_tag, target: d.target })),
    trial: { starts_on: now.slice(0, 10), due_on: fields.due, deliverables },
    compensation: { status: fields.mode === 'paid_service' ? 'agreed_money' : ['exchange', 'hybrid'].includes(fields.mode) ? 'agreed_exchange' : 'agreed_none',
      amount_minor: amount, currency: amount ? 'CHF' : '', invoice_required: amount ? true : null },
    terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' } };
}

// This sandbox reuses the product's case transitions; it never writes real accounts or payments.
export async function simulationAction(state, input, now = new Date().toISOString()) {
  if (state?.format !== 'synera.ai-simulation.v1' || !SIMULATION_PEOPLE.some(p => p.id === state.personId)) throw new Error('Некоректна симуляція');
  if (!input || !['owner', state.personId].includes(input.actor)) throw new Error('Чужий учасник');
  if (input.revision !== state.revision) throw new Error('Екран змінився. Онови його й повтори дію.');
  if (state.stopped && input.kind !== 'resume') throw new Error('Симуляція зупинена');
  const next = structuredClone(state), { actor, kind } = input;
  if (['stop', 'resume'].includes(kind)) {
    if (actor !== 'owner') throw new Error('Керує лише власник');
    next.stopped = kind === 'stop';
  } else if (kind === 'message') {
    if (next.messages.length >= 110) throw new Error('Експортуй завершений цикл перед новою розмовою. Історія збережена.');
    next.messages.push({ actor, text: checkedText(input.text), source: actor === 'owner' ? 'owner' : 'ai', at: now });
  } else if (kind === 'propose') {
    const material = materialFor(next, input.terms || {}, now);
    next.case = next.case && !['revoked', 'abandoned'].includes(next.case.status)
      ? await reviseCase(next.case, { material, now })
      : await createCaseState({ caseId: `sim-${state.personId}-${state.revision}`, participants: ['owner', state.personId], material, now,
        expiresAt: new Date(Date.parse(material.trial.due_on + 'T23:59:59Z') + 86400000).toISOString() });
    if (next.case.termsHash !== state.case?.termsHash) next.outputs = {};
  } else {
    if (!next.case) throw new Error('Спершу погодьте конкретні умови');
    if (kind === 'approve') next.case = approveCase(next.case, { partyId: actor, termsHash: next.case.termsHash, now });
    else if (kind === 'decline') next.case = revokeCase(next.case, { partyId: actor, now });
    else {
      if (next.case.status !== 'approved_for_next_step') throw new Error('Потрібні дві згоди на поточну редакцію');
      const deliverable = next.case.material.trial.deliverables[input.index];
      if (!Number.isInteger(input.index) || !deliverable) throw new Error('Невідомий результат');
      if (kind === 'deliver') {
        const text = checkedText(input.text);
        next.case = supplyDeliverableEvidence(next.case, { deliverableIndex: input.index, partyId: actor,
          evidenceUri: `simulation:${next.case.caseId}/${next.case.version}/${input.index}`, now });
        next.outputs[input.index] = text;
      } else {
        if (actor !== deliverable.receiver_id) throw new Error('Перевіряє і приймає лише отримувач');
        if (kind === 'check') next.case = recordDeliverableScopeCheck(next.case, { deliverableIndex: input.index, partyId: actor, scopeNotes: checkedText(input.text), now });
        else if (kind === 'accept') next.case = acceptDeliverable(next.case, { deliverableIndex: input.index, partyId: actor, now });
        else if (kind === 'reject') next.case = rejectDeliverable(next.case, { deliverableIndex: input.index, partyId: actor, reason: 'below_acceptance_criteria', now });
        else throw new Error('Невідома дія');
      }
    }
  }
  next.revision++;
  next.events.push({ revision: next.revision, actor, kind, at: now });
  return next;
}
export { getDeliverableProofStates };
