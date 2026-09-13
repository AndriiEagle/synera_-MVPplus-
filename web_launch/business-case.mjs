import { compareRealProfiles, normalizeBrief, CAPABILITIES } from './profile-brief.mjs';

// A presentation of the existing matcher, not a second ranking engine or a contract.
export function buildBusinessCase(own, other, options = {}) {
  const comparison = compareRealProfiles(own, other, options);
  const eligibleModes = comparison.modeCandidates?.filter(candidate => candidate.status === 'eligible') ?? [];
  const requestedMode = typeof options.mode === 'string' ? eligibleModes.find(candidate => candidate.mode === options.mode) : null;
  const selectedMode = requestedMode ?? eligibleModes[0] ?? null;
  const result = { version: 2, status: comparison.status, mode: selectedMode?.mode ?? null, binding: false, visibility: 'private_draft', disclosureAllowed: false, benefits: [], agenda: [], terms: [], questions: [], unresolved: selectedMode?.unresolved ?? [] };
  if (comparison.status !== 'review_candidate') return result;
  const profiles = new Map([[own.id, own], [other.id, other]]);
  result.benefits = comparison.directions.filter(direction => direction.matched.length).map(direction => {
    const receiver = profiles.get(direction.receiver);
    return {
      giver: direction.giver, receiver: direction.receiver,
      capabilities: direction.matched.map(item => CAPABILITIES[item.tag]),
      requestedOutcome: normalizeBrief(receiver.brief).goal,
      evidence: direction.matched.flatMap(item => item.evidence),
      competence: 'self_declared', needConfirmed: false, deliveryAccepted: false,
    };
  });
  const referral = selectedMode?.mode === 'referral' ? selectedMode : selectedMode?.legs?.find(leg => leg.mode === 'referral' && leg.status === 'eligible');
  if (referral) {
    const receiver = profiles.get(referral.seeker);
    result.benefits.push({
      giver: referral.introducer, receiver: referral.seeker,
      capabilities: referral.matchedTags.map(tag => CAPABILITIES[tag]),
      requestedOutcome: normalizeBrief(receiver.brief).goal,
      evidence: referral.matchedTags.flatMap(tag => [`${referral.seeker}.needs.${tag}`, `${referral.introducer}.referral.benefitTags.${tag}`]),
      competence: 'third_party_unverified', needConfirmed: false, deliveryAccepted: false,
    });
  }
  result.benefits.sort((a, b) => a.receiver.localeCompare(b.receiver) || a.giver.localeCompare(b.giver));
  result.agenda = [
    '0–5 хв: кожен підтверджує актуальну потребу та бажаний результат.',
    '5–10 хв: кожен показує релевантний приклад своєї роботи.',
    '10–15 хв: погодьте по одному невеликому результату, обсяг і строк.',
    '15–20 хв: уточніть винагороду, перевірку результату та наступний крок.',
  ];
  result.terms = [
    { label: 'Результат і межі роботи кожної сторони', value: 'Погодити' },
    { label: 'Строк, доступний час і відповідальний за прийняття', value: 'Погодити' },
    { label: 'Оплата, обмін послугами або змішаний формат; сума й валюта', value: 'Погодити — взаємність не означає безоплатність' },
    { label: 'Критерії прийняття та кількість виправлень', value: 'Погодити' },
    { label: 'Права на результат і конфіденційність', value: 'Погодити до передавання матеріалів' },
    { label: 'Припинення співпраці й вирішення розбіжностей', value: 'Погодити' },
    { label: 'Країна діяльності, рахунок, податки та статус сторін', value: 'Уточнити для конкретної послуги; правовий висновок не сформовано' },
  ];
  result.questions = [
    'Чи потрібна тобі саме ця допомога зараз, і як ти перевіриш її користь?',
    'Який приклад доводить, що партнер може виконати саме цю роботу?',
    'Яка найменша пробна співпраця дасть результат обом?',
  ];
  return result;
}

export function businessCaseText(value, ownId) {
  if (value.status !== 'review_candidate') return '';
  return [
    'БІЗНЕС-КЕЙС ПАРИ · чернетка для обговорення',
    ...value.benefits.map(b => `${b.receiver === ownId ? 'Твій результат' : 'Результат партнера'}: ${b.requestedOutcome}. Заявлена допомога: ${b.capabilities.join(', ')}.`),
    'Навички заявлені учасниками. Актуальність потреб і компетентність ще потрібно підтвердити.',
    '', 'ПЕРША РОЗМОВА', ...value.agenda,
    '', 'УМОВИ', ...value.terms.map(t => `${t.label}: ${t.value}.`),
    '', 'ПИТАННЯ', ...value.questions,
    '', 'Це підготовка до розмови. Угода та згода іншої сторони ще не отримані.',
  ].join('\n');
}

export const INVALIDATION_MATRIX = Object.freeze({
  material_change: Object.freeze({ approvals: 'clear_both', next_action: 'block', history: 'preserve', version: 'increment' }),
  expiry: Object.freeze({ approvals: 'preserve_as_history', next_action: 'block', history: 'preserve', version: 'preserve' }),
  revocation: Object.freeze({ approvals: 'clear_both', next_action: 'block', history: 'preserve', version: 'preserve' }),
  abandonment: Object.freeze({ approvals: 'clear_both', next_action: 'block', history: 'preserve', version: 'preserve' }),
  comparison_consent_withdrawn: Object.freeze({ approvals: 'preserve_as_history', next_action: 'block', history: 'preserve', version: 'preserve' }),
  case_disclosure_withdrawn: Object.freeze({ approvals: 'preserve_as_history', next_action: 'block', history: 'preserve', version: 'preserve' }),
  terms_approval_withdrawn: Object.freeze({ approvals: 'clear_withdrawing_party', next_action: 'block', history: 'preserve', version: 'preserve' }),
  introduction_consent_withdrawn: Object.freeze({ approvals: 'preserve_as_history', next_action: 'block', history: 'preserve', version: 'preserve' }),
});

const MATERIAL_MODES = new Set(['exchange', 'paid_service', 'referral', 'hybrid']);
const COMPONENTS = new Set(['exchange', 'paid_service', 'referral']);
const CAPABILITY_KEYS = new Set(Object.keys(CAPABILITIES));
const COMPENSATION = new Set(['unresolved', 'agreed_exchange', 'agreed_money', 'agreed_none']);
const CONFIDENTIALITY = new Set(['unresolved', 'required', 'not_required']);
const INTELLECTUAL_PROPERTY = new Set(['unresolved', 'giver', 'receiver', 'shared']);
const CANCELLATION = new Set(['unresolved', 'mutual_written_notice', 'either_party_before_start']);
const clone = value => JSON.parse(JSON.stringify(value));
const validId = value => typeof value === 'string' && /^[a-z0-9-]{1,64}$/.test(value);
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const validInstant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const boundedText = (value, label) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 2000) throw new Error(`Invalid ${label}`);
  return value.trim();
};
const enumValue = (value, allowed, fallback) => allowed.has(value) ? value : fallback;
const uniqueSorted = (input, allowed) => [...new Set((Array.isArray(input) ? input : []).filter(value => allowed.has(value)))].sort();

function normalizedOutcome(value = {}) {
  if (!validId(value.receiver_id) || !CAPABILITY_KEYS.has(value.capability_tag)) throw new Error('Invalid outcome owner or capability');
  return { receiver_id: value.receiver_id, capability_tag: value.capability_tag, target: boundedText(value.target, 'outcome target') };
}

function normalizedDeliverable(value = {}) {
  if (!validId(value.giver_id) || !validId(value.receiver_id) || value.giver_id === value.receiver_id || !CAPABILITY_KEYS.has(value.capability_tag)) throw new Error('Invalid deliverable parties or capability');
  return {
    giver_id: value.giver_id, receiver_id: value.receiver_id, capability_tag: value.capability_tag,
    target: boundedText(value.target, 'deliverable target'), acceptance_criteria: boundedText(value.acceptance_criteria, 'acceptance criteria'),
  };
}

export function canonicalMaterialPayload(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !MATERIAL_MODES.has(input.mode)) throw new Error('Invalid material mode');
  const components = uniqueSorted(input.components, COMPONENTS);
  if (input.mode === 'hybrid' ? components.length < 2 : components.length !== 1 || components[0] !== input.mode) throw new Error('Invalid material components');
  const outcomes = (Array.isArray(input.outcomes) ? input.outcomes : []).map(normalizedOutcome).sort((a, b) => a.receiver_id.localeCompare(b.receiver_id) || a.capability_tag.localeCompare(b.capability_tag) || a.target.localeCompare(b.target));
  const deliverables = (Array.isArray(input.trial?.deliverables) ? input.trial.deliverables : []).map(normalizedDeliverable).sort((a, b) => a.receiver_id.localeCompare(b.receiver_id) || a.giver_id.localeCompare(b.giver_id) || a.capability_tag.localeCompare(b.capability_tag) || a.target.localeCompare(b.target));
  if (!outcomes.length || !deliverables.length || !validDay(input.trial?.starts_on) || !validDay(input.trial?.due_on) || input.trial.starts_on > input.trial.due_on) throw new Error('Invalid trial material');
  const compensationStatus = enumValue(input.compensation?.status, COMPENSATION, 'unresolved');
  const money = compensationStatus === 'agreed_money';
  const amountMinor = money && Number.isSafeInteger(input.compensation?.amount_minor) && input.compensation.amount_minor > 0 ? input.compensation.amount_minor : null;
  const currency = money && typeof input.compensation?.currency === 'string' && /^[A-Z]{3}$/.test(input.compensation.currency) ? input.compensation.currency : '';
  const invoiceRequired = money && typeof input.compensation?.invoice_required === 'boolean' ? input.compensation.invoice_required : null;
  return {
    mode: input.mode, components, outcomes,
    trial: { starts_on: input.trial.starts_on, due_on: input.trial.due_on, deliverables },
    compensation: { status: compensationStatus, amount_minor: amountMinor, currency, invoice_required: invoiceRequired },
    terms: {
      revision_limit: Number.isSafeInteger(input.terms?.revision_limit) && input.terms.revision_limit >= 0 && input.terms.revision_limit <= 100 ? input.terms.revision_limit : null,
      confidentiality: enumValue(input.terms?.confidentiality, CONFIDENTIALITY, 'unresolved'),
      intellectual_property: enumValue(input.terms?.intellectual_property, INTELLECTUAL_PROPERTY, 'unresolved'),
      cancellation: enumValue(input.terms?.cancellation, CANCELLATION, 'unresolved'),
    },
  };
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function hashMaterialPayload(input) {
  const payload = canonicalMaterialPayload(input), bytes = new TextEncoder().encode(canonicalJson(payload));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function caseMaterialProblems(input) {
  let material;
  try { material = canonicalMaterialPayload(input); } catch (error) { return [error.message]; }
  const problems = [];
  if (material.compensation.status === 'unresolved') problems.push('compensation unresolved');
  if (material.components.includes('paid_service') && material.compensation.status !== 'agreed_money') problems.push('paid service compensation must be explicit money terms');
  if (material.compensation.status === 'agreed_money' && (material.compensation.amount_minor === null || !material.compensation.currency || material.compensation.invoice_required === null)) problems.push('money amount, currency and invoice choice required');
  if (material.terms.revision_limit === null) problems.push('revision limit unresolved');
  if (material.terms.confidentiality === 'unresolved') problems.push('confidentiality unresolved');
  if (material.terms.intellectual_property === 'unresolved') problems.push('intellectual property unresolved');
  if (material.terms.cancellation === 'unresolved') problems.push('cancellation unresolved');
  return problems;
}

// Human-entered terms only. An empty, malformed or unknown field stays unresolved; nothing is defaulted into agreement.
export function materialTermsFromInput(fields = {}) {
  const text = key => typeof fields?.[key] === 'string' ? fields[key].trim() : '';
  const status = enumValue(text('compensation_status'), COMPENSATION, 'unresolved');
  const money = status === 'agreed_money';
  const amount = /^\d{1,9}(?:[.,]\d{1,2})?$/.test(text('amount')) ? Math.round(Number(text('amount').replace(',', '.')) * 100) : null;
  const revision = /^\d{1,3}$/.test(text('revision_limit')) ? Number(text('revision_limit')) : null;
  return {
    compensation: {
      status, amount_minor: money && Number.isSafeInteger(amount) && amount > 0 ? amount : null,
      currency: money && /^[A-Z]{3}$/.test(text('currency')) ? text('currency') : '',
      invoice_required: money && ['yes', 'no'].includes(text('invoice')) ? text('invoice') === 'yes' : null,
    },
    terms: {
      revision_limit: revision !== null && revision <= 100 ? revision : null,
      confidentiality: enumValue(text('confidentiality'), CONFIDENTIALITY, 'unresolved'),
      intellectual_property: enumValue(text('intellectual_property'), INTELLECTUAL_PROPERTY, 'unresolved'),
      cancellation: enumValue(text('cancellation'), CANCELLATION, 'unresolved'),
    },
  };
}

export function caseParticipantProblems(input, participants) {
  let material;
  try { material = canonicalMaterialPayload(input); } catch (error) { return [error.message]; }
  const ids = new Set(Array.isArray(participants) ? participants : []);
  const problems = [];
  for (const outcome of material.outcomes) if (!ids.has(outcome.receiver_id)) problems.push(`outcome receiver ${outcome.receiver_id} is not a case participant`);
  for (const deliverable of material.trial.deliverables) {
    if (!ids.has(deliverable.giver_id)) problems.push(`deliverable giver ${deliverable.giver_id} is not a case participant`);
    if (!ids.has(deliverable.receiver_id)) problems.push(`deliverable receiver ${deliverable.receiver_id} is not a case participant`);
  }
  return [...new Set(problems)];
}

function assertState(state) {
  if (!state || state.schema !== 'synera.case-state.v1' || !validId(state.caseId) || !Array.isArray(state.participants) || state.participants.length !== 2 || new Set(state.participants).size !== 2 || state.participants.some(id => !validId(id)) || !Number.isSafeInteger(state.version) || state.version < 1 || typeof state.termsHash !== 'string' || !/^[a-f0-9]{64}$/.test(state.termsHash) || !state.approvals || typeof state.approvals !== 'object' || Array.isArray(state.approvals) || !Array.isArray(state.events) || !validInstant(state.createdAt) || !validInstant(state.updatedAt) || !validInstant(state.expiresAt)) throw new Error('Invalid case state');
}

async function stateIntegrityProblems(state) {
  const problems = [];
  let canonical;
  try { canonical = canonicalMaterialPayload(state.material); } catch (error) { return [error.message]; }
  if (canonicalJson(canonical) !== canonicalJson(state.material)) problems.push('material is not canonical');
  if ((await hashMaterialPayload(canonical)) !== state.termsHash) problems.push('material hash mismatch');
  problems.push(...caseParticipantProblems(canonical, state.participants));
  for (const [partyId, approval] of Object.entries(state.approvals)) {
    if (!state.participants.includes(partyId) || approval?.partyId !== partyId || approval?.version !== state.version || approval?.termsHash !== state.termsHash || !validInstant(approval?.approvedAt) || approval?.attestation !== state.approvalAttestation) problems.push('approval integrity mismatch');
  }
  return [...new Set(problems)];
}

export async function createCaseState({ caseId, participants, material, now, expiresAt }) {
  const ids = [...new Set(Array.isArray(participants) ? participants : [])].sort();
  if (!validId(caseId) || ids.length !== 2 || ids.some(id => !validId(id)) || !validInstant(now) || !validInstant(expiresAt) || expiresAt <= now) throw new Error('Invalid case identity, participants or time');
  const canonical = canonicalMaterialPayload(material);
  const participantProblems = caseParticipantProblems(canonical, ids);
  if (participantProblems.length) throw new Error(`Invalid case participant material: ${participantProblems.join('; ')}`);
  return {
    schema: 'synera.case-state.v1', caseId, participants: ids, version: 1, material: canonical,
    termsHash: await hashMaterialPayload(canonical), status: 'draft', approvals: {}, binding: false,
    approvalAttestation: 'ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT', createdAt: now, updatedAt: now, expiresAt,
    closedBy: null, closedAt: null, closeReason: null, timeAuthority: 'caller_supplied_d1',
    events: [{ type: 'created', at: now, version: 1 }],
  };
}

export function approveCase(state, { partyId, termsHash, now }) {
  assertState(state);
  if (!state.participants.includes(partyId) || !validInstant(now) || now < state.updatedAt) throw new Error('Invalid approval party or time');
  if (['revoked', 'abandoned'].includes(state.status) || now >= state.expiresAt) throw new Error('Case is closed or expired');
  if (termsHash !== state.termsHash) throw new Error('Approval terms hash mismatch');
  const problems = caseMaterialProblems(state.material);
  if (problems.length) throw new Error(`Material terms incomplete: ${problems.join('; ')}`);
  const next = clone(state);
  next.approvals[partyId] = { partyId, version: next.version, termsHash: next.termsHash, approvedAt: now, attestation: next.approvalAttestation };
  next.status = next.participants.every(id => next.approvals[id]?.version === next.version && next.approvals[id]?.termsHash === next.termsHash) ? 'approved_for_next_step' : 'awaiting_approval';
  next.updatedAt = now; next.events.push({ type: 'approved', by: partyId, at: now, version: next.version, termsHash: next.termsHash });
  return next;
}

export function withdrawApproval(state, { partyId, now }) {
  assertState(state);
  if (!state.participants.includes(partyId) || !validInstant(now) || now < state.updatedAt || ['revoked', 'abandoned'].includes(state.status) || now >= state.expiresAt || !state.approvals[partyId]) throw new Error('Invalid approval withdrawal');
  const next = clone(state); delete next.approvals[partyId];
  next.status = Object.keys(next.approvals).length ? 'awaiting_approval' : 'draft'; next.updatedAt = now;
  next.events.push({ type: 'approval_withdrawn', by: partyId, at: now, version: next.version, termsHash: next.termsHash });
  return next;
}

export async function reviseCase(state, { material, now }) {
  assertState(state);
  if (!validInstant(now) || now < state.updatedAt || ['revoked', 'abandoned'].includes(state.status) || now >= state.expiresAt) throw new Error('Case is closed, expired or revision time is invalid');
  const canonical = canonicalMaterialPayload(material), termsHash = await hashMaterialPayload(canonical);
  const participantProblems = caseParticipantProblems(canonical, state.participants);
  if (participantProblems.length) throw new Error(`Invalid case participant material: ${participantProblems.join('; ')}`);
  if (termsHash === state.termsHash) return clone(state);
  const next = clone(state), previousHash = next.termsHash;
  next.version += 1; next.material = canonical; next.termsHash = termsHash; next.approvals = {}; next.status = 'draft'; next.updatedAt = now;
  next.events.push({ type: 'material_changed', at: now, version: next.version, previousHash, termsHash });
  return next;
}

function closeCase(state, { partyId, now }, status) {
  assertState(state);
  if (!state.participants.includes(partyId) || !validInstant(now) || now < state.updatedAt || ['revoked', 'abandoned'].includes(state.status)) throw new Error('Invalid case closure');
  const next = clone(state); next.status = status; next.approvals = {}; next.closedBy = partyId; next.closedAt = now; next.closeReason = status; next.updatedAt = now;
  next.events.push({ type: status, by: partyId, at: now, version: next.version });
  return next;
}

export const revokeCase = (state, input) => closeCase(state, input, 'revoked');
export const abandonCase = (state, input) => closeCase(state, input, 'abandoned');

export async function reviewCaseAction(state, { action, permissions, now }) {
  assertState(state);
  if (action !== 'introduction' || !validInstant(now) || now < state.updatedAt) return { allowed: false, binding: false, reasonCodes: ['INVALID_ACTION_OR_TIME'] };
  if ((await stateIntegrityProblems(state)).length) return { allowed: false, binding: false, reasonCodes: ['CASE_INTEGRITY_INVALID'] };
  if (now >= state.expiresAt) return { allowed: false, binding: false, reasonCodes: ['CASE_EXPIRED'] };
  if (state.status === 'revoked') return { allowed: false, binding: false, reasonCodes: ['CASE_REVOKED'] };
  if (state.status === 'abandoned') return { allowed: false, binding: false, reasonCodes: ['CASE_ABANDONED'] };
  if (state.status !== 'approved_for_next_step' || !state.participants.every(id => state.approvals[id]?.version === state.version && state.approvals[id]?.termsHash === state.termsHash)) return { allowed: false, binding: false, reasonCodes: ['BOTH_CURRENT_APPROVALS_REQUIRED'] };
  const required = [['caseDisclosure', 'CASE_DISCLOSURE_CONSENT_MISSING'], ['comparison', 'COMPARISON_CONSENT_MISSING'], ['termsApproval', 'TERMS_APPROVAL_CONSENT_MISSING'], ['introduction', 'INTRODUCTION_CONSENT_MISSING']];
  for (const [field, reason] of required) if (!state.participants.every(id => permissions?.[id]?.[field] === true)) return { allowed: false, binding: false, reasonCodes: [reason] };
  return { allowed: true, binding: false, reasonCodes: [], caseId: state.caseId, version: state.version, termsHash: state.termsHash };
}
