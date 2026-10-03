import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, archiveSession } from './session-value.mjs';
import { stageJourneyHandoff, takeJourneyHandoff } from './journey-handoff.mjs';
const storage = () => { const map = new Map([['unrelated', 'preserved']]); return { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map }; };
test('one explicit handoff preserves exact transcript and consumes only its own ephemeral item', () => {
  const s = storage(), session = createSession({ sessionId: 'session-example', participantIds: ['you','mara'], notes: [{sourceId:'message-1',text:'Exact words: design + code.',at:1}], outcome: {revision:1,facts:[{sourceId:'demo',text:'Demo, no real meeting.'}]}});
  const archive = archiveSession(session,{archiveId:'archive-example',createdAt:2});
  assert.equal(stageJourneyHandoff(archive,s),'/studio.html#session');
  assert.deepEqual(takeJourneyHandoff(s).session,session);
  assert.equal(takeJourneyHandoff(s),null);
  assert.equal(s.getItem('unrelated'),'preserved');
});
test('malformed handoff cannot be treated as a session or remove unrelated data', () => {
  const s=storage(); assert.throws(()=>stageJourneyHandoff({session:{participantIds:['owner']}},s));
  assert.equal(s.getItem('unrelated'),'preserved');
});
