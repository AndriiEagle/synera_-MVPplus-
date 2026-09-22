// web_launch/meeting-card.mjs — Картка "Ми зустрілися" (C10.L2)
// Gate invariants: each side can revoke; no terms, prices, contacts.

const FORBIDDEN_KEYS = new Set([
  'email', 'phone', 'contact', 'contacts', 'compensation', 'amount_minor',
  'currency', 'invoice_required', 'terms', 'confidentiality', 'revision_limit',
  'cancellation', 'iban', 'address', 'password', 'api_key', 'token'
]);

function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  // Strip potential emails, phones, IBANs
  return trimmed
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted]')
    .replace(/\+?\d[\d -]{7,}\d/g, '[redacted]');
}

export function buildMeetingCard({ caseState, profiles = {}, consents = {}, now = new Date().toISOString() }) {
  if (!caseState || !Array.isArray(caseState.participants) || caseState.participants.length !== 2) {
    throw new Error('Invalid case state for meeting card');
  }

  const [partyA, partyB] = caseState.participants;

  // Gate 1: Bilateral explicit opt-in consent
  const consentA = Boolean(consents?.[partyA]?.meetingCardShare);
  const consentB = Boolean(consents?.[partyB]?.meetingCardShare);

  if (!consentA || !consentB) {
    return Object.freeze({
      schema: 'synera.meeting-card.v1',
      shareable: false,
      revoked: true,
      reason: 'MUTUAL_CONSENT_REQUIRED',
      missingParties: [!consentA ? partyA : null, !consentB ? partyB : null].filter(Boolean),
    });
  }

  // Gate 2: Case must not be closed or revoked
  if (['revoked', 'abandoned'].includes(caseState.status)) {
    return Object.freeze({
      schema: 'synera.meeting-card.v1',
      shareable: false,
      revoked: true,
      reason: 'CASE_CLOSED',
    });
  }

  // Gate 3: Construct sanitized give ⇄ take without terms/prices/contacts
  const deliverables = caseState.material?.trial?.deliverables || [];

  const extractPartyExchange = partyId => {
    const profile = profiles[partyId] || {};
    const displayName = sanitizeText(profile.name || profile.brief?.goal || partyId);

    const give = deliverables
      .filter(d => d.giver_id === partyId)
      .map(d => ({
        capability: d.capability_tag,
        target: sanitizeText(d.target),
      }));

    const take = deliverables
      .filter(d => d.receiver_id === partyId)
      .map(d => ({
        capability: d.capability_tag,
        target: sanitizeText(d.target),
      }));

    return {
      partyId,
      displayName,
      give,
      take,
    };
  };

  const participantDataA = extractPartyExchange(partyA);
  const participantDataB = extractPartyExchange(partyB);

  const card = {
    schema: 'synera.meeting-card.v1',
    shareable: true,
    caseId: caseState.caseId,
    headline: 'Ми зустрілися · We Connected',
    pairing: `${participantDataA.displayName} ⇄ ${participantDataB.displayName}`,
    participants: [participantDataA, participantDataB],
    sharedAt: now,
  };

  // Integrity assertion: ensure no forbidden keys leak into the card payload
  const serialized = JSON.stringify(card).toLowerCase();
  for (const forbidden of FORBIDDEN_KEYS) {
    if (serialized.includes(`"${forbidden}"`)) {
      throw new Error(`Privacy violation: forbidden key "${forbidden}" detected in meeting card`);
    }
  }

  return Object.freeze(card);
}

export function revokeMeetingCardConsent(consents, partyId) {
  if (!consents || typeof consents !== 'object') throw new Error('Invalid consents object');
  const next = structuredClone(consents);
  if (!next[partyId]) next[partyId] = {};
  next[partyId].meetingCardShare = false;
  return next;
}

export function renderMeetingCardHTML(card) {
  if (!card || card.schema !== 'synera.meeting-card.v1' || !card.shareable) {
    return '<div class="synera-card-revoked">Card unavailable or revoked</div>';
  }
  
  const escapeHtml = (unsafe) => unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const renderItems = (items) => items.map(item => `<li><strong>${escapeHtml(item.capability)}:</strong> ${escapeHtml(item.target)}</li>`).join('');

  return `
    <div class="synera-meeting-card" style="font-family: sans-serif; border: 1px solid #ccc; padding: 20px; border-radius: 8px; max-width: 600px; background: #fff;">
      <h2 style="margin-top: 0;">${escapeHtml(card.headline)}</h2>
      <h3 style="color: #666;">${escapeHtml(card.pairing)}</h3>
      <div style="display: flex; gap: 20px; margin-top: 20px;">
        <div style="flex: 1; border-right: 1px solid #eee; padding-right: 10px;">
          <h4>${escapeHtml(card.participants[0].displayName)} дає:</h4>
          <ul>${renderItems(card.participants[0].give)}</ul>
          <h4>Отримує:</h4>
          <ul>${renderItems(card.participants[0].take)}</ul>
        </div>
        <div style="flex: 1; padding-left: 10px;">
          <h4>${escapeHtml(card.participants[1].displayName)} дає:</h4>
          <ul>${renderItems(card.participants[1].give)}</ul>
          <h4>Отримує:</h4>
          <ul>${renderItems(card.participants[1].take)}</ul>
        </div>
      </div>
      <div style="margin-top: 20px; font-size: 0.8em; color: #999; text-align: center;">
        Synera B-Matching &bull; ${new Date(card.sharedAt).toLocaleDateString()}
      </div>
    </div>
  `;
}
