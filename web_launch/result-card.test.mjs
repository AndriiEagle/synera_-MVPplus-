import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, confirmOutcome, createSocialDraft } from './session-value.mjs';
import { createResultCard } from './result-card.mjs';
import { SESSION_VALUE_LIMITS } from './session-value.mjs';

function acceptedDraft() {
  let session = createSession({ sessionId: 'private-case-id', participantIds: ['author', 'other-person'], outcome: { revision: 1, facts: [{ sourceId: 'own-result', text: 'Прототип Zürich 💛 向前' }] } });
  for (const participantId of ['author', 'other-person']) session = confirmOutcome(session, { participantId, revision: 1, at: 1792260000000 });
  return { ...createSocialDraft(session), proof_scope: 'participant_attestation', case: { caseId: 'private-case-id', termsHash: 'private-hash' }, attestationReferences: [{ eventId: 'private-event-id' }] };
}

test('private card uses accepted draft and preserves Unicode and human edits without exporting private metadata', () => {
  const draft = acceptedDraft(), before = structuredClone(draft), text = 'Мій виправлений текст 💛\n  Zürich 向前';
  const card = createResultCard(draft, { text });
  assert.ok(card.html.includes(text));
  for (const hidden of ['private-case-id', 'private-hash', 'private-event-id', 'other-person']) assert.equal(card.html.includes(hidden), false);
  assert.equal(card.scope, 'private_author_draft');
  assert.equal(card.fileName, 'synera-result-card-uk.html');
  assert.deepEqual(draft, before);
});

test('card escapes executable markup and adds no network requests or public verification claim', () => {
  const card = createResultCard(acceptedDraft(), { text: '<script>fetch("https://private.example")</script><img src=x onerror=alert(1)>&' });
  assert.equal(card.html.includes('<script>'), false);
  assert.equal(card.html.includes('<img'), false);
  assert.ok(card.html.includes('&lt;script&gt;'));
  assert.ok(card.html.includes("default-src 'none'"));
  assert.equal(/<[a-z][^>]*\b(?:src|href)=/i.test(card.html), false);
});

test('card rejects fabricated public/verified scope and empty content', () => {
  const draft = acceptedDraft();
  for (const change of [{ kind: 'certificate' }, { publishable: true }, { trust: 'verified_identity' }, { proof_scope: 'independently_verified' }]) assert.throws(() => createResultCard({ ...draft, ...change }));
  for (const text of ['', '   ', null, {}]) assert.throws(() => createResultCard(draft, { text }));
  assert.throws(() => createResultCard(draft, { language: 'constructor' }));
});

test('all display languages keep an explicit private author-draft boundary', () => {
  for (const language of ['uk', 'de', 'en']) {
    const card = createResultCard(acceptedDraft(), { language });
    assert.ok(card.html.includes(`<html lang="${language}">`));
    assert.ok(card.html.includes(acceptedDraft().text));
    assert.equal(card.scope, 'private_author_draft');
  }
});

test('UTF-8 limit rejects oversized edits with a text error, distinct from invalid draft scope', () => {
  const draft = acceptedDraft();
  const text = 'ж'.repeat(Math.floor(SESSION_VALUE_LIMITS.maxArchiveBytes / 2));
  assert.ok(createResultCard(draft, { text }).html.includes(text));
  assert.throws(() => createResultCard(draft, { text: text + 'ж' }), error => error.code === 'result_card_text_invalid');
  assert.throws(() => createResultCard({ ...draft, publishable: true }), error => error.code === 'result_card_draft_invalid');
});
