import { NeonStore } from './neon-store.mjs';
import { ServiceError } from './profile-store.mjs';
import { compareRealProfiles } from './profile-brief.mjs';
import { packArchive } from './archive-codec.mjs';
import { createSession, confirmOutcome, createSocialDraft } from './session-value.mjs';
import { canonicalMaterialPayload, hashMaterialPayload, caseMaterialProblems, caseParticipantProblems, materialTermsFromInput, approveCase, abandonCase } from './business-case.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const CASE_QUERY = '/rest/v1/match_cases';
const encode = encodeURIComponent;
const OUTCOME_KEYS = Object.freeze({ state: [], submit: ['index', 'intentId', 'evidenceUri'], check: ['index', 'intentId', 'scopeNotes'], accept: ['index', 'intentId'], decline: ['index', 'intentId', 'reason'] });
const OUTCOME_REASONS = ['not_delivered', 'outside_agreed_scope', 'below_acceptance_criteria', 'other'];
const INTENT = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const outcomeText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000;
function assertOutcomePayload(body) {
  const extra = body && Object.hasOwn(OUTCOME_KEYS, body.action) ? OUTCOME_KEYS[body.action] : null;
  const keys = ['action', 'version', 'termsHash', ...(extra || [])];
  if (!extra || Object.keys(body).length !== keys.length || keys.some(key => !Object.hasOwn(body, key)) ||
      !Number.isInteger(body.version) || body.version < 1 || body.version > 999999999 || !/^[a-f0-9]{64}$/.test(body.termsHash) ||
      (body.action !== 'state' && (!Number.isInteger(body.index) || body.index < 0 || body.index > 9999 || !INTENT.test(body.intentId))) ||
      (body.action === 'submit' && !outcomeText(body.evidenceUri)) || (body.action === 'check' && !outcomeText(body.scopeNotes)) ||
      (body.action === 'decline' && !OUTCOME_REASONS.includes(body.reason))) throw new ServiceError(400);
}
export function validateOutcome(data, current) {
  const invalid = () => { throw new ServiceError(502, 'invalid_outcome_response'); };
  const legs = current.material.trial.deliverables;
  if (!data || data.schema !== 'synera.case-outcome.v1' || data.proof_scope !== 'participant_attestation' ||
      data.case_id !== current.caseId || data.version !== current.version || data.terms_hash !== current.termsHash ||
      typeof data.server_now !== 'string' || !Number.isFinite(Date.parse(data.server_now)) || !Array.isArray(data.events) ||
      !Array.isArray(data.deliverables) || data.deliverables.length !== legs.length || !legs.length) invalid();
  // Check the server's projection against its actor-bound, current-revision history.
  // This is response validation, never an independent proof of delivery or quality.
  const projected = legs.map(() => ({ evidence_uri: null, scope_notes: null, reason: null, phase: 'pending' }));
  const intents = new Set(); let lastId = 0;
  for (const event of data.events) {
    if (!event || !Number.isSafeInteger(event.id) || event.id <= lastId || !Number.isInteger(event.index) || !legs[event.index] ||
        !['submit', 'check', 'accept', 'decline'].includes(event.kind) || typeof event.created_at !== 'string' ||
        !Number.isFinite(Date.parse(event.created_at))) invalid();
    lastId = event.id;
    try { assertOutcomePayload(event.payload); } catch { invalid(); }
    const body = event.payload, leg = legs[event.index], row = projected[event.index];
    const key = event.actor_id + ':' + body.intentId;
    if (body.action !== event.kind || body.index !== event.index || body.version !== current.version || body.termsHash !== current.termsHash ||
        event.actor_id !== (event.kind === 'submit' ? leg.giver_id : leg.receiver_id) || intents.has(key) || row.phase === 'accepted') invalid();
    intents.add(key);
    if (event.kind === 'submit') { if (row.evidence_uri !== null) invalid(); row.evidence_uri = body.evidenceUri; }
    if (event.kind === 'check') { if (row.evidence_uri === null || row.scope_notes !== null) invalid(); row.scope_notes = body.scopeNotes; }
    if (event.kind === 'accept') { if (row.scope_notes === null) invalid(); row.phase = 'accepted'; row.reason = null; }
    else if (event.kind === 'decline') { if (row.phase === 'declined_dispute_open') invalid(); row.phase = 'declined_dispute_open'; row.reason = body.reason; }
    else if (row.phase !== 'declined_dispute_open') row.phase = row.scope_notes !== null ? 'checked_with_scope' : 'evidence_supplied';
  }
  data.deliverables.forEach((row, index) => {
    const leg = legs[index];
    if (!row || row.index !== index || ['giver_id', 'receiver_id', 'target', 'acceptance_criteria'].some(key => row[key] !== leg[key]) ||
        Object.keys(projected[index]).some(key => row[key] !== projected[index][key])) invalid();
  });
  if (data.outcome_confirmed !== projected.every(row => row.phase === 'accepted')) invalid();
  return structuredClone(data);
}
export class JourneyConflict extends Error {
  constructor() { super('Умови змінилися. Онови їх, перечитай і підтвердь нову версію.'); this.status = 409; this.code = 'STALE_CASE_RELOAD_REQUIRED'; }
}
export function assertRealJourneyGate(config) {
  if (config?.backend !== 'neon' || config.pilotSafetyEnabled !== true || config.realPilotEnabled !== true || config.realJourneyEnabled !== true) {
    throw new ServiceError(503, 'real_journey_not_ready');
  }
}

// This adapter uses the existing account, profile, case and meeting tables. No
// browser token, fictional participant, second matching engine or private cache.
export class RealJourneyStore extends NeonStore {
  #outcomesEnabled;
  #outcomeEpoch = 0;
  constructor(config, fetchImpl = fetch) { assertRealJourneyGate(config); super(config, fetchImpl); this.#outcomesEnabled = config.caseOutcomesEnabled === true; }
  // Invalidate outcome work as soon as authentication changes, including logging
  // out and restoring the SAME account. Existing auth operations stay unchanged.
  restore() { this.#outcomeEpoch++; return super.restore(); }
  verifyOtp(email, otp) { this.#outcomeEpoch++; return super.verifyOtp(email, otp); }
  signOut() { this.#outcomeEpoch++; return super.signOut(); }
  async #outcome(peerId, reviewed, input) {
    if (!this.#outcomesEnabled) throw new ServiceError(503, 'case_outcomes_not_ready');
    const epoch = this.#outcomeEpoch, actor = this.user?.id, expected = structuredClone(reviewed);
    const guard = () => { if (!actor || this.user?.id !== actor || this.#outcomeEpoch !== epoch) throw new ServiceError(401, 'outcome_session_changed'); };
    guard();
    const payload = { ...structuredClone(input), version: expected?.version, termsHash: expected?.termsHash };
    assertOutcomePayload(payload);
    await this.#actor(peerId); guard();
    const current = await this.pairState(peerId); guard(); this.#expect(current, expected);
    if (payload.action !== 'state') {
      const leg = current.material.trial.deliverables[payload.index];
      if (!leg || actor !== (payload.action === 'submit' ? leg.giver_id : leg.receiver_id)) throw new ServiceError(403);
      if (current.status !== 'approved_for_next_step' || Date.parse(current.expiresAt) <= Date.now()) throw new JourneyConflict();
    }
    const data = await this._caseOutcome(current.caseId, payload); guard();
    const result = validateOutcome(data, current);
    if (payload.action !== 'state' && !result.events.some(event => event.actor_id === actor &&
        Object.keys(payload).every(key => event.payload[key] === payload[key]))) throw new ServiceError(502, 'outcome_not_acknowledged');
    // Do not show an old attestation after the other participant revised terms.
    const latest = await this.pairState(peerId); guard(); this.#expect(latest, expected);
    return result;
  }
  outcomeState(peerId, reviewed) { return this.#outcome(peerId, reviewed, { action: 'state' }); }
  recordOutcome(peerId, reviewed, intent) {
    if (intent?.action === 'state') return Promise.reject(new ServiceError(400));
    return this.#outcome(peerId, reviewed, intent);
  }
  async exportOutcome(peerId, reviewed, { compress = false } = {}) {
    if (!this.#outcomesEnabled) throw new ServiceError(503, 'case_outcomes_not_ready');
    const epoch = this.#outcomeEpoch, actor = this.user?.id, expected = structuredClone(reviewed);
    const guard = () => { if (!actor || this.user?.id !== actor || epoch !== this.#outcomeEpoch) throw new ServiceError(401, 'outcome_session_changed'); };
    guard();
    if (typeof compress !== 'boolean') throw new ServiceError(400);
    const current = await this.pairState(peerId); guard(); this.#expect(current, expected);
    const outcome = await this.outcomeState(peerId, current); guard();
    // A portable observation, never an import command or server authority.
    // Material comes from the server, not the caller's editable review object.
    const archive = { format: 'synera.case-outcome.archive.v1', archiveVersion: 1,
      authority: 'local_copy_not_live_server_state', proof_scope: outcome.proof_scope, exported_by: actor,
      case: { case_id: current.caseId, version: current.version, terms_hash: current.termsHash,
        participants: current.participants, material: current.material }, outcome };
    const packed = await packArchive(JSON.stringify(archive), compress); guard();
    const latest = await this.pairState(peerId); guard(); this.#expect(latest, expected);
    return { ...packed, fileName: `synera-outcome-${current.caseId.replace(/[^A-Za-z0-9_-]/g, '-')}-v${current.version}.json` };
  }
  async socialDraft(peerId, reviewed, { wording = 'general' } = {}) {
    if (!this.#outcomesEnabled) throw new ServiceError(503, 'case_outcomes_not_ready');
    const socialEpoch = this.#outcomeEpoch, actor = this.user?.id, expected = structuredClone(reviewed);
    const guard = () => { if (!actor || this.user?.id !== actor || socialEpoch !== this.#outcomeEpoch) throw new ServiceError(401, 'outcome_session_changed'); };
    guard(); if (!['general', 'linkedin'].includes(wording)) throw new ServiceError(400);
    const eligible = value => value?.status === 'approved_for_next_step' && Date.parse(value.expiresAt) > Date.now();
    const current = await this.pairState(peerId); guard(); this.#expect(current, expected);
    if (!eligible(current)) throw new JourneyConflict();
    const result = await this.outcomeState(peerId, current); guard();
    if (!result.outcome_confirmed) throw new Error('Чернетка досягнення доступна після приймання всіх результатів їхніми одержувачами.');
    const own = result.deliverables.filter(row => row.giver_id === actor);
    if (!own.length) throw new ServiceError(403);
    // Adapt existing attestation events to the conservative local draft contract.
    // These pure confirmations never submit votes or claim verified identities.
    let session = createSession({ sessionId: current.caseId, participantIds: current.participants,
      outcome: { revision: current.version, facts: own.map(row => ({ sourceId: `result-${row.index}`, text: row.target })) } });
    for (const id of current.participants) {
      const accepted = result.events.filter(event => event.kind === 'accept' && event.actor_id === id).at(-1);
      session = confirmOutcome(session, { participantId: id, revision: current.version, at: Date.parse(accepted?.created_at) });
    }
    const draft = createSocialDraft(session, { wording });
    draft.text += '\n\nЦе мої результати у Synera, прийняті їхніми одержувачами. Підтвердження учасників не є незалежною перевіркою якості.';
    const latest = await this.pairState(peerId); guard(); this.#expect(latest, expected);
    if (!eligible(latest)) throw new JourneyConflict();
    return { ...draft, proof_scope: result.proof_scope,
      case: { caseId: current.caseId, version: current.version, termsHash: current.termsHash },
      attestationReferences: own.map(row => ({ sourceId: `result-${row.index}`, eventId: result.events.find(event => event.kind === 'accept' && event.index === row.index).id })) };
  }
  async #actor(peerId) {
    this.requireRealPilot();
    const me = this.requireUser();
    if (!UUID.test(me) || (peerId !== undefined && (!UUID.test(peerId) || peerId === me))) throw new ServiceError(403);
    if (!await this.hasPolicy()) throw new ServiceError(403);
    return me;
  }
  async dashboard() {
    if (!await this.restore()) throw new ServiceError(401);
    const me = await this.#actor();
    const [own, people, meetings, rows] = await Promise.all([
      this.ownProfile(), this.discover(), this.meetings(),
      this._send(CASE_QUERY + '?status=eq.open&select=case_id,participant_low,participant_high&limit=100', { authenticated: true }),
    ]);
    if (rows.some(row => ![row.participant_low, row.participant_high].includes(me))) throw new ServiceError(403);
    const cases = (await Promise.all(rows.map(row => this.caseState(row.case_id)))).filter(Boolean);
    const asOf = new Date().toISOString().slice(0, 10);
    return { own, people: people.map(person => ({ ...person, comparison: compareRealProfiles(own, person, { asOf }) })), meetings, cases };
  }
  async pairState(peerId) {
    const me = await this.#actor(peerId), [low, high] = [me, peerId].sort();
    const rows = await this._send(CASE_QUERY + `?participant_low=eq.${encode(low)}&participant_high=eq.${encode(high)}&status=eq.open&select=case_id&limit=2`, { authenticated: true });
    if (rows.length > 1) throw new Error('Знайдено суперечливі відкриті домовленості. Потрібна перевірка сервера.');
    if (!rows[0]) return null;
    const state = await this.caseState(rows[0].case_id);
    if (!state || state.participants.length !== 2 || !state.participants.includes(me) || !state.participants.includes(peerId)) throw new ServiceError(403);
    if (await hashMaterialPayload(state.material) !== state.termsHash) throw new Error('Зміст умов не відповідає їхній контрольній сумі.');
    return state;
  }
  #expect(current, reviewed) {
    if (!current && !reviewed) return;
    if (!current || !reviewed || current.caseId !== reviewed.caseId || current.version !== reviewed.version || current.termsHash !== reviewed.termsHash) throw new JourneyConflict();
  }
  async saveTerms(peerId, input, reviewed = null) {
    const me = await this.#actor(peerId), material = canonicalMaterialPayload(input);
    const problems = [...caseMaterialProblems(material), ...caseParticipantProblems(material, [me, peerId])];
    if (problems.length) throw new Error('Заповни конкретні результати й усі умови обміну.');
    const termsHash = await hashMaterialPayload(material), current = await this.pairState(peerId);
    this.#expect(current, reviewed);
    if (current) {
      if (current.termsHash === termsHash) return current;
      // Compare-and-swap: the WHERE predicate is evaluated by the database at
      // write time. A concurrent revision returns zero rows, never a lost update.
      const rows = await this._send(CASE_QUERY + `?case_id=eq.${encode(current.caseId)}&version=eq.${current.version}&terms_hash=eq.${current.termsHash}&status=eq.open`, {
        method: 'PATCH', authenticated: true, prefer: 'return=representation',
        body: { mode: material.mode, material, terms_hash: termsHash, expires_at: current.expiresAt },
      });
      if (rows?.length !== 1) throw new JourneyConflict();
    } else {
      const [participant_low, participant_high] = [me, peerId].sort();
      await this._send(CASE_QUERY, { method: 'POST', authenticated: true, prefer: 'return=representation', body: {
        case_id: 'pair-' + globalThis.crypto.randomUUID(), participant_low, participant_high,
        mode: material.mode, material, terms_hash: termsHash,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      } });
    }
    const saved = await this.pairState(peerId);
    // A subsequent revision must be reviewed separately, even if our write succeeded.
    if (!saved || saved.termsHash !== termsHash) throw new JourneyConflict();
    return saved;
  }
  async approveTerms(peerId, reviewed) {
    const me = await this.#actor(peerId), current = await this.pairState(peerId);
    this.#expect(current, reviewed);
    approveCase(current, { partyId: me, termsHash: current.termsHash, now: new Date().toISOString() });
    if (!current.approvals[me]) {
      // Pure approval NEVER patches material. SQL checks actor and the current
      // version/hash; a revision between this read and POST is denied there.
      await this._send('/rest/v1/match_case_approvals', { method: 'POST', authenticated: true, prefer: 'return=representation', body: {
        case_id: current.caseId, party_id: me, approved_version: current.version, approved_terms_hash: current.termsHash,
      } });
    }
    const saved = await this.pairState(peerId);
    this.#expect(saved, reviewed);
    if (!saved.approvals[me]) throw new JourneyConflict();
    return saved;
  }
  async withdrawTerms(peerId, reviewed) {
    const me = await this.#actor(peerId), current = await this.pairState(peerId);
    this.#expect(current, reviewed);
    if (current.approvals[me]) {
      await this._send(`/rest/v1/match_case_approvals?case_id=eq.${encode(current.caseId)}&party_id=eq.${encode(me)}&approved_version=eq.${current.version}&approved_terms_hash=eq.${current.termsHash}&withdrawn_at=is.null`, {
        method: 'PATCH', authenticated: true, prefer: 'return=representation', body: { withdrawn_at: new Date().toISOString() },
      });
    }
    const saved = await this.pairState(peerId);
    if (saved?.approvals[me]) throw new JourneyConflict();
    return saved;
  }
  async closeTerms(peerId, reviewed) {
    const me = await this.#actor(peerId), current = await this.pairState(peerId);
    this.#expect(current, reviewed);
    await this.saveCaseState(abandonCase(current, { partyId: me, now: new Date().toISOString() }));
    const closed = await this.caseState(current.caseId);
    this.#expect(closed, reviewed);
    if (closed.status !== 'abandoned' || !closed.closedAt) throw new JourneyConflict();
    return this.dashboard();
  }
  async sendInvitation(peerId, note, plan) {
    await this.#actor(peerId);
    const state = await this.pairState(peerId);
    if (!state || state.status !== 'approved_for_next_step' || Date.parse(state.expiresAt) <= Date.now()) throw new Error('Спочатку обидва учасники мають підтвердити поточні умови.');
    await this.invite(peerId, note, plan);
    return this.dashboard();
  }
  async respondInvitation(id, status) {
    const me = await this.#actor();
    const meeting = (await this.meetings()).find(row => row.id === id && row.recipient_id === me && row.status === 'pending');
    if (!meeting) throw new ServiceError(403);
    await this.respond(id, status);
    return this.dashboard();
  }
  async #meeting(id) {
    const me = await this.#actor();
    if (!UUID.test(id)) throw new ServiceError(403);
    const meeting = (await this.meetings()).find(row => row.id === id && row.status === 'accepted' && [row.sender_id, row.recipient_id].includes(me));
    if (!meeting) throw new ServiceError(403);
    return meeting;
  }
  async conversation(id) {
    const meeting = await this.#meeting(id), messages = await this.messages(id);
    if (messages.some(row => ![meeting.sender_id, meeting.recipient_id].includes(row.sender_id))) throw new ServiceError(403);
    return { meeting, messages: [...messages].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)) };
  }
  async sendConversation(id, text) {
    await this.#meeting(id);
    await this.sendMessage(id, text);
    return this.conversation(id);
  }
}

export const REAL_MATERIAL_MODES = Object.freeze(['exchange', 'joint_project', 'paid_service', 'referral', 'hybrid']);

export function materialFromEditor(me, peer, fields = {}) {
  if (!UUID.test(me) || !UUID.test(peer) || me === peer) throw new ServiceError(403);
  const mode = typeof fields.mode === 'string' ? fields.mode : '';
  if (!REAL_MATERIAL_MODES.includes(mode)) throw new Error('Обери підтриманий режим умов.');
  const components = mode === 'hybrid' ? [...new Set(Array.isArray(fields.components) ? fields.components : [])].sort() : [mode];
  if (mode === 'hybrid' && components.length < 2) throw new Error('Поєднання потребує щонайменше двох явних компонентів.');
  if (mode === 'paid_service' && fields.compensation_status !== 'agreed_money') throw new Error('Оплачувана послуга вимагає явної грошової винагороди, валюти й рахунку.');
  const leg = (prefix, giver, receiver) => {
    const value = { giver_id: giver, receiver_id: receiver, capability_tag: fields[prefix + '_tag'], target: fields[prefix + '_target'], acceptance_criteria: fields[prefix + '_criteria'] };
    const amount = fields[prefix + '_amount'], unit = fields[prefix + '_unit'];
    if (amount || unit) value.effort = { amount: /^\d{1,5}$/.test(String(amount)) ? Number(amount) : NaN, unit };
    return value;
  };
  const deliverables = [leg('give', me, peer), leg('take', peer, me)];
  const material = canonicalMaterialPayload({ mode, components,
    outcomes: deliverables.map(leg => ({ receiver_id: leg.receiver_id, capability_tag: leg.capability_tag, target: leg.target })),
    trial: { starts_on: fields.starts_on, due_on: fields.due_on, deliverables }, ...materialTermsFromInput(fields),
  });
  if (caseMaterialProblems(material).length) throw new Error('Потрібно явно обрати всі матеріальні умови.');
  return material;
}

// Compatibility entrypoint for callers that intentionally offer only exchange.
export function exchangeMaterial(me, peer, fields) {
  if (fields.compensation_status !== 'agreed_exchange') throw new Error('Обери взаємний обмін без грошової оплати.');
  return materialFromEditor(me, peer, { ...fields, mode: 'exchange', components: ['exchange'] });
}
