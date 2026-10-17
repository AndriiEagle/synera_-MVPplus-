import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaseState } from './business-case.mjs';
import { buildMeetingCard, revokeMeetingCardConsent } from './meeting-card.mjs';

const ALICE = 'u-alice';
const BOB = 'u-bob';

const material = () => ({
  mode: 'exchange',
  components: ['exchange'],
  outcomes: [
    { receiver_id: ALICE, capability_tag: 'video', target: 'Promo video clip' },
    { receiver_id: BOB, capability_tag: 'sales', target: 'Cold outreach strategy' },
  ],
  trial: {
    starts_on: '2026-09-10',
    due_on: '2026-09-15',
    deliverables: [
      {
        giver_id: BOB,
        receiver_id: ALICE,
        capability_tag: 'video',
        target: '30s edited video',
        acceptance_criteria: 'Alice accepts final cut',
      },
      {
        giver_id: ALICE,
        receiver_id: BOB,
        capability_tag: 'sales',
        target: '10 prospect review',
        acceptance_criteria: 'Bob accepts outreach review',
      },
    ],
  },
  compensation: { status: 'agreed_exchange', amount_minor: null, currency: '', invoice_required: null },
  terms: {
    revision_limit: 1,
    confidentiality: 'required',
    intellectual_property: 'shared',
    cancellation: 'mutual_written_notice',
  },
});

const freshCase = async () =>
  createCaseState({
    caseId: 'case-card-test',
    participants: [ALICE, BOB],
    material: material(),
    now: '2026-09-10T10:00:00.000Z',
    expiresAt: '2026-09-20T10:00:00.000Z',
  });

const profiles = {
  [ALICE]: { name: 'Alice (Sales Pro)', email: 'alice@secret.ch', phone: '+41 79 123 4567' },
  [BOB]: { name: 'Bob (Video Creator)', email: 'bob@secret.ch', phone: '+41 79 987 6543' },
};

test('C10.L2: meeting card cannot be shared without bilateral consent from both parties', async () => {
  const caseState = await freshCase();

  // No consent at all
  const cardNoConsent = buildMeetingCard({ caseState, profiles, consents: {} });
  assert.equal(cardNoConsent.shareable, false);
  assert.equal(cardNoConsent.revoked, true);
  assert.equal(cardNoConsent.reason, 'MUTUAL_CONSENT_REQUIRED');

  // Only Alice consents
  const cardAliceOnly = buildMeetingCard({
    caseState,
    profiles,
    consents: { [ALICE]: { meetingCardShare: true } },
  });
  assert.equal(cardAliceOnly.shareable, false);
  assert.equal(cardAliceOnly.revoked, true);
  assert.deepEqual(cardAliceOnly.missingParties, [BOB]);

  // Both Alice and Bob consent -> shareable
  const cardBoth = buildMeetingCard({
    caseState,
    profiles,
    consents: {
      [ALICE]: { meetingCardShare: true },
      [BOB]: { meetingCardShare: true },
    },
  });
  assert.equal(cardBoth.shareable, true);
  assert.equal(cardBoth.revoked, undefined);
  assert.equal(cardBoth.schema, 'synera.meeting-card.v1');
  assert.ok(cardBoth.pairing.includes('Alice'));
  assert.ok(cardBoth.pairing.includes('Bob'));
});

test('C10.L2: either party can revoke consent and immediately block public card', async () => {
  const caseState = await freshCase();
  let consents = {
    [ALICE]: { meetingCardShare: true },
    [BOB]: { meetingCardShare: true },
  };

  const cardBefore = buildMeetingCard({ caseState, profiles, consents });
  assert.equal(cardBefore.shareable, true);

  // Bob revokes consent
  consents = revokeMeetingCardConsent(consents, BOB);
  assert.equal(consents[BOB].meetingCardShare, false);

  const cardAfter = buildMeetingCard({ caseState, profiles, consents });
  assert.equal(cardAfter.shareable, false);
  assert.equal(cardAfter.revoked, true);
  assert.deepEqual(cardAfter.missingParties, [BOB]);
});

test('C10.L2: meeting card strictly excludes terms, compensation, prices, and contacts', async () => {
  const caseState = await freshCase();
  const consents = {
    [ALICE]: { meetingCardShare: true },
    [BOB]: { meetingCardShare: true },
  };

  const card = buildMeetingCard({ caseState, profiles, consents });
  const raw = JSON.stringify(card);

  // Assert no contacts leaked
  assert.equal(raw.includes('alice@secret.ch'), false);
  assert.equal(raw.includes('bob@secret.ch'), false);
  assert.equal(raw.includes('+41 79'), false);

  // Assert no terms or prices leaked
  assert.equal(raw.includes('compensation'), false);
  assert.equal(raw.includes('confidentiality'), false);
  assert.equal(raw.includes('revision_limit'), false);
  assert.equal(raw.includes('cancellation'), false);

  // Assert give ⇄ take structure exists
  const pA = card.participants.find(p => p.partyId === ALICE);
  const pB = card.participants.find(p => p.partyId === BOB);
  assert.ok(pA && pB);
  assert.equal(pA.give[0].capability, 'sales');
  assert.equal(pA.take[0].capability, 'video');
  assert.equal(pB.give[0].capability, 'video');
  assert.equal(pB.take[0].capability, 'sales');
});

test('C10.L2: closed or revoked case blocks meeting card even with mutual consent', async () => {
  const caseState = await freshCase();
  caseState.status = 'revoked';

  const consents = {
    [ALICE]: { meetingCardShare: true },
    [BOB]: { meetingCardShare: true },
  };

  const card = buildMeetingCard({ caseState, profiles, consents });
  assert.equal(card.shareable, false);
  assert.equal(card.revoked, true);
  assert.equal(card.reason, 'CASE_CLOSED');
});

import { renderMeetingCardHTML } from './meeting-card.mjs';

test('C06.L6: renderMeetingCardHTML generates correct HTML and handles revoked cards', () => {
  const revokedCard = { schema: 'synera.meeting-card.v1', shareable: false };
  assert.match(renderMeetingCardHTML(revokedCard), /Card unavailable or revoked/);
  
  const validCard = {
    schema: 'synera.meeting-card.v1',
    shareable: true,
    caseId: 'test-case-id',
    headline: 'Ми зустрілися',
    pairing: 'Alice ⇄ Bob',
    participants: [
      { displayName: 'Alice', give: [{capability: 'Code', target: 'Backend'}], take: [] },
      { displayName: 'Bob', give: [], take: [{capability: 'Code', target: 'Backend'}] }
    ],
    sharedAt: '2026-09-20T00:00:00.000Z'
  };
  const html = renderMeetingCardHTML(validCard);
  assert.match(html, /Ми зустрілися/);
  assert.match(html, /Alice ⇄ Bob/);
  assert.match(html, /Backend/);
});
