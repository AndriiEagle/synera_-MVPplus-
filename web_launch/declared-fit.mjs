// Optional local explanation for fictional, opted-in demo profiles.
// It is deliberately separate from matching.mjs: it neither selects candidates nor
// changes the existing business-match gates, scores, or decisions.

export const FIT_CAPABILITIES = Object.freeze(['automation', 'design', 'research', 'sales', 'video', 'finance', 'events']);
export const FIT_LANGUAGES = Object.freeze(['de', 'en', 'uk', 'fr']);
export const FIT_MODES = Object.freeze(['exchange', 'hybrid', 'joint_project', 'paid_service', 'referral']);
export const FIT_TIME_PREFERENCES = Object.freeze(['weekday_morning', 'weekday_afternoon', 'weekday_evening', 'weekend']);
export const FIT_COMMUNICATION_PREFERENCES = Object.freeze(['async', 'video', 'phone', 'in_person']);
export const FIT_WORK_PREFERENCES = Object.freeze(['structured', 'flexible', 'independent', 'collaborative']);

const cleanList = (input, allowed) => Array.isArray(input)
  ? [...new Set(input.filter(value => allowed.includes(value)))].sort()
  : [];

function optionalPreference(input, allowed) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.enabled !== true) return { enabled: false, values: [] };
  return { enabled: true, values: cleanList(input.values, allowed) };
}

// This projection intentionally excludes names, contacts, free text, location,
// health, psychology, personality, behaviour and any undeclared property.
export function normalizeDeclaredFitProfile(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  return {
    id: typeof input.id === 'string' && /^[a-z0-9-]{1,40}$/.test(input.id) ? input.id : '',
    publicVisibility: input.publicVisibility === true,
    fitConsent: input.fitConsent === true,
    gives: cleanList(input.gives, FIT_CAPABILITIES),
    needs: cleanList(input.needs, FIT_CAPABILITIES),
    languages: cleanList(input.languages, FIT_LANGUAGES),
    modes: cleanList(input.modes, FIT_MODES),
    timePreferences: cleanList(input.timePreferences, FIT_TIME_PREFERENCES),
    preferences: {
      communication: optionalPreference(input.preferences?.communication, FIT_COMMUNICATION_PREFERENCES),
      work: optionalPreference(input.preferences?.work, FIT_WORK_PREFERENCES),
    },
  };
}

const overlap = (left, right) => left.filter(value => right.includes(value));

function preferenceDimension(left, right, { requireBothEnabled = false } = {}) {
  if ((requireBothEnabled && (!left.enabled || !right.enabled)) || !left.values.length || !right.values.length) {
    return { status: 'unknown', shared: [] };
  }
  const shared = overlap(left.values, right.values);
  return { status: shared.length ? 'matched' : 'mismatch', shared };
}

function directionalComplementarity(receiver, giver) {
  if (!receiver.needs.length || !giver.gives.length) return { status: 'unknown', tags: [] };
  const tags = overlap(receiver.needs, giver.gives);
  return { status: tags.length ? 'matched' : 'mismatch', tags };
}

const combinedStatus = dimensions => dimensions.some(value => value.status === 'mismatch') ? 'mismatch'
  : dimensions.some(value => value.status === 'unknown') ? 'unknown' : 'matched';

function emptyResult(status, reason) {
  return {
    schemaVersion: 'synera.declared-fit.v1', status, reasons: [reason],
    explanation: null, ranking: null, providerCalls: 0,
  };
}

// This function compares exactly two profiles already chosen by the caller. It does
// not discover, rank, persist, send, or introduce anyone.
export function explainDeclaredFit(left, right) {
  const a = normalizeDeclaredFitProfile(left), b = normalizeDeclaredFitProfile(right);
  if (!a.id || !b.id || a.id === b.id) return emptyResult('invalid_pair', 'DISTINCT_DECLARED_IDS_REQUIRED');
  if (!a.fitConsent || !b.fitConsent) return emptyResult('ineligible', 'FIT_CONSENT_REQUIRED');
  if (!a.publicVisibility || !b.publicVisibility) return emptyResult('excluded', 'CANDIDATE_NOT_PUBLIC');

  const aFromB = directionalComplementarity(a, b);
  const bFromA = directionalComplementarity(b, a);
  const language = preferenceDimension({ enabled: true, values: a.languages }, { enabled: true, values: b.languages });
  const mode = preferenceDimension({ enabled: true, values: a.modes }, { enabled: true, values: b.modes });
  const time = preferenceDimension({ enabled: true, values: a.timePreferences }, { enabled: true, values: b.timePreferences });
  const communication = preferenceDimension(a.preferences.communication, b.preferences.communication, { requireBothEnabled: true });
  const work = preferenceDimension(a.preferences.work, b.preferences.work, { requireBothEnabled: true });

  const explanation = {
    complementarity: {
      status: combinedStatus([aFromB, bFromA]),
      toA: aFromB,
      toB: bFromA,
    },
    preferences: {
      language,
      mode,
      time,
      communication,
      work,
    },
  };
  return {
    schemaVersion: 'synera.declared-fit.v1', status: 'explained', reasons: [],
    explanation, ranking: null, providerCalls: 0,
  };
}
