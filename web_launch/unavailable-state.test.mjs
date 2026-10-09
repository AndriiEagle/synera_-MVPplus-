// Invariant: a meeting or invitation that stopped being available is NOT a lost session. The client names
// it with a code so the page can keep the person signed in and keep their unsent text, while a real
// session loss (401) and a missing consent (403 without a code) keep their existing sign-in handling.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial } from './real-journey-client.mjs';
import { A, B, config, fields, createFixture } from '../tools/fixtures/real-journey-fixture.mjs';

async function invited() {
  const db = createFixture();
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const reviewed = await a.saveTerms(B, exchangeMaterial(A, B, fields()));
  await a.approveTerms(B, reviewed); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, 'Обговорити перевірений екран', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' })).meetings[0];
  return { db, a, b, meeting };
}

test('a conversation whose meeting was cancelled is reported as unavailable, not as a lost session', async () => {
  const { db, a, b, meeting } = await invited();
  await b.respondInvitation(meeting.id, 'accepted');
  await a.sendConversation(meeting.id, 'Перше повідомлення');
  db.meetings[0].status = 'cancelled'; // the sender cancelled the accepted meeting
  for (const attempt of [() => b.conversation(meeting.id), () => b.sendConversation(meeting.id, 'Незавершена думка'), () => a.conversation(meeting.id)]) {
    await assert.rejects(attempt(), error => error.status === 403 && error.code === 'CONVERSATION_UNAVAILABLE');
  }
  assert.equal(db.messages.length, 1, 'nothing is written into a closed conversation');
  assert.equal((await b.dashboard()).own.id, B, 'the session itself is intact');
});

test('an invitation that was cancelled or already answered is reported as unavailable, not as a lost session', async () => {
  const { db, a, b, meeting } = await invited();
  db.meetings[0].status = 'cancelled';
  await assert.rejects(b.respondInvitation(meeting.id, 'accepted'), error => error.status === 403 && error.code === 'INVITATION_UNAVAILABLE');
  await assert.rejects(b.respondInvitation(meeting.id, 'declined'), error => error.code === 'INVITATION_UNAVAILABLE');
  // The sender answering for the recipient stays a plain refusal with the same status as before.
  db.meetings[0].status = 'pending';
  await assert.rejects(a.respondInvitation(meeting.id, 'accepted'), error => error.status === 403);
  assert.equal(db.meetings[0].status, 'pending');
});

test('a revoked session and a missing consent keep their own signals', async () => {
  const { db, b, meeting } = await invited();
  await b.respondInvitation(meeting.id, 'accepted');
  db.noConsent.add(B);
  await assert.rejects(b.conversation(meeting.id), error => error.status === 403 && error.code === undefined);
  db.noConsent.delete(B); db.revoked.add(B);
  await assert.rejects(b.conversation(meeting.id), error => error.status === 401);
});
