// Decision layer v1 is a local, typed adapter over Synera's existing authorities.
// It is advisory-only: it has no provider, persistence, payment, or tool access.
import { compareProfiles } from './matching.mjs';
import { reviewCaseAction } from './business-case.mjs';

export const DECISION_KINDS = Object.freeze([
  'best_collaboration_mode', 'display_path', 'recalculation_required',
  'meeting_readiness', 'next_user_question',
]);

const RESULT = Object.freeze({ schema_version: 'synera.decision.v1' });
const ACTIONS = new Set(['recommend', 'request_data', 'manual_review', 'blocked']);
const trustedDecisions = new WeakSet();
const copy = value => JSON.parse(JSON.stringify(value));
const validKind = kind => DECISION_KINDS.includes(kind);
const out = (kind, action, reasonCodes, { hardVetoes = [], payload = {} } = {}) => {
  const result = {
    ...RESULT, decision_kind: kind, action, reason_codes: [...new Set(reasonCodes)].sort(),
    hard_vetoes: [...new Set(hardVetoes)].sort(), advisory_allowed: hardVetoes.length === 0,
    payload: copy(payload),
  };
  Object.freeze(result.reason_codes);
  Object.freeze(result.hard_vetoes);
  trustedDecisions.add(result);
  return Object.freeze(result);
};

export function validateDecisionRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request) || !validKind(request.decision_kind)) {
    throw new TypeError('Invalid Synera decision request');
  }
  return request;
}

const questionFor = result => {
  if (result.status === 'consent_required') return 'Чи обидві сторони окремо дозволили це порівняння?';
  if (result.status === 'incompatible') return 'Яку конкретну несумісність треба змінити або підтвердити вручну?';
  if (result.status === 'insufficient_mutual_value') return 'Яка заявлена потреба кожної сторони має отримати явне покриття?';
  return 'Яке відсутнє поле профілю можна підтвердити без припущень?';
};

function comparison(request) {
  if (!request.left || !request.right) return null;
  return compareProfiles(request.left, request.right, { asOf: request.as_of });
}

function comparisonVeto(result) {
  if (!result) return ['PAIR_INPUT_REQUIRED'];
  if (result.status === 'consent_required') return ['CONSENT_REQUIRED'];
  if (result.status === 'incompatible') return ['HARD_INCOMPATIBILITY'];
  if (result.status === 'insufficient_mutual_value') return ['ONE_WAY_VALUE'];
  return [];
}

function bestMode(request, result) {
  const vetoes = comparisonVeto(result);
  if (vetoes.length) return out(request.decision_kind, 'blocked', result?.reasons ?? ['PAIR_INPUT_REQUIRED'], { hardVetoes: vetoes });
  if (result.status !== 'review_candidate') return out(request.decision_kind, 'request_data', result.reasons, { payload: { question: questionFor(result) } });
  const unresolved = candidate => Boolean(candidate.unresolved?.length || candidate.legs?.some(unresolved));
  const pending = result.modeCandidates.filter(candidate => candidate.status === 'eligible' && unresolved(candidate));
  const candidates = result.modeCandidates.filter(candidate => candidate.status === 'eligible' && !unresolved(candidate)).map(candidate => candidate.mode);
  if (!candidates.length && pending.length) return out(request.decision_kind, 'manual_review', ['MODE_TERMS_OR_THIRD_PARTY_UNRESOLVED'], { payload: { question: 'Які умови оплати або згоду третьої сторони ще треба підтвердити?' } });
  if (!candidates.length) return out(request.decision_kind, 'request_data', ['ELIGIBLE_MODE_NOT_DECLARED'], { payload: { question: questionFor(result) } });
  return out(request.decision_kind, 'recommend', ['NON_BINDING_MODE_CANDIDATE'], { payload: { modes: candidates, binding: false } });
}

function displayPath(request, result) {
  const vetoes = comparisonVeto(result);
  if (vetoes.length) return out(request.decision_kind, 'blocked', ['PAIR_NOT_SAFE_TO_SHOW'], { hardVetoes: vetoes });
  if (result.status !== 'review_candidate') return out(request.decision_kind, 'request_data', ['PROFILE_DATA_INCOMPLETE'], { payload: { question: questionFor(result) } });
  return out(request.decision_kind, 'manual_review', ['INTRODUCTION_REQUIRES_SEPARATE_APPROVALS'], { payload: { show: 'pseudonymous_candidate', request_data: [], manual_review: true } });
}

function recalculation(request) {
  const change = request.change;
  if (!change || !['price', 'deadline', 'volume'].includes(change.field)) return out(request.decision_kind, 'request_data', ['MATERIAL_CHANGE_REQUIRED'], { payload: { question: 'Яку ціну, дедлайн або обсяг треба змінити?' } });
  const current = request.case_state;
  if (!current || current.schema !== 'synera.case-state.v1') return out(request.decision_kind, 'request_data', ['CASE_STATE_REQUIRED']);
  return out(request.decision_kind, 'manual_review', ['MATERIAL_CHANGE_REQUIRES_NEW_VERSION', 'CURRENT_APPROVALS_MUST_BE_CLEARED'], { payload: { required_action: 'revise_case', fields: [change.field], binding: false } });
}

async function meetingReadiness(request) {
  const state = request.case_state;
  if (!state || state.schema !== 'synera.case-state.v1') return out(request.decision_kind, 'request_data', ['CASE_STATE_REQUIRED']);
  if (['revoked', 'abandoned'].includes(state.status)) return out(request.decision_kind, 'blocked', ['CASE_CLOSED'], { hardVetoes: ['CASE_CLOSED'] });
  if (state.status !== 'approved_for_next_step') return out(request.decision_kind, 'blocked', ['BOTH_CURRENT_APPROVALS_REQUIRED'], { hardVetoes: ['TERMS_OR_APPROVALS_UNRESOLVED'] });
  let gate;
  try {
    gate = await reviewCaseAction(state, { action: 'introduction', permissions: request.permissions, now: request.now });
  } catch {
    return out(request.decision_kind, 'blocked', ['CASE_INTEGRITY_INVALID'], { hardVetoes: ['CASE_INTEGRITY_INVALID'] });
  }
  if (!gate.allowed) return out(request.decision_kind, 'blocked', gate.reasonCodes, { hardVetoes: gate.reasonCodes });
  return out(request.decision_kind, 'manual_review', ['MEETING_REQUIRES_HUMAN_CONFIRMATION'], { payload: { may_prepare_brief: true, may_schedule: false } });
}

// All paths are deterministic and intentionally abstain instead of guessing.
export async function decide(request) {
  validateDecisionRequest(request);
  const result = ['best_collaboration_mode', 'display_path', 'next_user_question'].includes(request.decision_kind) ? comparison(request) : null;
  if (request.decision_kind === 'best_collaboration_mode') return bestMode(request, result);
  if (request.decision_kind === 'display_path') return displayPath(request, result);
  if (request.decision_kind === 'recalculation_required') return recalculation(request);
  if (request.decision_kind === 'meeting_readiness') return meetingReadiness(request);
  const vetoes = comparisonVeto(result);
  return vetoes.length
    ? out(request.decision_kind, 'blocked', result?.reasons ?? ['PAIR_INPUT_REQUIRED'], { hardVetoes: vetoes })
    : out(request.decision_kind, 'request_data', ['NEXT_SAFE_QUESTION'], { payload: { question: questionFor(result) } });
}

// A model can only add a bounded explanation to a safe deterministic recommendation.
// It can never convert a veto, a request for data, or a human-review requirement into allow.
export function applyAdvisoryDecision(deterministic, advisory = {}) {
  if (!deterministic || !trustedDecisions.has(deterministic) || deterministic.schema_version !== RESULT.schema_version || !ACTIONS.has(deterministic.action)) throw new TypeError('Invalid deterministic decision');
  if (deterministic.hard_vetoes.length || deterministic.action !== 'recommend') return { ...copy(deterministic), advisory: { accepted: false, reason: 'DETERMINISTIC_GATE' } };
  const explanation = typeof advisory.explanation === 'string' && advisory.explanation.trim().length <= 240 ? advisory.explanation.trim() : '';
  return { ...copy(deterministic), advisory: { accepted: Boolean(explanation), explanation } };
}
