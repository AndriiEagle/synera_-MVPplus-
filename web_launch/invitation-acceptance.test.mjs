// Invariant: an invitation is accepted only by its recipient and only while BOTH participants hold a
// live approval of the CURRENT revision of an open, unexpired agreement — the same condition that
// allowed sending it. The database is the authority (neon/meeting-status-guard.migration.sql, proven on
// PostgreSQL by tools/meeting-status-guard-sql-acceptance.mjs). These tests cover the client and the
// transport oracle; they are not an RLS or JWT proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial } from './real-journey-client.mjs';
import { A, B, config, fields, createFixture } from '../tools/fixtures/real-journey-fixture.mjs';

const plan = () => ({ proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' });
const needsApprovals = error => error.status === 409 && error.code === 'INVITATION_NEEDS_CURRENT_APPROVALS';
const statusWrites = (db, from) => db.requests.slice(from).filter(row => row.method === 'PATCH' && row.path.endsWith('/meeting_requests'));
const direct = (db, actor, id, status) => db.fetchFor(actor)('/api/neon/data/meeting_requests?id=eq.' + id, { method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'X-Synera-Client': '1', Prefer: 'return=representation' }, body: JSON.stringify({ status }) });

async function invited() {
  const db = createFixture();
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const reviewed = await a.saveTerms(B, exchangeMaterial(A, B, fields()));
  await a.approveTerms(B, reviewed); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, 'Обговорити перевірений екран', plan())).meetings[0];
  return { db, a, b, meeting };
}

test('a revised agreement blocks acceptance until both approve the current revision; then the same invitation works', async () => {
  const { db, a, b, meeting } = await invited();
  const revised = await a.saveTerms(B, exchangeMaterial(A, B, fields({ take_target: 'Два перевірених екрани' })), await a.pairState(B));
  assert.equal(revised.version, 2);
  let from = db.requests.length;
  await assert.rejects(b.respondInvitation(meeting.id, 'accepted'), needsApprovals);
  assert.deepEqual(statusWrites(db, from), [], 'a known-stale acceptance must not be sent at all');
  assert.equal(db.meetings[0].status, 'pending');
  await assert.rejects(a.conversation(meeting.id), error => error.status === 403);
  await assert.rejects(b.conversation(meeting.id), error => error.status === 403);
  // One approval of the new revision is still not an agreement.
  await a.approveTerms(B, revised);
  await assert.rejects(b.respondInvitation(meeting.id, 'accepted'), needsApprovals);
  assert.equal(db.meetings[0].status, 'pending');
  await b.approveTerms(A, await b.pairState(A));
  const dashboard = await b.respondInvitation(meeting.id, 'accepted');
  assert.equal(dashboard.meetings.find(row => row.id === meeting.id).status, 'accepted');
  await a.sendConversation(meeting.id, 'Після обох підтверджень');
  assert.equal((await b.conversation(meeting.id)).messages.length, 1);
});

test('a withdrawn approval, a closed agreement and an expired agreement each block acceptance; declining stays possible', async () => {
  for (const [name, lapse] of [
    ['withdrawn', async ({ a }) => { await a.withdrawTerms(B, await a.pairState(B)); }],
    ['closed', async ({ a }) => { await a.closeTerms(B, await a.pairState(B)); }],
    ['expired', async ({ db }) => { Object.assign(db.cases[0], { created_at: new Date(Date.now() - 3600000).toISOString(), expires_at: new Date(Date.now() - 1000).toISOString() }); }],
  ]) {
    const world = await invited(), { db, b, meeting } = world;
    await lapse(world);
    const from = db.requests.length;
    await assert.rejects(b.respondInvitation(meeting.id, 'accepted'), needsApprovals, name);
    assert.deepEqual(statusWrites(db, from), [], name);
    assert.equal(db.meetings[0].status, 'pending', name);
    // Refusal never needs an agreement.
    await b.respondInvitation(meeting.id, 'declined');
    assert.equal(db.meetings[0].status, 'declined', name);
  }
});

test('the server decides a race: approval withdrawn after the client check is refused as a recoverable conflict', async () => {
  const { db, b, meeting } = await invited();
  db.controls.beforeMeetingPatch = async () => { db.approvals.find(row => row.party_id === A && !row.withdrawn_at).withdrawn_at = new Date().toISOString(); };
  const from = db.requests.length;
  await assert.rejects(b.respondInvitation(meeting.id, 'accepted'), needsApprovals);
  assert.deepEqual(statusWrites(db, from).map(row => row.status), [409], 'exactly one write reached the server and was refused there');
  assert.equal(db.meetings[0].status, 'pending');
  assert.equal(db.messages.length, 0);
});

test('the transport oracle mirrors the database guard for callers that bypass the client', async () => {
  const { db, a, meeting } = await invited();
  // The sender cannot answer for the recipient, even with a direct request.
  const bySender = await direct(db, A, meeting.id, 'accepted');
  assert.deepEqual(await bySender.json(), []);
  assert.equal(db.meetings[0].status, 'pending');
  await a.saveTerms(B, exchangeMaterial(A, B, fields({ take_target: 'Два перевірених екрани' })), await a.pairState(B));
  const stale = await direct(db, B, meeting.id, 'accepted');
  assert.equal(stale.status, 409);
  assert.equal(db.meetings[0].status, 'pending');
  const declined = await direct(db, B, meeting.id, 'declined');
  assert.equal(declined.status, 200);
  assert.equal(db.meetings[0].status, 'declined');
});
