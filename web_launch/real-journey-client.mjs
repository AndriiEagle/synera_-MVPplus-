import { NeonStore } from './neon-store.mjs';
import { ServiceError } from './profile-store.mjs';
import { compareRealProfiles } from './profile-brief.mjs';
import { canonicalMaterialPayload, hashMaterialPayload, caseMaterialProblems, caseParticipantProblems, materialTermsFromInput, approveCase, abandonCase } from './business-case.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const CASE_QUERY = '/rest/v1/match_cases';
const encode = encodeURIComponent;
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
  constructor(config, fetchImpl = fetch) { assertRealJourneyGate(config); super(config, fetchImpl); }
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

export function exchangeMaterial(me, peer, fields) {
  if (!UUID.test(me) || !UUID.test(peer) || me === peer) throw new ServiceError(403);
  if (fields.compensation_status !== 'agreed_exchange') throw new Error('Обери взаємний обмін без грошової оплати.');
  const leg = (prefix, giver, receiver) => {
    const value = { giver_id: giver, receiver_id: receiver, capability_tag: fields[prefix + '_tag'], target: fields[prefix + '_target'], acceptance_criteria: fields[prefix + '_criteria'] };
    const amount = fields[prefix + '_amount'], unit = fields[prefix + '_unit'];
    if (amount || unit) value.effort = { amount: /^\d{1,5}$/.test(String(amount)) ? Number(amount) : NaN, unit };
    return value;
  };
  const deliverables = [leg('give', me, peer), leg('take', peer, me)];
  const material = canonicalMaterialPayload({ mode: 'exchange', components: ['exchange'],
    outcomes: deliverables.map(leg => ({ receiver_id: leg.receiver_id, capability_tag: leg.capability_tag, target: leg.target })),
    trial: { starts_on: fields.starts_on, due_on: fields.due_on, deliverables }, ...materialTermsFromInput(fields),
  });
  if (caseMaterialProblems(material).length) throw new Error('Потрібно явно обрати всі умови обміну.');
  return material;
}
