import { CAPABILITIES, COLLABORATION_MODES } from './matching.mjs';

// Local drafting only. A proposal is neither persisted terms nor an approval.
export const EVIDENCE_TYPES = Object.freeze(['document', 'link', 'demo', 'checklist', 'conversation_note']);
const copy = {
  uk: {
    types: ['документ', 'посилання на результат', 'демонстрацію', 'контрольний список', 'нотатку розмови'],
    target: (type, subject, date) => `Пропозиція: підготувати ${type} за темою «${subject}» до ${date}.`,
    intro: (subject, date) => `Пропозиція: обговорити тему «${subject}» до ${date} та зафіксувати відкриті питання й можливий наступний крок або відмову від продовження.`,
    criteria: (type, subject, date, check) => `До ${date} одержувач отримує ${type} за темою «${subject}». ${check} Одержувач окремо зазначає, чи відповідає результат погодженій темі, і приймає його або вказує конкретну невідповідність.`,
    checks: ['Відкрити документ і перевірити, що він містить результат за цією темою, а не лише заголовок.', 'Відкрити посилання з доступом одержувача й перевірити, що воно веде до результату за цією темою.', 'Переглянути демонстрацію та записати, яку дію за цією темою показано і який результат видно.', 'Перевірити, що пункти стосуються цієї теми та для кожного зазначено результат перевірки або відкрите питання.', 'Звірити нотатку з розмовою: тема, відкриті питання, наступний крок або рішення не продовжувати; інша людина може виправити неточність.'],
    boundary: 'Це редагована пропозиція, навички лише заявлені. Обсяг, винагорода й решта умов потребують окремого явного погодження обома учасниками. Пропозиція розмови не є прийняттям платної роботи.',
    referral: 'Контакт і згода третьої особи не підтверджені; не передавай її дані без окремої згоди.',
  },
  de: {
    types: ['ein Dokument', 'einen Ergebnislink', 'eine Demonstration', 'eine Prüfliste', 'eine Gesprächsnotiz'],
    target: (type, subject, date) => `Vorschlag: ${type} zum Thema „${subject}“ bis ${date} vorbereiten.`,
    intro: (subject, date) => `Vorschlag: das Thema „${subject}“ bis ${date} besprechen und offene Fragen sowie einen möglichen nächsten Schritt oder den Verzicht auf eine Fortsetzung festhalten.`,
    criteria: (type, subject, date, check) => `Bis ${date} erhält die empfangende Person ${type} zum Thema „${subject}“. ${check} Sie hält gesondert fest, ob das Ergebnis dem vereinbarten Thema entspricht, und nimmt es an oder benennt eine konkrete Abweichung.`,
    checks: ['Das Dokument öffnen und prüfen, ob es ein Ergebnis zum Thema enthält und nicht nur eine Überschrift.', 'Den Link mit dem Zugang der empfangenden Person öffnen und prüfen, ob er zum Ergebnis für dieses Thema führt.', 'Die Demonstration ansehen und festhalten, welche Handlung zum Thema gezeigt wird und welches Ergebnis sichtbar ist.', 'Prüfen, ob die Punkte das Thema betreffen und jeweils ein Prüfergebnis oder eine offene Frage enthalten.', 'Die Notiz mit dem Gespräch abgleichen: Thema, offene Fragen, nächster Schritt oder Entscheidung gegen eine Fortsetzung; die andere Person kann Fehler korrigieren.'],
    boundary: 'Dies ist ein bearbeitbarer Vorschlag; Fähigkeiten sind Selbstauskünfte. Umfang, Vergütung und weitere Bedingungen müssen beide Personen gesondert ausdrücklich vereinbaren. Ein Gesprächsvorschlag ist keine Annahme bezahlter Arbeit.',
    referral: 'Kontakt und Zustimmung einer dritten Person sind unbestätigt; ihre Daten nur mit gesonderter Zustimmung weitergeben.',
  },
  en: {
    types: ['a document', 'a result link', 'a demonstration', 'a checklist', 'a conversation note'],
    target: (type, subject, date) => `Proposal: prepare ${type} about “${subject}” by ${date}.`,
    intro: (subject, date) => `Proposal: discuss “${subject}” by ${date} and record open questions and a possible next step or a decision not to continue.`,
    criteria: (type, subject, date, check) => `By ${date}, the receiver receives ${type} about “${subject}”. ${check} The receiver separately records whether the result matches the agreed subject and accepts it or identifies a specific mismatch.`,
    checks: ['Open the document and check that it contains a result about this subject, rather than only a heading.', 'Open the link using the receiver’s access and check that it leads to the result about this subject.', 'Watch the demonstration and record which action about this subject is shown and which result is visible.', 'Check that the items concern this subject and each includes a check result or an open question.', 'Compare the note with the conversation: subject, open questions, next step or decision not to continue; the other person can correct inaccuracies.'],
    boundary: 'This is an editable proposal; capabilities are self-declared. Both people must separately and explicitly agree on scope, compensation and other terms. A conversation proposal is not acceptance of paid work.',
    referral: 'The third party’s contact and consent are unconfirmed; share their data only with separate consent.',
  },
};
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// Reject ambiguous rendering/control text instead of silently truncating human input.
const safeText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value);
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const hasTag = (tag, tags) => typeof tag === 'string' && Object.hasOwn(CAPABILITIES, tag) && Array.isArray(tags) && tags.includes(tag);
const custom = value => value === undefined || value === '' || (typeof value === 'string' && !value.trim()) || safeText(value, 2000);
const languageFor = value => typeof value === 'string' && Object.hasOwn(copy, value) ? value : 'uk';

export function draftActionScope(input = {}) {
  const value = record(input) ? input : {}, language = languageFor(value.language), text = copy[language];
  const missing = [];
  if (!COLLABORATION_MODES.includes(value.mode)) missing.push('mode');
  if (!safeText(value.subject, 240)) missing.push('subject');
  if (!day(value.dueOn)) missing.push('dueOn');
  if (!EVIDENCE_TYPES.includes(value.evidenceType)) missing.push('evidenceType');
  if (!hasTag(value.capabilityTag, value.declaredTags)) missing.push('declaredCapability');
  if (!custom(value.target)) missing.push('target');
  if (!custom(value.acceptanceCriteria)) missing.push('acceptanceCriteria');
  const boundary = text.boundary + (value.mode === 'referral' || value.mode === 'hybrid' ? ' ' + text.referral : '');
  const result = { status: missing.length ? 'needs_input' : 'proposed', language, mode: COLLABORATION_MODES.includes(value.mode) ? value.mode : null,
    binding: false, requiresReview: true, competence: 'self_declared', missing, boundary, proposal: null };
  if (missing.length) return result;
  const index = EVIDENCE_TYPES.indexOf(value.evidenceType), type = text.types[index];
  const subject = value.subject.trim(), date = value.dueOn;
  result.proposal = {
    target: value.target?.trim() ? value.target : value.evidenceType === 'conversation_note' ? text.intro(subject, date) : text.target(type, subject, date),
    acceptance_criteria: value.acceptanceCriteria?.trim() ? value.acceptanceCriteria : text.criteria(type, subject, date, text.checks[index]),
  };
  return result;
}

// Both existing editor legs remain present; no second handshake state or financial defaults.
export function draftIntroOffer(input = {}) {
  const value = record(input) ? input : {}, fields = record(value.currentFields) ? value.currentFields : {};
  const scope = (prefix, capabilityTag, declaredTags) => draftActionScope({ language: value.language, mode: value.mode,
    subject: value.subject, dueOn: value.dueOn, evidenceType: 'conversation_note', capabilityTag, declaredTags,
    target: fields[prefix + '_target'], acceptanceCriteria: fields[prefix + '_criteria'] });
  const paid = value.mode === 'paid_service', direction = value.paidDirection;
  const give = paid && direction === 'buyer' ? null : scope('give', value.giveTag, value.ownOfferTags);
  const take = paid && direction === 'supplier' ? null : scope('take', value.takeTag, value.peerOfferTags);
  if (!take && !give) return { status: 'needs_input', kind: 'conversation_proposal', language: languageFor(value.language), mode: value.mode,
    binding: false, requiresReview: true, financialAgreement: false, boundary: copy[languageFor(value.language)].boundary, missing: ['paidDirection'], fields: null };
  const missing = [...new Set([...(give?.missing || []).map(key => 'give.' + key), ...(take?.missing || []).map(key => 'take.' + key), ...(paid && !['buyer', 'supplier', 'both'].includes(direction) ? ['paidDirection'] : [])])];
  if (value.currentFields !== undefined && !record(value.currentFields)) missing.push('currentFields');
  const anchor = take || give;
  return { status: missing.length ? 'needs_input' : 'proposed', kind: 'conversation_proposal', language: anchor.language,
    mode: anchor.mode, binding: false, requiresReview: true, financialAgreement: false, boundary: anchor.boundary, missing,
    fields: missing.length ? null : { ...(give ? { give_target: give.proposal.target, give_criteria: give.proposal.acceptance_criteria } : {}),
      ...(take ? { take_target: take.proposal.target, take_criteria: take.proposal.acceptance_criteria } : {}) } };
}
