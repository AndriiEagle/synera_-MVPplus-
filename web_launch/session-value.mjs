// Local, pure session value contract. Labels are not authenticated identities;
// nothing here writes to storage, uses the network, or publishes a draft.
export const SESSION_VALUE_FORMAT = 'synera.session-value.v1';
export const SESSION_VALUE_ARCHIVE_FORMAT = 'synera.session-value.archive.v1';
export const SESSION_VALUE_LIMITS = Object.freeze({
  maxArchiveBytes: 256 * 1024,
  maxNotes: 120,
  maxNoteTextLength: 6000,
  maxFacts: 40,
  maxFactTextLength: 2000,
  maxConsentScopes: 30,
});

const acceptedArchives = new WeakSet();
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const hasOnly = (value, keys) => plainObject(value) && Object.keys(value).every(key => keys.includes(key));
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const validId = value => typeof value === 'string' && idPattern.test(value);
const validInstant = value => Number.isSafeInteger(value) && value >= 0 && value <= 8640000000000000;
const exactText = (value, max, label) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) throw new Error(`Некоректний ${label}.`);
  return value;
};
const requireId = (value, label) => {
  if (!validId(value)) throw new Error(`Некоректний ${label}.`);
  return value;
};
const requireInstant = value => {
  if (!validInstant(value)) throw new Error('Некоректний час.');
  return value;
};
const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

function validateNotes(notes) {
  if (!Array.isArray(notes) || notes.length > SESSION_VALUE_LIMITS.maxNotes) throw new Error('Некоректні нотатки сесії.');
  const sources = new Set();
  return notes.map((note, index) => {
    if (!hasOnly(note, ['sourceId', 'text', 'at'])) throw new Error(`Некоректна нотатка ${index + 1}.`);
    const sourceId = requireId(note.sourceId, 'ідентифікатор джерела');
    if (sources.has(sourceId)) throw new Error('Ідентифікатори джерел мають бути унікальними.');
    sources.add(sourceId);
    return { sourceId, text: exactText(note.text, SESSION_VALUE_LIMITS.maxNoteTextLength, 'текст нотатки'), at: requireInstant(note.at) };
  });
}

function validateOutcome(outcome) {
  if (!hasOnly(outcome, ['revision', 'facts']) || !Number.isSafeInteger(outcome.revision) || outcome.revision < 1 || outcome.revision > 1000000 || !Array.isArray(outcome.facts) || outcome.facts.length === 0 || outcome.facts.length > SESSION_VALUE_LIMITS.maxFacts) throw new Error('Некоректний результат сесії.');
  const sources = new Set();
  return {
    revision: outcome.revision,
    facts: outcome.facts.map((fact, index) => {
      if (!hasOnly(fact, ['sourceId', 'text'])) throw new Error(`Некоректний факт результату ${index + 1}.`);
      const sourceId = requireId(fact.sourceId, 'ідентифікатор джерела');
      if (sources.has(sourceId)) throw new Error('Ідентифікатори фактів мають бути унікальними.');
      sources.add(sourceId);
      return { sourceId, text: exactText(fact.text, SESSION_VALUE_LIMITS.maxFactTextLength, 'текст факту') };
    }),
  };
}

function validateConsentScopes(consentScopes, participantIds) {
  if (!Array.isArray(consentScopes) || consentScopes.length > SESSION_VALUE_LIMITS.maxConsentScopes) throw new Error('Некоректні області згоди.');
  const seen = new Set();
  return consentScopes.map((entry, index) => {
    if (!hasOnly(entry, ['scope', 'participantId', 'at'])) throw new Error(`Некоректна згода ${index + 1}.`);
    const scope = exactText(entry.scope, 120, 'область згоди');
    const participantId = requireId(entry.participantId, 'учасника');
    if (!participantIds.includes(participantId)) throw new Error('Згода належить невідомому учаснику.');
    const key = `${participantId}\u0000${scope}`;
    if (seen.has(key)) throw new Error('Області згоди не можуть дублюватися.');
    seen.add(key);
    return { scope, participantId, at: requireInstant(entry.at) };
  });
}

function validateConfirmations(confirmations, participantIds, currentRevision) {
  if (!plainObject(confirmations)) throw new Error('Некоректні підтвердження.');
  const result = {};
  for (const [participantId, confirmation] of Object.entries(confirmations)) {
    if (!participantIds.includes(participantId) || !hasOnly(confirmation, ['revision', 'at']) || confirmation.revision !== currentRevision) throw new Error('Підтвердження не відповідає поточній версії результату.');
    result[participantId] = { revision: currentRevision, at: requireInstant(confirmation.at) };
  }
  return result;
}

function validateSession(value) {
  if (!hasOnly(value, ['format', 'sessionId', 'participantIds', 'notes', 'outcome', 'outcomeHistory', 'confirmations', 'consentScopes', 'trust'])) throw new Error('Невідома або некоректна структура сесії.');
  if (value.format !== SESSION_VALUE_FORMAT) throw new Error('Непідтримуваний формат сесії.');
  const sessionId = requireId(value.sessionId, 'ідентифікатор сесії');
  if (!Array.isArray(value.participantIds) || value.participantIds.length < 2 || value.participantIds.length > 3) throw new Error('Потрібні два або три учасники.');
  const participantIds = value.participantIds.map(id => requireId(id, 'учасника'));
  if (new Set(participantIds).size !== participantIds.length) throw new Error('Учасники мають бути унікальними.');
  const notes = validateNotes(value.notes);
  const outcome = validateOutcome(value.outcome);
  if (!Array.isArray(value.outcomeHistory) || value.outcomeHistory.length === 0 || value.outcomeHistory.length > 100) throw new Error('Некоректна історія результату.');
  const outcomeHistory = value.outcomeHistory.map(validateOutcome);
  if (outcomeHistory.at(-1).revision !== outcome.revision || JSON.stringify(outcomeHistory.at(-1)) !== JSON.stringify(outcome)) throw new Error('Поточний результат має бути останньою точною версією історії.');
  for (let index = 1; index < outcomeHistory.length; index++) if (outcomeHistory[index].revision <= outcomeHistory[index - 1].revision) throw new Error('Версії результату мають зростати.');
  if (value.trust !== 'same_device_unverified') throw new Error('Невідомий рівень довіри сесії.');
  return {
    format: SESSION_VALUE_FORMAT, sessionId, participantIds, notes, outcome, outcomeHistory,
    confirmations: validateConfirmations(value.confirmations, participantIds, outcome.revision),
    consentScopes: validateConsentScopes(value.consentScopes, participantIds),
    trust: 'same_device_unverified',
  };
}

export function createSession({ sessionId, participantIds, notes = [], outcome, consentScopes = [] } = {}) {
  const normalizedParticipants = Array.isArray(participantIds) ? participantIds : [];
  const currentOutcome = validateOutcome(outcome);
  return validateSession({
    format: SESSION_VALUE_FORMAT, sessionId, participantIds: normalizedParticipants, notes,
    outcome: currentOutcome, outcomeHistory: [currentOutcome], confirmations: {}, consentScopes,
    trust: 'same_device_unverified',
  });
}

export function confirmOutcome(session, { participantId, revision, at } = {}) {
  const next = validateSession(session);
  requireId(participantId, 'учасника'); requireInstant(at);
  if (!next.participantIds.includes(participantId)) throw new Error('Невідомий учасник не може підтвердити результат.');
  if (revision !== next.outcome.revision) throw new Error('Підтверджувати можна лише поточну версію результату.');
  next.confirmations[participantId] = { revision, at };
  return next;
}

export function revokeOutcomeConfirmation(session, { participantId, at } = {}) {
  const next = validateSession(session);
  requireId(participantId, 'учасника'); requireInstant(at);
  if (!next.participantIds.includes(participantId)) throw new Error('Невідомий учасник не може відкликати підтвердження.');
  delete next.confirmations[participantId];
  return next;
}

export function replaceOutcome(session, { outcome, at } = {}) {
  const next = validateSession(session); requireInstant(at);
  const replacement = validateOutcome(outcome);
  if (replacement.revision <= next.outcome.revision) throw new Error('Матеріальна зміна потребує нової більшої версії результату.');
  next.outcome = replacement;
  next.outcomeHistory.push(replacement);
  next.confirmations = {}; // A changed outcome never inherits earlier confirmation.
  return validateSession(next);
}

export function sessionConfirmationStatus(session) {
  const value = validateSession(session);
  const confirmedParticipantIds = value.participantIds.filter(id => Object.hasOwn(value.confirmations, id));
  const missingParticipantIds = value.participantIds.filter(id => !Object.hasOwn(value.confirmations, id));
  return {
    status: missingParticipantIds.length ? 'awaiting_confirmations' : 'confirmed_same_device_unverified',
    currentRevision: value.outcome.revision, confirmedParticipantIds, missingParticipantIds,
    identityVerified: false, trust: 'same_device_unverified',
  };
}

export function createSocialDraft(session, { wording = 'general' } = {}) {
  const value = validateSession(session);
  if (!['linkedin', 'general'].includes(wording)) throw new Error('Невідомий стиль чернетки.');
  const status = sessionConfirmationStatus(value);
  if (status.status !== 'confirmed_same_device_unverified') throw new Error('Чернетка доступна лише після явного підтвердження кожним учасником.');
  const prefix = wording === 'linkedin' ? 'Приватна чернетка для LinkedIn (не опубліковано):' : 'Приватна загальна social-чернетка (не опубліковано):';
  return {
    kind: 'private_social_draft', wording, publishable: false, trust: 'same_device_unverified',
    text: `${prefix}\n${value.outcome.facts.map(fact => `• ${fact.text}`).join('\n')}`,
    sourceReferences: value.outcome.facts.map((fact, index) => ({ sourceId: fact.sourceId, locator: `outcome.facts[${index}]` })),
  };
}

export function archiveSession(session, { archiveId, createdAt } = {}) {
  const value = validateSession(session);
  const archive = {
    format: SESSION_VALUE_ARCHIVE_FORMAT, archiveVersion: 1,
    archiveId: requireId(archiveId, 'ідентифікатор архіву'), createdAt: requireInstant(createdAt),
    integrity: 'structural_only_no_cryptographic_integrity', session: value,
  };
  const json = JSON.stringify(archive);
  if (new TextEncoder().encode(json).byteLength > SESSION_VALUE_LIMITS.maxArchiveBytes) throw new Error('Архів завеликий.');
  return json;
}

export function importSessionArchive(json) {
  if (typeof json !== 'string' || new TextEncoder().encode(json).byteLength > SESSION_VALUE_LIMITS.maxArchiveBytes) throw new Error('Некоректний або завеликий архів.');
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new Error('Архів не є коректним JSON.'); }
  if (!hasOnly(parsed, ['format', 'archiveVersion', 'archiveId', 'createdAt', 'integrity', 'session']) || parsed.format !== SESSION_VALUE_ARCHIVE_FORMAT || parsed.archiveVersion !== 1 || parsed.integrity !== 'structural_only_no_cryptographic_integrity') throw new Error('Невідомий або некоректний формат архіву.');
  const archive = {
    format: SESSION_VALUE_ARCHIVE_FORMAT, archiveVersion: 1,
    archiveId: requireId(parsed.archiveId, 'ідентифікатор архіву'), createdAt: requireInstant(parsed.createdAt),
    integrity: 'structural_only_no_cryptographic_integrity', session: validateSession(parsed.session),
  };
  const accepted = deepFreeze(archive);
  acceptedArchives.add(accepted);
  return accepted;
}

export function searchArchiveExactQuote(archive, quote) {
  if (!plainObject(archive) || !acceptedArchives.has(archive)) throw new Error('Потрібен цей самий прийнятий через importSessionArchive архів.');
  const normalized = archive;
  exactText(quote, SESSION_VALUE_LIMITS.maxNoteTextLength, 'точна цитата');
  const matches = [];
  normalized.session.notes.forEach((note, index) => {
    if (note.text.includes(quote)) matches.push({ sourceId: note.sourceId, at: note.at, locator: `session.notes[${index}].text`, text: note.text });
  });
  normalized.session.outcomeHistory.forEach((outcome, outcomeIndex) => outcome.facts.forEach((fact, factIndex) => {
    if (fact.text.includes(quote)) matches.push({ sourceId: fact.sourceId, locator: `session.outcomeHistory[${outcomeIndex}].facts[${factIndex}].text`, text: fact.text });
  }));
  return matches;
}
