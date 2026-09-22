// Scenario assumptions, not actual provider usage, taxes due, demand or accounting profit.
export function economics({ price = 39, members = 50, minutes = 10, hourly = 45, ai = 1, infrastructure = 50, fixedHours = 8, acquisition = 200, vat = 0, paymentPercent = 2.9, billingPercent = 0.7, paymentFixed = 0.30 } = {}) {
  const values = [price, members, minutes, hourly, ai, infrastructure, fixedHours, acquisition, vat, paymentPercent, billingPercent, paymentFixed];
  if (values.some(n => !Number.isFinite(n) || n < 0) || price <= 0 || !Number.isInteger(members) || vat > 100 || paymentPercent + billingPercent > 100) throw new Error('Некоректний сценарій');
  const revenuePerMember = price / (1 + vat / 100);
  const feesPerMember = price * (paymentPercent + billingPercent) / 100 + paymentFixed;
  const timePerMember = minutes * hourly / 60;
  const contribution = revenuePerMember - feesPerMember - ai - timePerMember;
  const fixed = infrastructure + fixedHours * hourly + acquisition;
  const beforeOwnerTime = members * (revenuePerMember - feesPerMember - ai) - infrastructure - acquisition;
  return { revenuePerMember, feesPerMember, timePerMember, contribution, fixed,
    grossRevenue: members * price, beforeOwnerTime, afterOwnerTime: members * contribution - fixed,
    breakEvenMembers: contribution > 0 ? Math.ceil(fixed / contribution) : null,
    contributionMargin: contribution / revenuePerMember,
    hoursPerMonth: members * minutes / 60 + fixedHours,
    // Time ceiling for a 60% contribution margin before fixed costs.
    sixtyPercentFeasible: 0.4 * revenuePerMember - feesPerMember - ai >= 0,
    minutesFor60Percent: hourly > 0 && 0.4 * revenuePerMember - feesPerMember - ai >= 0 ? (0.4 * revenuePerMember - feesPerMember - ai) * 60 / hourly : null,
  };
}

export const PILOT_STATES = Object.freeze(['not_eligible', 'declined', 'no_response', 'trial_agreed', 'trial_started', 'trial_completed', 'outcome_accepted', 'outcome_rejected', 'feedback_missing', 'dispute_open', 'dispute_resolved', 'dispute_unresolved', 'abandoned']);
const PILOT_SOURCES = new Set(['real_authorized', 'synthetic_test']);
const PILOT_CHANNELS = new Set(['synera', 'manual']);
const validInstant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const validKey = value => typeof value === 'string' && /^[a-z0-9:-]{1,100}$/.test(value);

function validatePilotEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Некоректна подія пілоту');
  if (!validKey(event.eventId) || !validKey(event.pairKey) || !validKey(event.caseId)) throw new Error('Подія пілоту вимагає псевдонімні ключі');
  if (!PILOT_SOURCES.has(event.source)) throw new Error('Джерело події пілоту має бути real_authorized або synthetic_test');
  if (!PILOT_CHANNELS.has(event.channel) || !PILOT_STATES.includes(event.state) || !validInstant(event.occurredAt)) throw new Error('Некоректний канал, стан або час пілоту');
  if (!Number.isFinite(event.operatorMinutes) || event.operatorMinutes < 0) throw new Error('Хвилини оператора мають бути виміряні');
  if (event.directCashCost !== null && (!Number.isFinite(event.directCashCost) || event.directCashCost < 0)) throw new Error('Грошова витрата має бути виміряною або невідомою');
  if (['outcome_accepted', 'outcome_rejected'].includes(event.state)) {
    const expected = event.state === 'outcome_accepted' ? 'accepted' : 'rejected';
    if (!Number.isInteger(event.caseVersion) || event.caseVersion < 1 || typeof event.termsHash !== 'string' || !/^[a-f0-9]{64}$/.test(event.termsHash) || event.recipientDecision !== expected) throw new Error('Рішення про результат має посилатися на точну версію кейсу та хеш умов');
  }
  return event;
}

export function pilotFunnel(events, { source = 'real_authorized' } = {}) {
  if (!PILOT_SOURCES.has(source) || !Array.isArray(events)) throw new Error('Некоректний вхід воронки пілоту');
  const seen = new Set(), valid = events.map(validatePilotEvent);
  for (const event of valid) {
    if (seen.has(event.eventId)) throw new Error('Дублювання ID події пілоту');
    seen.add(event.eventId);
  }
  const selected = valid.filter(event => event.source === source);
  const states = Object.fromEntries(PILOT_STATES.map(state => [state, 0]));
  const channels = { synera: 0, manual: 0 };
  for (const event of selected) { states[event.state] += 1; channels[event.channel] += 1; }
  return {
    schema: 'synera.pilot-funnel.v1', source, eventCount: selected.length,
    uniquePairs: new Set(selected.map(event => event.pairKey)).size,
    uniqueCases: new Set(selected.map(event => event.caseId)).size,
    states, channels,
    operatorMinutes: selected.reduce((sum, event) => sum + event.operatorMinutes, 0),
    directCashCost: selected.some(event => event.directCashCost === null) ? null : selected.reduce((sum, event) => sum + event.directCashCost, 0),
    sourceAuthentication: 'caller_supplied_d1_not_authenticated',
    businessEvidenceCandidate: source === 'real_authorized',
    businessEvidence: false,
  };
}

// SYN_IMPORT_AUDITED: profile_imported — append-only metadata about a confirmed AI-memory import.
// Metadata only, never business or demand evidence: pseudonymous field keys and a draft hash, no PII,
// no raw hint text. The log never blends with the pilot funnel and is always read per single source.
export const PROFILE_IMPORT_SOURCES = Object.freeze(['real', 'synthetic']);
const PROFILE_IMPORT_KEYS = 'draftHash,fieldsConfirmed,source,timestamp';
const PROFILE_IMPORT_FIELD = /^[a-z0-9_.]{1,64}$/;

export function createProfileImportedEvent({ source, fieldsConfirmed, draftHash, timestamp } = {}) {
  if (!PROFILE_IMPORT_SOURCES.includes(source)) throw new Error('Джерело імпорту профілю має бути real або synthetic');
  if (!Array.isArray(fieldsConfirmed) || !fieldsConfirmed.length || fieldsConfirmed.length > 64 || new Set(fieldsConfirmed).size !== fieldsConfirmed.length || !fieldsConfirmed.every(field => typeof field === 'string' && PROFILE_IMPORT_FIELD.test(field))) throw new Error('fieldsConfirmed мають бути унікальними псевдонімними ключами полів як offer_tags.sales');
  if (typeof draftHash !== 'string' || !/^[a-f0-9]{64}$/.test(draftHash)) throw new Error('draftHash має бути sha-256 hex дайджестом підтвердженого чернетки');
  if (!validInstant(timestamp)) throw new Error('Некоректний timestamp profile_imported');
  return { source, fieldsConfirmed: [...fieldsConfirmed], draftHash, timestamp };
}

function validateProfileImportedEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Некоректна подія profile_imported');
  if (Object.keys(event).sort().join(',') !== PROFILE_IMPORT_KEYS) throw new Error('profile_imported дозволяє лише source, fieldsConfirmed, draftHash, timestamp');
  return createProfileImportedEvent(event);
}

export function appendProfileImportedEvent(events, event) {
  if (!Array.isArray(events)) throw new Error('Лог імпорту профілю має бути масивом');
  const validated = validateProfileImportedEvent(event);
  for (const existing of events) {
    const known = validateProfileImportedEvent(existing);
    if (known.source === validated.source && known.draftHash === validated.draftHash && known.timestamp === validated.timestamp && JSON.stringify(known.fieldsConfirmed) === JSON.stringify(validated.fieldsConfirmed)) throw new Error('Дублювання події profile_imported');
  }
  return [...events, validated];
}

export function profileImportMeta(events, { source } = {}) {
  if (!PROFILE_IMPORT_SOURCES.includes(source)) throw new Error('Джерело імпорту профілю має бути real або synthetic');
  const selected = (Array.isArray(events) ? events : []).map(validateProfileImportedEvent).filter(event => event.source === source);
  return {
    schema: 'synera.profile-import.meta.v1', source, eventCount: selected.length,
    distinctDraftHashes: new Set(selected.map(event => event.draftHash)).size,
    fieldsConfirmed: [...new Set(selected.flatMap(event => event.fieldsConfirmed))].sort(),
    businessEvidence: false,
    demandEvidence: false,
  };
}

// SYN_TELEMETRY_CONTRACT: append-only local telemetry for operator_cockpit (events.jsonl).
// Extension of the CNR-012 event contract, never a second ledger: pseudonymous ids only,
// NO PII, NO raw text, NO model outputs, 10s dedup hash, source real|synthetic.
// Gate: analytics consent off -> zero writes (appendEvent returns the input untouched).
export const TELEMETRY_SCHEMA = 'synera.telemetry.v1';
export const TELEMETRY_EVENTS = Object.freeze(['profile_started', 'profile_completed', 'mode_selected', 'candidate_viewed', 'case_created', 'approval_given', 'approval_withdrawn', 'terms_revised', 'intro_requested', 'trial_agreed', 'trial_completed', 'outcome_submitted', 'feedback_given', 'feedback_missing', 'dispute_opened', 'export_requested', 'delete_requested', 'consent_granted', 'consent_revoked']);
export const TELEMETRY_SOURCES = Object.freeze(['real', 'synthetic']);
export const OPERATOR_CATEGORIES = Object.freeze(['clarification', 'moderation', 'technical', 'dispute']);
const TELEMETRY_PROPERTIES = new Set(['pair_id', 'profile_id', 'mode', 'version', 'duration_ms', 'user_agent', 'locale', 'step_origin', 'city_bucket', 'operator_minutes', 'operator_category', 'consent_topic']);
const TELEMETRY_PII = [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu, /(?<![A-Za-z0-9_-])(?:\+?\d[\s().-]*){9,}(?![A-Za-z0-9_-])/u, /\b(?:sb_secret_|sk-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|ya29\.)/u];

export function validateTelemetryEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Некоректна телеметрична подія');
  if (!TELEMETRY_EVENTS.includes(event.type) || !validInstant(event.at) || !TELEMETRY_SOURCES.includes(event.source)) throw new Error('Телеметрична подія вимагає базовий тип, миттєво та real|synthetic джерело');
  const properties = event.properties ?? {};
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) throw new Error("Властивості телеметрії мають бути плоским об'єктом");
  for (const [key, value] of Object.entries(properties)) {
    if (!TELEMETRY_PROPERTIES.has(key)) throw new Error(`Властивість телеметрії ${key} не в дозволеному списку`);
    const ok = typeof value === 'boolean' || (Number.isFinite(value) && typeof value === 'number') || (typeof value === 'string' && value.length <= 120 && !TELEMETRY_PII.some(pattern => pattern.test(value)));
    if (!ok) throw new Error(`Властивість телеметрії ${key} має бути обмеженим псевдонімним значенням без PII`);
  }
  const minutes = properties.operator_minutes;
  if (minutes !== undefined) {
    if (!Number.isFinite(minutes) || minutes < 0) throw new Error("Хвилини оператора мають бути невід'ємним виміряним числом");
    if (!OPERATOR_CATEGORIES.includes(properties.operator_category)) throw new Error('Хвилини оператора вимагають категорію: clarification, moderation, technical або dispute');
  }
  return { schema: TELEMETRY_SCHEMA, type: event.type, at: event.at, source: event.source, properties: { ...properties } };
}

// 10-second dedup: identical logical events inside one 10s bucket collapse to one line.
export function telemetryDedupHash(event) {
  const bucket = Math.floor(Date.parse(validInstant(event.at) ? event.at : new Date(NaN).toISOString()) / 10000);
  if (!Number.isFinite(bucket)) throw new Error('Некоректний час телеметричної події');
  const input = [event.type, event.source, event.properties?.pair_id ?? '', event.properties?.profile_id ?? '', bucket].join('|');
  let hash = 5381;
  for (const byte of new TextEncoder().encode(input)) hash = ((hash * 33) ^ byte) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

export function appendEvent(events, event, { analyticsConsent = false } = {}) {
  if (!Array.isArray(events)) throw new Error('Лог телеметрії має бути масивом');
  if (!analyticsConsent) return events; // zero writes, not even a refusal marker (addendum G7 gate)
  const validated = validateTelemetryEvent(event);
  validated.dedupHash = telemetryDedupHash(validated);
  if (events.some(existing => existing.dedupHash === validated.dedupHash)) return events;
  return [...events, validated];
}

// Node-side sink. Browser code never calls this; the import stays dynamic so the
// browser module graph never pulls node:fs. Append-only: existing lines are never rewritten.
export async function writeEventsLog(events, { path = 'events.jsonl' } = {}) {
  if (!Array.isArray(events) || !events.length) return 0;
  const lines = events.map(event => JSON.stringify(validateTelemetryEvent(event)) + '\n').join('');
  let fs;
  try { fs = await import('node:fs/promises'); }
  catch { throw new Error('Телеметрія пишеться лише в Node-середовищі оператора.'); }
  await fs.appendFile(path, lines, 'utf8');
  return events.length;
}

export function caseEconomics({
  aiPrompts = 0,
  aiCostPerPrompt = 0.015,
  operatorMinutes = 0,
  operatorHourlyRate = 45,
  gatewayFees = 0.30
} = {}) {
  if (aiPrompts < 0 || aiCostPerPrompt < 0 || operatorMinutes < 0 || operatorHourlyRate < 0 || gatewayFees < 0) {
    throw new Error('Invalid case economics input');
  }
  const aiCost = aiPrompts * aiCostPerPrompt;
  const operatorCost = (operatorMinutes / 60) * operatorHourlyRate;
  const totalCost = aiCost + operatorCost + gatewayFees;
  return Object.freeze({
    aiCost,
    operatorCost,
    gatewayFees,
    totalCost
  });
}
