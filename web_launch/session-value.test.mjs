import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_VALUE_ARCHIVE_FORMAT,
  archiveSession,
  confirmOutcome,
  createSession,
  createSocialDraft,
  importSessionArchive,
  replaceOutcome,
  revokeOutcomeConfirmation,
  searchArchiveExactQuote,
  sessionConfirmationStatus,
} from './session-value.mjs';

const base = () => createSession({
  sessionId: 'session-1', participantIds: ['ada', 'bruno'],
  notes: [{ sourceId: 'note-1', text: 'Keep <img src=x onerror=alert(1)> exactly.', at: 1000 }],
  outcome: { revision: 1, facts: [{ sourceId: 'outcome-1', text: 'Two people reviewed the supplied draft.' }] },
  consentScopes: [{ scope: 'portable_archive', participantId: 'ada', at: 900 }],
});
const confirmAll = session => confirmOutcome(confirmOutcome(session, { participantId: 'ada', revision: 1, at: 1100 }), { participantId: 'bruno', revision: 1, at: 1200 });

test('session value preserves exact notes and exposes only same-device unverified labels', () => {
  const session = base();
  assert.equal(session.notes[0].text, 'Keep <img src=x onerror=alert(1)> exactly.');
  assert.equal(session.trust, 'same_device_unverified');
  assert.equal(sessionConfirmationStatus(session).status, 'awaiting_confirmations'); // silence is never a confirmation
  assert.equal(sessionConfirmationStatus(session).identityVerified, false);
});

test('social draft requires unanimous current-revision confirmation and never publishes', () => {
  assert.throws(() => createSocialDraft(base(), { wording: 'linkedin' }), /явного підтвердження/);
  const draft = createSocialDraft(confirmAll(base()), { wording: 'linkedin' });
  assert.equal(draft.kind, 'private_social_draft');
  assert.equal(draft.publishable, false);
  assert.equal(draft.trust, 'same_device_unverified');
  assert.match(draft.text, /Two people reviewed the supplied draft\./);
  assert.deepEqual(draft.sourceReferences, [{ sourceId: 'outcome-1', locator: 'outcome.facts[0]' }]);
});

test('a material replacement clears confirmations; a stale participant cannot restore them', () => {
  const confirmed = confirmAll(base());
  const revised = replaceOutcome(confirmed, { at: 1300, outcome: { revision: 2, facts: [{ sourceId: 'outcome-2', text: 'The reviewed scope changed.' }] } });
  assert.deepEqual(sessionConfirmationStatus(revised).confirmedParticipantIds, []);
  assert.throws(() => confirmOutcome(revised, { participantId: 'ada', revision: 1, at: 1400 }), /поточну версію/);
  assert.throws(() => createSocialDraft(revised), /явного підтвердження/);
  const current = confirmOutcome(confirmOutcome(revised, { participantId: 'ada', revision: 2, at: 1400 }), { participantId: 'bruno', revision: 2, at: 1500 });
  assert.equal(createSocialDraft(current).text.includes('The reviewed scope changed.'), true);
});

test('one participant may revoke only their own confirmation; unilateral approval remains blocked', () => {
  const once = confirmOutcome(base(), { participantId: 'ada', revision: 1, at: 1100 });
  const revoked = revokeOutcomeConfirmation(once, { participantId: 'ada', at: 1150 });
  assert.deepEqual(sessionConfirmationStatus(revoked).confirmedParticipantIds, []);
  assert.throws(() => confirmOutcome(base(), { participantId: 'outsider', revision: 1, at: 1100 }), /Невідомий учасник/);
  assert.throws(() => createSocialDraft(once), /явного підтвердження/);
});

test('archive roundtrip retains original text, history and consent scopes exactly', () => {
  const revised = replaceOutcome(confirmAll(base()), { at: 1300, outcome: { revision: 2, facts: [{ sourceId: 'outcome-2', text: 'Quote target: exact phrase.' }] } });
  const json = archiveSession(revised, { archiveId: 'archive-1', createdAt: 1600 });
  const archive = importSessionArchive(json);
  assert.equal(archive.format, SESSION_VALUE_ARCHIVE_FORMAT);
  assert.equal(archive.session.notes[0].text, 'Keep <img src=x onerror=alert(1)> exactly.');
  assert.equal(archive.session.outcomeHistory.length, 2);
  assert.deepEqual(archive.session.consentScopes, [{ scope: 'portable_archive', participantId: 'ada', at: 900 }]);
  assert.throws(() => { archive.session.outcomeHistory[1].facts[0].text = 'substituted quote'; }, TypeError);
  assert.deepEqual(searchArchiveExactQuote(archive, 'exact phrase'), [{ sourceId: 'outcome-2', locator: 'session.outcomeHistory[1].facts[0].text', text: 'Quote target: exact phrase.' }]);
});

test('archive rejects unknown fields, malformed confirmations, and structurally invalid tampering', () => {
  const archive = JSON.parse(archiveSession(base(), { archiveId: 'archive-1', createdAt: 1600 }));
  assert.throws(() => importSessionArchive(JSON.stringify({ ...archive, surprise: true })), /Невідомий/);
  archive.session.confirmations = { ada: { revision: 9, at: 1000 } };
  assert.throws(() => importSessionArchive(JSON.stringify(archive)), /Підтвердження/);
  assert.throws(() => importSessionArchive('{not json'), /JSON/);
  assert.throws(() => searchArchiveExactQuote(JSON.parse(archiveSession(base(), { archiveId: 'archive-2', createdAt: 1700 })), 'Keep'), /прийнятий/);
});
